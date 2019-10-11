const parse = require('./parse')
const optimize = require('./optimize')
const { Add, Move, Print, Read, Loop, Program } = require('./instructions')

const Sync = Symbol('Sync')
const Async = Symbol('Async')
const Callback = Symbol('Callback')

const AsyncFunction = (async function () { }).constructor

/**
 * Compile bf to js function.
 * @param {string} program 
 * @param {*} param1 
 * @returns {function}
 */
const compile = (program, { mode = runtimeMode.Sync, memSize = 30000 }) => {

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
    if (mode !== Callback) return `out += String.fromCharCode(data[ptr]).repeat(${val});`
    else return `callPrint(String.fromCharCode(data[ptr]));`.repeat(val)
  }
  const readImpl = () => {
    if (mode !== Sync) return `data[ptr] = (await read() || '\0').charCodeAt(0);`
    else return 'data[ptr] = input[inPtr++].charCodeAt(0) | 0;\n'
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

const compileToWat = (program) => {

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
  // TODO! fix loopImpl
  const loopImpl = instructions => `
  (loop
  (get_global $ptr)
  (i32.load8_u)
  (if_br 0)
  ${instructions.map(compile).join('\n')}
  )`
  const addImpl = val => `
  (get_global $ptr)
  (get_global $ptr)  
  (i32.load8_u)
  (i32.const ${val})
  (i32.add) 
  (i32.store8)`
  const moveImpl = val => `
  (get_global $ptr)
  (i32.const ${val})
  (i32.add)
  (set_global $ptr)`
  const printImpl = val => `
  (get_global $ptr) 
  (i32.load8_u)
  (i32.const ${val})
  (call $out)`
  const readImpl = val => `
  (get_global $ptr)
  (call $in)
  (i32.store8)`
  const programImpl = val => `
(module
  (import "io" "in" (func $in (result i32)))
  (import "io" "out" (func $out (param i32 i32)))

  (global $ptr (mut i32) (i32.const 0))
  (memory 1000)

  (func $run 
    ${val.map(compile).join('\n')}
  )
  (export "run" (func $run))
)`

  return compile(program)
}
module.exports = { compile, runtimeMode: { Sync, Async, Callback } }