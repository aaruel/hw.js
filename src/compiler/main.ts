import { identity } from "rxjs";

interface Token {
    type: string
    value: string
}

const getErrorPosition = (code: string, position: number) => {
    const getLine = (preerror) => {
        let l = preerror.match(/(\n)/gm)
        if (l) return l.length + 1
        else return 1
    }

    const getHpos = (preerror) => {
        let l = preerror.slice(preerror.lastIndexOf("\n"))
        if (l != -1) return l.length - 1
        else return preerror.length - 1
    }

    let preerror = code.slice(0, position + 1)
    let line = getLine(preerror)
    let hpos = getHpos(preerror)
    return {line, hpos}
}

// Run on initialization
export class Tokenizer {
    private i: number = 0
    private code: string
    private tokens: Array<Token> = []
    private next = () => this.code[++this.i]
    private current = () => this.code[this.i]
    private increment = () => ++this.i
    private isUseless = (char: string) => /[\n\r\s]/.test(char)
    private isText = (char: string) => /[a-zA-Z_]/.test(char)
    private isBraces = (char: string) => /[{}]/.test(char)
    private isSpecial = (char: string) => /[\[=>:,\]]/.test(char)

    public constructor(code: string) {
        this.code = code
        while (this.current()) {
            this.tokens.push(this.parse())
        }
    }

    public getTokens() {
        return this.tokens
    }

    // Tokenizer : Machine classifying each token
    private parse(): Token {
        let char = this.current()

        if (char === ";") {
            this.skipLineComment()
            return this.parse()
        }

        if (this.isUseless(char)) {
            this.increment()
            return this.parse()
        }

        if (this.isText(char)) {
            return this.parseText()
        }

        if (this.isSpecial(char)) {
            return this.parseSpecial()
        }

        if (this.isBraces(char)) {
            this.increment()
            return this.bracesToken(char)
        }

        this.error()
    }

    // Text : Variable Names, Operators, Keywords
    private parseText(): Token {
        let value = this.current()
        let current = this.next()
        while (this.isText(current)) {
            value = value.concat(current)
            current = this.next()
        }
        return this.textToken(value)
    }

    private textToken(value: string): Token {
        return {type: "text", value}
    }

    // Braces : "{" to begin a scope and "}" to end a scope
    private bracesToken(value: string): Token {
        return {type: "braces", value}
    }

    // Special : Any character that doesn't fit in the above (classified as text)
    private parseSpecial(): Token {
        let value = this.current()
        let current = this.next()
        while (this.isSpecial(current)) {
            value = value.concat(current)
            current = this.next()
        }
        return this.specialToken(value)
    }

    private specialToken(value: string): Token {
        return this.textToken(value)
    }

    // Line Comment : Discard rest of line with ";"
    private skipLineComment(): void {
        while (this.next() != "\n") {}
        this.increment()
    }

    // Error : Unidentified character
    private error(): void {
        const err = getErrorPosition(this.code, this.i)
        throw `There was an unidentified character @ l${err.line} : p${err.hpos}\n`
    }
}

// AST Data Organization

// Base Interfaces

interface Node {
    type: string
}

interface Identifier extends Node {
    identifier: string
}

interface Declaration extends Identifier {
    body: Array<Node>
}

interface Variable extends Identifier {
    datatype: string
}

interface Operator extends Node {
    operator: string
    left: Node | {}
    right: Node | {}
}

// Base Classes

class BaseDeclaration implements Declaration {
    type = ""
    identifier = ""
    body = []

    constructor(ident: string = "") {
        this.identifier = ident
    }

    pushNode(o: Node): void {
        this.body.push(o)
    }
}

class BaseVariable implements Variable {
    type = "Variable"
    identifier = ""
    datatype = ""

    constructor(ident: string, datatype: string) {
        this.identifier = ident
        this.datatype = datatype
    }
}

class BaseOperator implements Operator {
    type = "Operator"
    operator = ""
    left = {}
    right = {}

    constructor(operator: string, left: Node, right: Node) {
        this.operator = operator
        this.left = left
        this.right = right
    }
}

// Syntax Declarations

class ProgramDeclaration extends BaseDeclaration {type = "Program"}
class ComponentDeclaration extends BaseDeclaration {type = "ComponentDeclaration"}
class PipelineDeclaration extends BaseDeclaration {type = "PipelineDeclaration"}
class PublicDeclaration extends BaseDeclaration {type = "PublicDeclaration"}
class PrivateDeclaration extends BaseDeclaration {type = "PrivateDeclaration"}
class LogicDeclaration extends BaseDeclaration {type = "LogicDeclaration"}

export class Parser {
    private i: number = 0
    private tokens: Array<Token> = []
    private ast: ProgramDeclaration = new ProgramDeclaration()
    private next = () => this.tokens[++this.i]
    private current = () => this.tokens[this.i]
    private charTable: Object = {
        // Blocks
        "{": 0,
        "}": 0,
        // Operators
        "and": 0,
        "nand": 0,
        "or": 0,
        "nor": 0,
        "xor": 0,
        "xnor": 0,
        "=>": 0,
        ":": 0,
        ",": 0,
        // Modules
        "component": 0,
        "global": 0,
        // Modifiers
        "public": 0,
        "private": 0,
        "pipeline": 0,
        // Types
        "input": 0,
        "output": 0,
        "wire": 0,
    }
    private operators: RegExp = /and|nand|or|nor|xor|xnor|=>/

    constructor(tokens: Array<Token>) {
        this.tokens = this.detectOperatorsXform(tokens)
        while (this.current()) {
            this.ast.body.push(this.parse())
        }
    }

    public getTokens() {
        return this.tokens
    }

    private parse(): Node {
        
    }

    private detectOperatorsXform(tokens: Array<Token>): Array<Token> {
        return tokens.map((token) => {
            if (this.operators.test(token.value)) token.type = "operator"
            return token
        })
    }
}