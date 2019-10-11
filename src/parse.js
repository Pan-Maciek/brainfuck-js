const { Add, Move, Print, Read, Loop, Program } = require('./instructions')

const parse = code => {
  function* parse(code, state) {
    for (; state.i < code.length; state.i++) {
      switch (code[state.i]) {
        case '+': yield { type: Add, val: 1 }; break
        case '-': yield { type: Add, val: -1 }; break
        case '.': yield { type: Print, val: 1 }; break
        case ',': yield { type: Read }; break
        case '>': yield { type: Move, val: 1 }; break
        case '<': yield { type: Move, val: -1 }; break
        case '[':
          state.i++
          const block = [...parse(code, state)]
          if (block.length !== 0) yield { type: Loop, val: block };
          if (code[state.i] !== ']') throw new Error(`[] not matching at char ${state.i}`)
          break
        case ']': return
      }
    }
  }
  return { type: Program, val: [...parse(code, { i: 0 })] }
}

module.exports = parse