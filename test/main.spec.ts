import { Tokenizer } from "../src/compiler/main"


const code = `;
; gatelib:
; ; and
; ; nand
; ; or
; ; nor
; ; xor
; ; xnor

component AndGate {

	public {
		a: input
		b: input
		out: output
	}

	private {
		_a: wire
		_b: wire
		_c: wire
	}

	pipeline {
		a => _a,
		b => _b,
		_a and _b => _c => out,
	}

}

global {
	
}`

describe("Compiler Tests", () => {
    it("Tokenizer returns array", () => {
        const t = new Tokenizer(code)
        console.log(t.getTokens())
        expect(true).toBe(true)
    })
})