import { Rdf } from "@rdf-toolkit/rdf/vocab";
import { Diagnostic, DiagnosticBag, DiagnosticSeverity, Range, TextDocument } from "@rdf-toolkit/text";
import { AnonSyntax, BlankNodePropertyListSyntax, DatatypeAnnotationSyntax, DocumentSyntax, IRISyntax, LanguageTagSyntax, ObjectListSyntax, ObjectListTailSyntax, ObjectSyntax, PredicateObjectListSyntax, PredicateObjectListTailSyntax, PredicateSyntax, StatementSyntax, SubjectSyntax, SyntaxKind, SyntaxToken, SyntaxTokens, SyntaxTokenValue, SyntaxTokenValues, TokenKind, TriplesSyntax, VerbObjectListSyntax } from "./syntax.js";

export class TurtleParser {
    private readonly iterator: Iterator<SyntaxToken>;

    private current: SyntaxToken;
    private faulty: boolean;

    constructor(tokens: Iterable<SyntaxToken>, private readonly document: TextDocument, private readonly diagnostics: DiagnosticBag) {
        this.iterator = tokens[Symbol.iterator]();
        this.current = this.scan();
        this.faulty = false;
    }

    private reportError(message: string): void {
        if (!this.faulty) {
            const range: Range = Range.create(
                this.document.positionAt(this.current.offset),
                this.document.positionAt(this.current.offset + this.current.text.length));
            this.diagnostics.add(this.document.uri, Diagnostic.create(range, message, DiagnosticSeverity.Error));
            this.faulty = true;
        }
    }

    private scan(): SyntaxToken {
        return this.iterator.next().value;
    }

    private expect<T extends TokenKind>(kind: T): SyntaxTokens[T] {
        const token: SyntaxToken = this.current;
        if (SyntaxToken.is(token, kind)) {
            this.current = this.scan();
            this.faulty = false;
            return token;
        }
        else if (token.kind === TokenKind.BadToken && kind === TokenKind.PNAME_NS) {
            this.reportError("unexpected input");
            this.current = this.scan();
            return rewriteSyntaxToken(token, TokenKind.PNAME_NS, SyntaxTokenValue.getErrorTokenValue(TokenKind.PNAME_NS)) as SyntaxTokens[T];
        }
        else if (token.kind === TokenKind.PNAME_LN && kind === TokenKind.PNAME_NS) {
            this.reportError("prefix expected");
            this.current = this.scan();
            return rewriteSyntaxToken(token, TokenKind.PNAME_NS, { prefixLabel: token.value.prefixLabel }) as SyntaxTokens[T];
        }
        else if (token.kind === TokenKind.AKeyword && kind === TokenKind.IRIREF) {
            this.reportError("'a' can only be used as a verb");
            this.current = this.scan();
            return rewriteSyntaxToken(token, TokenKind.IRIREF, Rdf.type) as SyntaxTokens[T];
        }
        else if (token.kind === TokenKind.BadToken && kind === TokenKind.IRIREF) {
            this.reportError("unexpected input");
            this.current = this.scan();
            return SyntaxToken.createMissing(kind);
        }
        else if (token.kind === TokenKind.BLANK_NODE_LABEL && kind === TokenKind.IRIREF) {
            this.reportError("blank nodes cannot be used as a verb");
            this.current = this.scan();
            return rewriteSyntaxToken(token, TokenKind.IRIREF, { scheme: "http", authority: "example.com", path: "/.well-known/genid/" + this.current.value }) as SyntaxTokens[T];
        }
        else if (token.kind === TokenKind.BadToken) {
            this.reportError("unexpected input");
            return SyntaxToken.createMissing(kind);
        }
        else {
            switch (kind) {
                case TokenKind.OpenParen: this.reportError("( expected"); break;
                case TokenKind.CloseParen: this.reportError(") expected"); break;
                case TokenKind.Dot: this.reportError(". expected"); break;
                case TokenKind.OpenBracket: this.reportError("[ expected"); break;
                case TokenKind.CloseBracket: this.reportError("] expected"); break;
                case TokenKind.IRIREF: this.reportError("IRI expected"); break;
                case TokenKind.PNAME_NS: this.reportError("prefix expected"); break;
                case TokenKind.PNAME_LN: this.reportError("prefixed name expected"); break;
                default: this.reportError(`TokenKind.${TokenKind[kind]} expected`); break;
            }
            return SyntaxToken.createMissing(kind);
        }
    }

    parse(): DocumentSyntax {
        return this.parseDocument();
    }

    private parseDocument(): DocumentSyntax {
        const statements: StatementSyntax[] = [];
        while (this.current.kind !== TokenKind.EndOfFile) {
            const token = this.current;
            statements.push(this.parseStatement());
            if (token === this.current) {
                throw new Error(); // should never happen unless a bug prevents the loop from making progress
            }
        }
        return {
            kind: SyntaxKind.Document,
            statements,
            endOfFile: this.expect(this.current.kind),
        };
    }

    private parseStatement(): StatementSyntax {
        switch (this.current.kind) {
            case TokenKind.AtPrefixKeyword:
                return {
                    kind: SyntaxKind.PrefixDirective,
                    keyword: this.expect(this.current.kind),
                    prefixLabel: this.expect(TokenKind.PNAME_NS),
                    iriReference: this.expect(TokenKind.IRIREF),
                    dotToken: this.expect(TokenKind.Dot),
                };
            case TokenKind.AtBaseKeyword:
                return {
                    kind: SyntaxKind.BaseDirective,
                    keyword: this.expect(this.current.kind),
                    iriReference: this.expect(TokenKind.IRIREF),
                    dotToken: this.expect(TokenKind.Dot),
                };
            case TokenKind.BaseKeyword:
                return {
                    kind: SyntaxKind.SparqlBaseDirective,
                    keyword: this.expect(this.current.kind),
                    iriReference: this.expect(TokenKind.IRIREF),
                };
            case TokenKind.PrefixKeyword:
                return {
                    kind: SyntaxKind.SparqlPrefixDirective,
                    keyword: this.expect(this.current.kind),
                    prefixLabel: this.expect(TokenKind.PNAME_NS),
                    iriReference: this.expect(TokenKind.IRIREF),
                };
            default:
                return this.parseTriples();
        }
    }

    private parseTriples(): TriplesSyntax {
        switch (this.current.kind) {
            case TokenKind.OpenBracket:
                const blankNode = this.parseAnonOrBlankNodePropertyList();
                if (blankNode.kind === SyntaxKind.BlankNodePropertyList) {
                    return {
                        kind: SyntaxKind.BlankNodePredicateObjectList,
                        blankNode: blankNode,
                        predicateObjectList: this.parseOptionalPredicateObjectList(),
                        dotToken: this.expect(TokenKind.Dot),
                    };
                }
                else {
                    return {
                        kind: SyntaxKind.SubjectPredicateObjectList,
                        subject: blankNode,
                        predicateObjectList: this.parsePredicateObjectList(),
                        dotToken: this.expect(TokenKind.Dot),
                    };
                }
            default:
                return {
                    kind: SyntaxKind.SubjectPredicateObjectList,
                    subject: this.parseSubject(),
                    predicateObjectList: this.parsePredicateObjectList(),
                    dotToken: this.expect(TokenKind.Dot),
                };
        }
    }

    private parseAnonOrBlankNodePropertyList(): AnonSyntax | BlankNodePropertyListSyntax {
        const openBracketToken = this.expect(TokenKind.OpenBracket);
        switch (this.current.kind) {
            case TokenKind.CloseBracket:
                return {
                    kind: SyntaxKind.Anon,
                    openBracketToken,
                    closeBracketToken: this.expect(TokenKind.CloseBracket),
                };
            default:
                return {
                    kind: SyntaxKind.BlankNodePropertyList,
                    openBracketToken,
                    predicateObjectList: this.parsePredicateObjectList(),
                    closeBracketToken: this.expect(TokenKind.CloseBracket),
                }
        }
    }

    private parseOptionalPredicateObjectList(): PredicateObjectListSyntax | undefined {
        switch (this.current.kind) {
            case TokenKind.Dot:
                return;
            default:
                return this.parsePredicateObjectList();
        }
    }

    private parsePredicateObjectList(): PredicateObjectListSyntax {
        return {
            kind: SyntaxKind.PredicateObjectList,
            verbObjectList: this.parseVerbObjectList(),
            tail: this.parseOptionalPredicateObjectListTail(),
        };
    }

    private parseOptionalPredicateObjectListTail(): PredicateObjectListTailSyntax | undefined {
        switch (this.current.kind) {
            case TokenKind.Semicolon:
                return {
                    kind: SyntaxKind.PredicateObjectListTail,
                    semicolonToken: this.expect(this.current.kind),
                    verbObjectList: this.parseOptionalVerbObjectList(),
                    tail: this.parseOptionalPredicateObjectListTail(),
                };
            default:
                return;
        }
    }

    private parseOptionalVerbObjectList(): VerbObjectListSyntax | undefined {
        switch (this.current.kind) {
            case TokenKind.Dot:
            case TokenKind.CloseBracket:
                return;
            default:
                return this.parseVerbObjectList();
        }
    }

    private parseVerbObjectList(): VerbObjectListSyntax {
        return {
            kind: SyntaxKind.VerbObjectList,
            verb: this.parsePredicate(),
            objectList: this.parseObjectList(),
        };
    }

    private parseObjectList(): ObjectListSyntax {
        return {
            kind: SyntaxKind.ObjectList,
            object: this.parseObject(),
            tail: this.parseOptionalObjectListTail(),
        };
    }

    private parseOptionalObjectListTail(): ObjectListTailSyntax | undefined {
        switch (this.current.kind) {
            case TokenKind.Comma:
                return {
                    kind: SyntaxKind.ObjectListTail,
                    commaToken: this.expect(this.current.kind),
                    object: this.parseObject(),
                    tail: this.parseOptionalObjectListTail(),
                };
            default:
                return;
        }
    }

    private parseSubject(): SubjectSyntax {
        switch (this.current.kind) {
            case TokenKind.AKeyword:
                return {
                    kind: SyntaxKind.IRIReference,
                    token: this.expect(TokenKind.IRIREF),
                };
            case TokenKind.OpenParen:
            case TokenKind.CloseParen:
                return {
                    kind: SyntaxKind.Collection,
                    openParenToken: this.expect(TokenKind.OpenParen),
                    objects: this.parseObjects(),
                    closeParenToken: this.expect(TokenKind.CloseParen),
                };
            case TokenKind.OpenBracket:
                throw new Error(); // should never happen
            case TokenKind.BadToken:
            case TokenKind.IRIREF:
                return {
                    kind: SyntaxKind.IRIReference,
                    token: this.expect(TokenKind.IRIREF),
                };
            case TokenKind.PNAME_NS:
                return {
                    kind: SyntaxKind.PrefixedName,
                    token: this.expect(this.current.kind),
                };
            case TokenKind.PNAME_LN:
                return {
                    kind: SyntaxKind.PrefixedName,
                    token: this.expect(this.current.kind),
                };
            case TokenKind.BLANK_NODE_LABEL:
                return {
                    kind: SyntaxKind.BlankNodeLabel,
                    token: this.expect(this.current.kind),
                };
            default:
                this.reportError("missing subject");
                return {
                    kind: SyntaxKind.IRIReference,
                    token: SyntaxToken.createMissing(TokenKind.IRIREF),
                };
        }
    }

    private parsePredicate(): PredicateSyntax {
        switch (this.current.kind) {
            case TokenKind.AKeyword:
                return {
                    kind: SyntaxKind.A,
                    keyword: this.expect(this.current.kind),
                };
            case TokenKind.BadToken:
            case TokenKind.IRIREF:
                return {
                    kind: SyntaxKind.IRIReference,
                    token: this.expect(TokenKind.IRIREF),
                };
            case TokenKind.PNAME_NS:
                return {
                    kind: SyntaxKind.PrefixedName,
                    token: this.expect(this.current.kind),
                };
            case TokenKind.PNAME_LN:
                return {
                    kind: SyntaxKind.PrefixedName,
                    token: this.expect(this.current.kind),
                };
            case TokenKind.BLANK_NODE_LABEL:
                return {
                    kind: SyntaxKind.IRIReference,
                    token: this.expect(TokenKind.IRIREF),
                };
            default:
                this.reportError("missing predicate");
                return {
                    kind: SyntaxKind.IRIReference,
                    token: SyntaxToken.createMissing(TokenKind.IRIREF),
                };
        }
    }

    private parseObject(): ObjectSyntax {
        switch (this.current.kind) {
            case TokenKind.AKeyword:
                return {
                    kind: SyntaxKind.IRIReference,
                    token: this.expect(TokenKind.IRIREF),
                };
            case TokenKind.TrueKeyword:
            case TokenKind.FalseKeyword:
                return {
                    kind: SyntaxKind.BooleanLiteral,
                    token: this.expect(this.current.kind),
                };
            case TokenKind.OpenParen:
            case TokenKind.CloseParen:
                return {
                    kind: SyntaxKind.Collection,
                    openParenToken: this.expect(TokenKind.OpenParen),
                    objects: this.parseObjects(),
                    closeParenToken: this.expect(TokenKind.CloseParen),
                };
            case TokenKind.OpenBracket:
            case TokenKind.CloseBracket:
                return this.parseAnonOrBlankNodePropertyList();
            case TokenKind.CaretCaret:
                this.reportError("missing string literal before datatype");
                return {
                    kind: SyntaxKind.RDFLiteral,
                    token: SyntaxToken.createMissing(TokenKind.STRING_LITERAL_QUOTE),
                    suffix: this.parseRDFLiteralSuffix(),
                };
            case TokenKind.BadToken:
            case TokenKind.IRIREF:
                return {
                    kind: SyntaxKind.IRIReference,
                    token: this.expect(TokenKind.IRIREF),
                };
            case TokenKind.PNAME_NS:
                return {
                    kind: SyntaxKind.PrefixedName,
                    token: this.expect(this.current.kind),
                };
            case TokenKind.PNAME_LN:
                return {
                    kind: SyntaxKind.PrefixedName,
                    token: this.expect(this.current.kind),
                };
            case TokenKind.BLANK_NODE_LABEL:
                return {
                    kind: SyntaxKind.BlankNodeLabel,
                    token: this.expect(this.current.kind),
                };
            case TokenKind.LANGTAG:
                this.reportError("missing string literal before language tag");
                return {
                    kind: SyntaxKind.RDFLiteral,
                    token: SyntaxToken.createMissing(TokenKind.STRING_LITERAL_QUOTE),
                    suffix: this.parseRDFLiteralSuffix(),
                };
            case TokenKind.INTEGER:
                return {
                    kind: SyntaxKind.IntegerLiteral,
                    token: this.expect(this.current.kind),
                };
            case TokenKind.DECIMAL:
                return {
                    kind: SyntaxKind.DecimalLiteral,
                    token: this.expect(this.current.kind),
                };
            case TokenKind.DOUBLE:
                return {
                    kind: SyntaxKind.DoubleLiteral,
                    token: this.expect(this.current.kind),
                };
            case TokenKind.STRING_LITERAL_QUOTE:
            case TokenKind.STRING_LITERAL_SINGLE_QUOTE:
            case TokenKind.STRING_LITERAL_LONG_SINGLE_QUOTE:
            case TokenKind.STRING_LITERAL_LONG_QUOTE:
                return {
                    kind: SyntaxKind.RDFLiteral,
                    token: this.expect(this.current.kind),
                    suffix: this.parseRDFLiteralSuffix(),
                };
            default:
                this.reportError("missing object");
                return {
                    kind: SyntaxKind.IRIReference,
                    token: SyntaxToken.createMissing(TokenKind.IRIREF),
                };
        }
    }

    private parseObjects(): ReadonlyArray<ObjectSyntax> {
        const objects: ObjectSyntax[] = [];
        while (this.current.kind !== TokenKind.CloseParen) {
            const token = this.current;
            objects.push(this.parseObject());
            if (token === this.current) {
                throw new Error(); // should never happen unless a bug prevents the loop from making progress
            }
        }
        return objects;
    }

    private parseRDFLiteralSuffix(): LanguageTagSyntax | DatatypeAnnotationSyntax | undefined {
        let suffix: LanguageTagSyntax | DatatypeAnnotationSyntax | undefined = undefined;
        for (; ;) {
            const token = this.current;
            switch (this.current.kind) {
                case TokenKind.CaretCaret:
                    if (suffix) {
                        this.reportError("unexpected datatype");
                    }
                    suffix = {
                        kind: SyntaxKind.DatatypeAnnotation,
                        caretCaretToken: this.expect(this.current.kind),
                        iri: this.parseDatatypeIRI(),
                    };
                    break;
                case TokenKind.LANGTAG:
                    if (suffix) {
                        this.reportError("unexpected language tag");
                    }
                    suffix = {
                        kind: SyntaxKind.LanguageTag,
                        token: this.expect(this.current.kind),
                    };
                    break;
                default:
                    return suffix;
            }
            if (token === this.current) {
                throw new Error(); // should never happen unless a bug prevents the loop from making progress
            }
        }
    }

    private parseDatatypeIRI(): IRISyntax {
        switch (this.current.kind) {
            case TokenKind.AKeyword:
            case TokenKind.BadToken:
            case TokenKind.IRIREF:
                return {
                    kind: SyntaxKind.IRIReference,
                    token: this.expect(TokenKind.IRIREF),
                };
            case TokenKind.PNAME_NS:
                return {
                    kind: SyntaxKind.PrefixedName,
                    token: this.expect(this.current.kind),
                };
            case TokenKind.PNAME_LN:
                return {
                    kind: SyntaxKind.PrefixedName,
                    token: this.expect(this.current.kind),
                };
            default:
                this.reportError("missing datatype after ^^");
                return {
                    kind: SyntaxKind.IRIReference,
                    token: SyntaxToken.createMissing(TokenKind.IRIREF),
                };
        }
    }
}

function rewriteSyntaxToken<T extends TokenKind>(token: SyntaxToken, kind: T, value: SyntaxTokenValues[T]): SyntaxTokens[T] {
    return {
        kind,
        leadingTrivia: token.leadingTrivia,
        offset: token.offset,
        text: token.text,
        trailingTrivia: token.trailingTrivia,
        value
    } as SyntaxTokens[T];
}
