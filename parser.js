const instructions = {
    add: Symbol('add'),
    move: Symbol('move'),
    print: Symbol('print'),
    read: Symbol('read'),
    loop: Symbol('loop'),
    end: Symbol('end')
}

const reduce = code => {
    code = code.split('')
    switch (code[0]) {
        case '+': case '-':
            return { op: instructions.add, val: code.reduce((acc, val) => val === '+' ? acc + 1 : acc - 1, 0) }
        case '[': return '['
        case ']': return ']'
        case '>': case '<':
            return { op: instructions.move, val: code.reduce((acc, val) => val === '>' ? acc + 1 : acc - 1, 0) }
        case '.':
            return { op: instructions.print, val: code.length }
        case ',':
            return { op: instructions.read }
    }
}

const group = tokens => {
    const stack = []
    const pushList = [stack]
    for (let token of tokens) {
        if (token === '[') {
            let token = { op: instructions.loop, val: [] }
            pushList[0].push(token)
            pushList.unshift(token.val)
        } else if (token === ']') {
            if (pushList.length === 1) return [[], false]
            let loop = pushList.shift()
            if (loop.length === 0) stack.pop()
        } else {
            pushList[0].push(token)
        }
    }

    if (pushList.length === 1) return [stack, true]
    return [[], false]
}

/**
 * @param {string} code 
 * @returns {{ success: boolean, tokens: [{op: sybmol, val:any}]}} 
 */
const parser = code => {
    const [tokens, success] = group(
        code
            // remove comments and invalid characters
            .replace(/[^-+*\\[\]><,.]+/g, '')
            // group operators
            .split(/([-+]+|[><]+|\[|]|\.+|,)/g)
            // remove empty strings from array
            .filter(Boolean)
            // map to operations
            .map(reduce)
    )
    tokens.push({ op: instructions.end })
    return { success, tokens }
}
parser('[[++]]').tokens[0].val //?
module.exports = { parser, instructions }