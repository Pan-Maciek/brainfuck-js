const { Add, Move, Print, Read, Loop, Program } = require('./instructions')

/** Simple optimizations, mainly constant folding. */
const optimize = program => {
  const optimize = tokens => {
    if (tokens.length === 0) return []
    if (tokens.length > 1) {
      const [{ type: aType, val: aVal }, { type: bType, val: bVal }, ...xs] = tokens
      if (aType === Add && bType === Add)
        if (aVal + bVal) return optimize([{ type: Add, val: aVal + bVal }, ...xs])
        else return optimize(xs)
      if (aType === Move && bType === Move)
        if (aVal + bVal) return optimize([{ type: Move, val: aVal + bVal }, ...xs])
        else return optimize(xs)
      if (aType === Print && bType === Print)
        return optimize([{ type: Print, val: aVal + bVal }, ...xs])
    }
    const [a, ...xs] = tokens
    if (a.type === Loop) return [{ type: Loop, val: optimize(a.val) }, ...optimize(xs)]
    return [a, ...optimize(xs)]
  }
  return { type: Program, val: optimize(program.val) }
}

module.exports = optimize