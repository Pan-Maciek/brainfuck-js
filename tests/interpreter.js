const brain = require('../interpreter')
const { expect } = require('chai')

describe('Basic program', () => {
    it('Empty program ends', async () => {
        let success = false
        await brain('', null, null, async () => { success = true })()
        expect(success).to.be.true
    })
    it('Simple print', async () => {
        let out = ''
        await brain('.', null, async data => { out += data }, async () => { })()
        expect(out).to.be.equal('\u0000')
    })
    it('Simple read', async () => {
        let out = ''
        await brain(',...', async () => 'a', async data => { out += data }, async () => { })()
        expect(out).to.be.equal('aaa')
    })
    it('Simple add', async () => {
        let out = ''
        await brain('+++.', null, async data => { out += data }, async () => { })()
        expect(out).to.be.equal('\u0003')
        out = ''
        await brain('-+++-.', null, async data => { out += data }, async () => { })()
        expect(out).to.be.equal('\u0001')
    })
    it('Simple move', async () => {
        let out = ''
        await brain(',>.', async () => 'a', async data => { out += data }, async () => { })()
        expect(out).to.be.equal('\u0000')
        out = ''
        await brain(',<.', async () => 'a', async data => { out += data }, async () => { })()
        expect(out).to.be.equal('\u0000')
    })
    it('Simple loop', async () => {
        let out = ''
        await brain('++[>+++<-]>.', async () => 'a', async data => { out += data }, async () => { })()
        expect(out).to.be.equal('\u0006')
    })
})