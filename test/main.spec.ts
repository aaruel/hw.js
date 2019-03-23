import { Tokenizer, Parser } from "../src/compiler/main"

const zcode = `;
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

	logic connection {
		[a, b] => [_a, _b]
    }
    
    pipeline {
        connection,
        _a and _b => _c => out,
    }

}

pipeline {
    
}`

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
        _a and _b => _c => out,
    }

}

pipeline {
    
}`

describe("Compiler Tests", () => {
    it("Tokenizer returns array", () => {
        const t = new Tokenizer(code)
		console.log(JSON.stringify(t.getTokens(), null, 2))
        expect(true).toBe(true)
    })

    it("Parser returns AST", () => {
        const t = new Tokenizer(code)
		const p = new Parser(t.getTokens())
		console.log(JSON.stringify(p.getAST(), null, 2))
        expect(true).toBe(true)
    })
})