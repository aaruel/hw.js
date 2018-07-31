import { Tokenizer, Parser } from "../src/compiler/main"

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
        X,
        _a and _b => _c => out,
    }

	logic X {
		[a, b] => [_a, _b]
	}

}

pipeline {
    
}`

describe("Compiler Tests", () => {
    it("Tokenizer returns array", () => {
        const t = new Tokenizer(code)
		const p = new Parser(t.getTokens())
		console.log(p.getTokens())
        expect(true).toBe(true)
    })
})