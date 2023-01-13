import { Diagnostic, DiagnosticBag, DiagnosticSeverity, Range, TextDocument } from "@rdf-toolkit/text";
import { SyntaxToken, SyntaxTokens, SyntaxTokenValue, SyntaxTokenValues, SyntaxTrivia, TokenKind, TriviaKind } from "./syntax.js";

export class TurtleScanner implements IterableIterator<SyntaxToken> {
    //                         1        2             3          4                                                                           5                                     6                                       7                                  8                                  9                              10                             11                 12       13
    private readonly regexp = /([\t ]+)|([#][^\n\r]*)|(\n|\r\n?)|([:A-Z_a-z\P{ASCII}](?:[.]*(?:[\\][ -~]?|[-!$%&/0-9:?A-Z_a-z~\P{ASCII}]))*)|([<](?:[^\n\r<>]*[>]|[^\0- <>]*[>]?))|([-+]?(?:[.0-9]+(?:[Ee][+-]?)?)?[0-9]+)|("""(?:"?"?(?:\\.|[^"\\]))*"?"?"?)|('''(?:'?'?(?:\\.|[^'\\]))*'?'?'?)|("(?:\\[^\n\r]|[^\n\r"\\])*"?)|('(?:\\[^\n\r]|[^\n\r'\\])*'?)|([@][-0-9A-Za-z]*)|(\^\^|.)|$/yu;

    private readonly trivia: SyntaxTrivia[];

    private current: SyntaxTrivia | SyntaxToken;
    private done: boolean;

    constructor(private readonly document: TextDocument, private readonly diagnostics: DiagnosticBag) {
        this.trivia = [];
        this.current = this.scan(this.regexp.exec(this.document.getText()));
        this.done = false;
    }

    private reportError(text: string, offset: number, message: string): void {
        const range: Range = Range.create(
            this.document.positionAt(offset),
            this.document.positionAt(offset + text.length));
        this.diagnostics.add(this.document.uri, Diagnostic.create(range, message, DiagnosticSeverity.Error));
    }

    [Symbol.iterator](): IterableIterator<SyntaxToken> {
        return this;
    }

    next(): IteratorResult<SyntaxToken, void> {
        type Mutable<Type> = {
            -readonly [Key in keyof Type]: Type[Key];
        };

        if (this.done) {
            return { done: true, value: undefined };
        }

        const trivia = this.trivia;
        let current = this.current;

        while (SyntaxTrivia.is(current)) {
            trivia.push(current);
            current = this.scan(this.regexp.exec(this.document.getText()));
        }

        const token: Mutable<SyntaxToken> = current;
        current = this.scan(this.regexp.exec(this.document.getText()));

        if (trivia.length) {
            token.leadingTrivia = trivia.slice();
            trivia.length = 0;
        }

        while (SyntaxTrivia.is(current)) {
            trivia.push(current);
            if (current.kind === TriviaKind.EndOfLine) {
                current = this.scan(this.regexp.exec(this.document.getText()));
                break;
            }
            current = this.scan(this.regexp.exec(this.document.getText()));
        }

        if (trivia.length) {
            token.trailingTrivia = trivia.slice();
            trivia.length = 0;
        }

        this.current = current;
        this.done = token.kind === TokenKind.EndOfFile;
        return { done: false, value: token };
    }

    private scan(m: RegExpExecArray | null): SyntaxTrivia | SyntaxToken {
        if (!m) {
            throw new Error(); // should never happen
        }

        const text = m[0];
        const offset = m.index;

        if (m[1]) {
            return SyntaxTrivia.createWhitespace(text);
        }
        else if (m[2]) {
            return SyntaxTrivia.createComment(text);
        }
        else if (m[3]) {
            return SyntaxTrivia.createEndOfLine(text);
        }
        else if (m[4]) {
            if (text.indexOf(":") < 0) {
                return this.scanKeyword(text, offset);
            }
            else if (text.startsWith("_")) {
                return this.scanBlankNodeLabel(text, offset);
            }
            else if (text.indexOf(":") + 1 === text.length) {
                return this.scanPrefix(text, offset);
            }
            else {
                return this.scanPrefixedName(text, offset);
            }
        }
        else if (m[5]) {
            return this.scanIRIReference(text, offset);
        }
        else if (m[6]) {
            if (text.indexOf("E") >= 0 || text.indexOf("e") >= 0) {
                return this.scanDouble(text, offset);
            }
            else if (text.indexOf(".") >= 0) {
                return this.scanDecimal(text, offset);
            }
            else {
                return this.scanInteger(text, offset);
            }
        }
        else if (m[7]) {
            return this.scanString(TokenKind.STRING_LITERAL_LONG_QUOTE, text, offset);
        }
        else if (m[8]) {
            return this.scanString(TokenKind.STRING_LITERAL_LONG_SINGLE_QUOTE, text, offset);
        }
        else if (m[9]) {
            return this.scanString(TokenKind.STRING_LITERAL_QUOTE, text, offset);
        }
        else if (m[10]) {
            return this.scanString(TokenKind.STRING_LITERAL_SINGLE_QUOTE, text, offset);
        }
        else if (m[11]) {
            return this.scanLanguageTag(text, offset);
        }
        else if (m[12]) {
            return this.scanPunctuator(text, offset);
        }
        else {
            return this.scanEndOfFile(text, offset);
        }
    }

    private scanPunctuator(text: string, offset: number): SyntaxTokens[TokenKind.OpenParen] | SyntaxTokens[TokenKind.CloseParen] | SyntaxTokens[TokenKind.Comma] | SyntaxTokens[TokenKind.Dot] | SyntaxTokens[TokenKind.Semicolon] | SyntaxTokens[TokenKind.OpenBracket] | SyntaxTokens[TokenKind.CloseBracket] | SyntaxTokens[TokenKind.CaretCaret] | SyntaxTokens[TokenKind.BadToken] {
        const kind = textToTokenKind[text];
        if (!kind) {
            return this.createBadToken(text, offset);
        }
        return createToken(kind, text, offset, undefined);
    }

    private scanKeyword(text: string, offset: number): SyntaxTokens[TokenKind.AKeyword] | SyntaxTokens[TokenKind.TrueKeyword] | SyntaxTokens[TokenKind.FalseKeyword] | SyntaxTokens[TokenKind.BaseKeyword] | SyntaxTokens[TokenKind.PrefixKeyword] | SyntaxTokens[TokenKind.BadToken] {
        if (/^a$/ui.test(text)) {
            if (text !== "a") {
                this.reportError(text, offset, "'a' must be lowercase");
            }
            return createToken(TokenKind.AKeyword, text, offset, undefined);
        }
        else if (/^true$/ui.test(text)) {
            if (text !== "true") {
                this.reportError(text, offset, "'true' must be lowercase");
            }
            return createToken(TokenKind.TrueKeyword, text, offset, undefined);
        }
        else if (/^false$/ui.test(text)) {
            if (text !== "false") {
                this.reportError(text, offset, "'false' must be lowercase");
            }
            return createToken(TokenKind.FalseKeyword, text, offset, undefined);
        }
        else if (/^base$/ui.test(text)) {
            return createToken(TokenKind.BaseKeyword, text, offset, undefined);
        }
        else if (/^prefix$/ui.test(text)) {
            return createToken(TokenKind.PrefixKeyword, text, offset, undefined);
        }
        else {
            return this.createBadToken(text, offset);
        }
    }

    private scanIRIReference(text: string, offset: number): SyntaxTokens[TokenKind.IRIREF] {
        let value = SyntaxTokenValue.parse(TokenKind.IRIREF, text);
        if (value === null) {
            this.reportError(text, offset, "bad IRI");
            value = SyntaxTokenValue.getErrorTokenValue(TokenKind.IRIREF);
        }
        return createToken(TokenKind.IRIREF, text, offset, value);
    }

    private scanPrefix(text: string, offset: number): SyntaxTokens[TokenKind.PNAME_NS] {
        let value = SyntaxTokenValue.parse(TokenKind.PNAME_NS, text);
        if (value === null) {
            this.reportError(text, offset, "bad prefix");
            value = SyntaxTokenValue.getErrorTokenValue(TokenKind.PNAME_NS);
        }
        return createToken(TokenKind.PNAME_NS, text, offset, value);
    }

    private scanPrefixedName(text: string, offset: number): SyntaxTokens[TokenKind.PNAME_LN] {
        let value = SyntaxTokenValue.parse(TokenKind.PNAME_LN, text);
        if (value === null) {
            this.reportError(text, offset, "bad prefixed name");
            value = SyntaxTokenValue.getErrorTokenValue(TokenKind.PNAME_LN);
        }
        return createToken(TokenKind.PNAME_LN, text, offset, value);
    }

    private scanBlankNodeLabel(text: string, offset: number): SyntaxTokens[TokenKind.BLANK_NODE_LABEL] {
        let value = SyntaxTokenValue.parse(TokenKind.BLANK_NODE_LABEL, text);
        if (value === null) {
            this.reportError(text, offset, "bad blank node label");
            value = SyntaxTokenValue.getErrorTokenValue(TokenKind.BLANK_NODE_LABEL);
        }
        return createToken(TokenKind.BLANK_NODE_LABEL, text, offset, value);
    }

    private scanLanguageTag(text: string, offset: number): SyntaxTokens[TokenKind.AtBaseKeyword] | SyntaxTokens[TokenKind.AtPrefixKeyword] | SyntaxTokens[TokenKind.LANGTAG] {
        if (/^@base$/ui.test(text)) {
            if (text !== "@base") {
                this.reportError(text, offset, "'@base' must be lowercase");
            }
            return createToken(TokenKind.AtBaseKeyword, text, offset, undefined);
        }
        else if (/^@prefix$/ui.test(text)) {
            if (text !== "@prefix") {
                this.reportError(text, offset, "'@prefix' must be lowercase");
            }
            return createToken(TokenKind.AtPrefixKeyword, text, offset, undefined);
        }
        else {
            let value = SyntaxTokenValue.parse(TokenKind.LANGTAG, text);
            if (value === null) {
                this.reportError(text, offset, "bad language tag");
                value = SyntaxTokenValue.getErrorTokenValue(TokenKind.LANGTAG);
            }
            return createToken(TokenKind.LANGTAG, text, offset, value);
        }
    }

    private scanInteger(text: string, offset: number): SyntaxTokens[TokenKind.INTEGER] {
        let value = SyntaxTokenValue.parse(TokenKind.INTEGER, text);
        if (value === null) {
            this.reportError(text, offset, "bad integer literal");
            value = SyntaxTokenValue.getErrorTokenValue(TokenKind.INTEGER);
        }
        return createToken(TokenKind.INTEGER, text, offset, value);
    }

    private scanDecimal(text: string, offset: number): SyntaxTokens[TokenKind.DECIMAL] {
        let value = SyntaxTokenValue.parse(TokenKind.DECIMAL, text);
        if (value === null || Number.isNaN(value)) {
            this.reportError(text, offset, "bad decimal literal");
            value = SyntaxTokenValue.getErrorTokenValue(TokenKind.DECIMAL);
        }
        return createToken(TokenKind.DECIMAL, text, offset, value);
    }

    private scanDouble(text: string, offset: number): SyntaxTokens[TokenKind.DOUBLE] {
        let value = SyntaxTokenValue.parse(TokenKind.DOUBLE, text);
        if (value === null || Number.isNaN(value)) {
            this.reportError(text, offset, "bad double literal");
            value = SyntaxTokenValue.getErrorTokenValue(TokenKind.DOUBLE);
        }
        return createToken(TokenKind.DOUBLE, text, offset, value);
    }

    private scanString<T extends TokenKind>(kind: T, text: string, offset: number): SyntaxTokens[T] {
        let value: SyntaxTokenValues[T] | null = SyntaxTokenValue.parse(kind, text);
        if (value === null) {
            this.reportError(text, offset, "bad string literal");
            value = SyntaxTokenValue.getErrorTokenValue(kind);
        }
        return createToken(kind, text, offset, value);
    }

    private scanEndOfFile(text: string, offset: number): SyntaxTokens[TokenKind.EndOfFile] {
        return createToken(TokenKind.EndOfFile, text, offset, undefined);
    }

    private createBadToken(text: string, offset: number): SyntaxTokens[TokenKind.BadToken] {
        return createToken(TokenKind.BadToken, text, offset, text);
    }
}

const textToTokenKind: { readonly [text: string]: TokenKind.OpenParen | TokenKind.CloseParen | TokenKind.Comma | TokenKind.Dot | TokenKind.Semicolon | TokenKind.OpenBracket | TokenKind.CloseBracket | TokenKind.CaretCaret | undefined } = {
    "(": TokenKind.OpenParen,
    ")": TokenKind.CloseParen,
    ",": TokenKind.Comma,
    ".": TokenKind.Dot,
    ";": TokenKind.Semicolon,
    "[": TokenKind.OpenBracket,
    "]": TokenKind.CloseBracket,

    "^^": TokenKind.CaretCaret,
};

function createToken<T extends TokenKind>(kind: T, text: string, offset: number, value: SyntaxTokenValues[T]): SyntaxTokens[T] {
    const leadingTrivia: readonly SyntaxTrivia[] = [];
    const trailingTrivia: readonly SyntaxTrivia[] = [];
    return { kind, leadingTrivia, offset, text, trailingTrivia, value } as SyntaxTokens[T];
}
