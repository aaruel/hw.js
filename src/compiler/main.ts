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
    // variable name
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
class ExpressionDeclaration extends BaseDeclaration {types = "ExpressionDeclaration"}

/* 
Parse tokenized string with decision tree


ProgramDeclaration {
    body: {
        Variable {
            body: {}
        },
        
    }
}

*/

export class Parser {
    private charTable: Object = {
        // Blocks
        "{": 1,
        "}": 1,
        // Operators
        "and": 1,
        "nand": 1,
        "or": 1,
        "nor": 1,
        "xor": 1,
        "xnor": 1,
        "=>": 1,
        ":": 1,
        ",": 1,
        // Modules
        "component": 1,
        "global": 1,
        // Modifiers
        "public": 1,
        "private": 1,
        "pipeline": 1,
        // Types
        "input": 1,
        "output": 1,
        "wire": 1,
    }

    root: Object = {
        // Text Value level
        "component": () => this.parseNamedBlock(ComponentDeclaration),
        "public": () => this.parseBlock(PublicDeclaration, this.parse.bind(this)),
        "private": () => this.parseBlock(PrivateDeclaration, this.parse.bind(this)),
        "pipeline": () => this.parseBlock(PipelineDeclaration, this.pipelineParser.bind(this)),
        "logic": () => this.parseNamedBlock(LogicDeclaration)
    }

    rootNoRes: Object = {
        ":": this.parseVariable
    }

    operatorPrecedence: Object = {
        "and": 2,
        "=>":  1,
    }

    private infixParser(group: Array<string>): Node {
        const isOp = (op) => this.operatorPrecedence.hasOwnProperty(op)
        const getPrec = (op) => this.operatorPrecedence[op]
        const shunter = () : Node => {
            let valstack = []
            let opstack = []

            const process = () => {
                let val1 = valstack.shift()
                let op = opstack.shift()
                let val2 = valstack.shift()
                valstack.push(new BaseOperator(op, val1, val2))
            }

            const evaluate = (token: string) => {
                if (!isOp(token)) {
                    valstack.push(token)
                }
                // if opstack is empty
                else if (!opstack.length) {
                    opstack.push(token)
                }
                // if opstack is occupied
                else if (!opstack.length && getPrec(token) > getPrec(opstack[0])) {
                    opstack.push(token)
                }
                else {
                    process()
                    // still have to deal with the token
                    evaluate(token)
                }
            }

            for (let token of group) {
                evaluate(token)
            }
            
            // continue to process until opstack is empty
            while (opstack.length) {
                process()
            }

            return valstack.shift()
        }

        return shunter()
    }

    private pipelineParser(): Node {
        // group each entry
        let group = []
        while (
            this.current().value != "}"
            && this.current().value != ","
        ) {
            group.push(this.current().value)
            this.next()
        }

        // pointing at } or ,

        this.next()

        // pointing at next value

        // if expression identifier
        if (group.length == 1) {
            return new ExpressionDeclaration(group.shift())
        }
        // binary infix expession
        else if (group.length > 1) {
            const exp = new ExpressionDeclaration()
            exp.pushNode(this.infixParser(group))
            return exp
        }
        else {
            this.error()
        }
    }

    private parseVariable(ident: string): BaseVariable {
        const type = this.next().value

        // pointing at type

        this.next()

        // pointing at next value

        return new BaseVariable(ident, type)
    }

    private parseNamedBlock<T extends BaseDeclaration>(_type: { new(ident: string): T }) : T {
        const blockName = this.next().value

        // pointing at component name

        const brace = this.next().value

        // pointing at brace

        this.next()

        // pointing at next value

        if (this.charTable.hasOwnProperty(blockName)) this.error()
        if (brace != "{") this.error()
        const component = new _type(blockName)

        // recurse
        while (this.current().value != "}") {
            component.pushNode(this.parse())
        }

        // advance from brace
        this.next()
        
        return component
    }

    private parseBlock<T extends BaseDeclaration>(_type: { new(): T }, parser: Function) : T {
        const brace = this.next().value
        
        // pointing at brace

        this.next()

        // pointing at next value

        if (brace != "{") this.error()
        const decl = new _type()

        // recurse
        while (this.current().value != "}") {
            decl.pushNode(parser())
        }

        // advance from brace
        this.next()
        
        return decl
    }

    private error(name: string = "error") { throw Error(name) }

    private i: number = 0
    private tokens: Array<Token> = []
    private ast: ProgramDeclaration = new ProgramDeclaration()
    private next = () => this.tokens[++this.i]
    private current = () => this.tokens[this.i]
    private isReservedKeyword = (value) => this.charTable.hasOwnProperty(value)
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

    public getAST() {
        return this.ast
    }

    private parse(): Node {
        // should point to the beginning of an AST node
        const current = this.current().value

        // test if reserved keyword
        if (this.isReservedKeyword(current)) {
            return this.root[current].bind(this)()
        }
        // identifier
        else {
            const next = this.next().value
            return this.rootNoRes[next].bind(this)(current)
        }
    }

    private detectOperatorsXform(tokens: Array<Token>): Array<Token> {
        return tokens.map((token) => {
            if (this.operators.test(token.value)) token.type = "operator"
            return token
        })
    }
}