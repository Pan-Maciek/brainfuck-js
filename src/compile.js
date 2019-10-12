const parse = require('./parse')
const optimize = require('./optimize')
const wabt = require("wabt")()
const fs = require('fs')
const { Add, Move, Print, Read, Loop, Program } = require('./instructions')
const { abs } = Math

const Sync = Symbol('Sync')
const Async = Symbol('Async')
const Callback = Symbol('Callback')
const Wat = Symbol('Wat')
const Wasm = Symbol('Wasm')
const WasmFunction = Symbol('WasmFunction')

const AsyncFunction = (async function () { }).constructor

/**
 * Compile bf to js function.
 * @param {string} program 
 * @param {*} param1 
 * @returns {function}
 */
const compile = (program, { mode = Sync, memSize = 30000 }) => {
  if (mode === Wat) return compileToWat(program, { memSize })
  if (mode === Wasm) return compileToWasm(program, { memSize })
  if (mode === WasmFunction) return compileToWasmFunction(program, { memSize })
  const compile = ({ type, val }) => {
    switch (type) {
      case Loop: return loopImpl(val)
      case Add: return val !== 0 ? addImpl(val) : ''
      case Move: return val !== 0 ? moveImpl(val) : ''
      case Print: return printImpl(val)
      case Read: return readImpl()
      case Program: return programImpl(val)
    }
  }

  //#region Implementations of instructions

  const loopImpl = instructions => `while (data[ptr]) { ${instructions.map(compile).join('')} }`
  const addImpl = val => `data[ptr] += ${val};`
  const moveImpl = val => `ptr += ${val};`
  const printImpl = val => {
    if (mode !== Callback) return `var char = String.fromCharCode(data[ptr]).repeat(${val}); out += char; if(char[0] === '\\0') return out;`
    else return `var char = String.fromCharCode(data[ptr]); callPrint(char); if(char[0] === '\\0') return;`.repeat(val)
  }
  const readImpl = () => {
    if (mode !== Sync) return `data[ptr] = (await read() || '\0').charCodeAt(0);`
    else return 'data[ptr] = input.charCodeAt(inPtr++) | 0;'
  }
  const runtimeInit = () => {
    const memory = `let data = new Uint8Array(${memSize}), ptr = 0;`
    if (mode === Sync) return `${memory}; let out = '', inPtr = 0;`
    if (mode === Async) return `${memory}; let out = '';`
    if (mode === Callback) return `${memory}; let read = () => new Promise(async resolve => { resolve(await callRead()) }), out = undefined;`
  }
  const programImpl = val => `${runtimeInit()}${val.map(compile).join('')}return out;`

  //#endregion

  const code = compile(optimize(parse(program)))
  switch (mode) {
    case Sync: return Function('input', code)
    case Async: return AsyncFunction('read', code)
    case Callback: return AsyncFunction('callPrint', 'callRead', code)
  }
}

const fixIndent = (n) => instruction => instruction.split('\n').map(x => `${n}${x}`).join('\n')

const compileToWat = (program, { memSize }) => {

  const compile = ({ type, val }) => {
    switch (type) {
      case Loop: return loopImpl(val)
      case Add: return val !== 0 ? addImpl(val) : ''
      case Move: return val !== 0 ? moveImpl(val) : ''
      case Print: return printImpl(val)
      case Read: return readImpl()
      case Program: return programImpl(val)
    }
  }

  const loopImpl = instructions => `(block
  (loop
    get_local $ptr
    i32.load8_u
    i32.const 0
    i32.eq
    br_if 1
${instructions.map(compile).map(fixIndent('    ')).join('\n')}
    get_local $ptr
    i32.load8_u
    br_if 0))`
  const addImpl = val => `get_local $ptr
get_local $ptr  
i32.load8_u
i32.const ${abs(val)}
i32.${val > 0 ? 'add' : 'sub'} 
i32.store8`
  const moveImpl = val => `get_local $ptr
i32.const ${val}
i32.add
set_local $ptr`
  const printImpl = val => `get_local $ptr
(if (i32.eq (i32.load8_u) (i32.const 0)) (return))
get_local $ptr
i32.load8_u
i32.const ${val}
call $out`
  const readImpl = val => `get_local $ptr
call $in
i32.store8`
  const programImpl = val => `(module
(import "io" "in" (func $in (result i32)))
(import "io" "out" (func $out (param i32 i32)))

(global $ptr (mut i32) (i32.const 0))
(memory ${memSize})

(func $run 
  (local $ptr i32)
  i32.const 0
  set_local $ptr

${val.map(compile).map(fixIndent('  ')).join('\n')})
(export "run" (func $run)))`
  return compile(optimize(parse(program)))
}

const compileToWasm = (program, { memSize }) => {
  const wat = compileToWat(program, { memSize })
  const tmpFile = `tmp_${new Date().getTime()}.wat`
  return wabt.parseWat(tmpFile, wat).toBinary({}).buffer
}

const compileToWasmFunction = (program, { memSize }) => {
  const wasm = program = compileToWasm(program, { memSize })
  let input, inputPtr, out
  return WebAssembly.instantiate(wasm, {
    io: {
      out(a, b) { out += (String.fromCharCode(a).repeat(b)) },
      in() { return input.charCodeAt(inputPtr++) | 0 }
    }
  }).then(result => (userInput) => {
    inputPtr = 0
    input = userInput
    out = ''
    result.instance.exports.run()
    return out
  })
}

module.exports = { compile, runtimeMode: { Sync, Async, Callback, Wasm, Wat, WasmFunction } }