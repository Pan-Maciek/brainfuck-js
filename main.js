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
            return { op: instructions.add, val: code.reduce((acc, val) => acc + (val === '+' ? 1 : -1), 0) }
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
const parse = code => {
    const [tokens, success] = group(code
        // remove comments and invalid characters
        .replace(/[^-+*\\[\]><,.]+/g, '')
        // group operators
        .split(/([-+]+|[><]+|\[|]|\.+|,)/g)
        // remove empty strings from array
        .filter(Boolean)
        // map to operations
        .map(reduce))
    tokens.push({ op: instructions.end })
    return { success, tokens }
}

const AsyncFunction = (...args) => (async function () { }).constructor(...args)
const compile = (tokens) => {
    const compileSegment = tokens => {
        let code = ''
        for (let { op, val } of tokens) {
            switch (op) {
                case instructions.loop:
                    code += `while(data[ptr]) {\n${compileSegment(val)}\n};`
                    break;
                case instructions.add:
                    if (val !== 0) code += `data[ptr] = (data[ptr] + ${val + 256}) % 256;\n`
                    break
                case instructions.move:
                    if (val !== 0) code += `ptr += ${val};\n`
                    break
                case instructions.print:
                    code += `print(String.fromCharCode(data[ptr]).repeat(${val}));\n`
                    break
                case instructions.read:
                    code += 'data[ptr] = (await read()).charCodeAt(0);\n'
                    break
            }
        }
        return code
    }
    const program = `const data = Array.from({length: 30000}, ()=>0); let ptr = 0;\n ${compileSegment(tokens)} return data;`
    return AsyncFunction('print', 'read', program)
}

module.exports = { parser: parse, instructions, compile }