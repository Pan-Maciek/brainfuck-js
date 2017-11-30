const { instructions, parser } = require('./parser')

const createProgram = (code, stdin, stdout, end) => {
    const { success, tokens } = parser(code)
    if (!success) return { error: true, description: 'Parsing error occurred.' }

    let memory = [0], dataPtr = 0, out = ''

    const run = async instructions => {
        for (let instruction of instructions)
            await instruction()
        return out
    }

    const compile = tokens => tokens.map(({ op, val }) => {
        switch (op) {
            case instructions.add:
                return () => (memory[dataPtr] = (memory[dataPtr] + val + 256) % 256)
            case instructions.end:
                return async () => await end(out)
            case instructions.loop: {
                const program = compile(val)
                return async () => {
                    while (memory[dataPtr] !== 0)
                    await run(program)
                }
            }
            case instructions.move:
                return () => {
                    if (memory[dataPtr += val] === undefined)
                        memory[dataPtr] = 0
                }
            case instructions.print:
                return async () => await stdout(out += String.fromCharCode(memory[dataPtr] || 0).repeat(val))
            case instructions.read:
                return async () => memory[dataPtr] = (await stdin()).charCodeAt(0)
        }
    })
    const program = compile(tokens) //?
    return async () => {
        memory = [0]
        dataPtr = 0
        out = ''
        await run(program)
    }
}

module.exports = createProgram
