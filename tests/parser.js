const { instructions, parser } = require('../parser')
const { expect } = require('chai')

describe('Basic parsing', () => {
    it('Empty program', () => {
        expect(parser('')).to.deep.equal({ success: true, tokens: [{ op: instructions.end }] })
    })
    it('Addition', () => {
        expect(parser('++ + +')).to.deep.equal({ success: true, tokens: [{ op: instructions.add, val: 4 }, { op: instructions.end }] })
    })
    it('Substraction', () => {
        expect(parser('-  -- -')).to.deep.equal({ success: true, tokens: [{ op: instructions.add, val: -4 }, { op: instructions.end }] })
    })
    it('Addition mixed with substraction', () => {
        expect(parser('+ ---- ++ + -- --')).to.deep.equal({ success: true, tokens: [{ op: instructions.add, val: -4 }, { op: instructions.end }] })
    })
    it('Move ptr r', () => {
        expect(parser('>>> > >> >')).to.deep.equal({ success: true, tokens: [{ op: instructions.move, val: 7 }, { op: instructions.end }] })
    })
    it('Move ptr l', () => {
        expect(parser('<< << << <')).to.deep.equal({ success: true, tokens: [{ op: instructions.move, val: -7 }, { op: instructions.end }] })
    })
    it('Move ptr l and r', () => {
        expect(parser('<< << << < >> >> > >>')).to.deep.equal({ success: true, tokens: [{ op: instructions.move, val: 0 }, { op: instructions.end }] })
    })
    it('Print', () => {
        expect(parser('.. ..')).to.deep.equal({ success: true, tokens: [{ op: instructions.print, val: 4 }, { op: instructions.end }] })
    })
    it('Read', () => {
        expect(parser(',')).to.deep.equal({ success: true, tokens: [{ op: instructions.read }, { op: instructions.end }] })
        expect(parser(',,')).to.deep.equal({ success: true, tokens: [{ op: instructions.read }, { op: instructions.read }, { op: instructions.end }] })
    })
})

describe('Loop grouping', () => {
    it('To litle ] error', () => {
        expect(parser('[+[+').success).to.be.false
        expect(parser('[+]][+').success).to.be.false
    })
    it('To litle [ error', () => {
        expect(parser('][+[+').success).to.be.false
        expect(parser('[]]][+[+').success).to.be.false
    })
    it('Empty grouping', () => {
        expect(parser('[[][[]]][][][]')).to.deep.equal({ success: true, tokens: [{ op: instructions.end }] })
    })
    it('Simple grouping', () => {
        expect(parser('[+++]')).to.deep.equal({ success: true, tokens: [{ op: instructions.loop, val: [{ op: instructions.add, val: 3 }] }, { op: instructions.end }] })
    })
    it('Nested grouping', () => {
        expect(parser('[[++]]')).to.deep.equal({ success: true, tokens: [{ op: instructions.loop, val: [{ op: instructions.loop, val: [{ op: instructions.add, val: 2 }] },] }, { op: instructions.end }] })
    })
})