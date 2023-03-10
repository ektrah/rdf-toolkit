import { IRIReference } from "@rdf-toolkit/text";
import { SyntaxToken, SyntaxTokens, TokenKind } from "./token.js";
import { SyntaxTrivia } from "./trivia.js";

export enum SyntaxKind {
    Document = 300,
    PrefixDirective,
    BaseDirective,
    SparqlBaseDirective,
    SparqlPrefixDirective,
    SubjectPredicateObjectList,
    BlankNodePredicateObjectList,
    PredicateObjectList,
    PredicateObjectListTail,
    VerbObjectList,
    ObjectList,
    ObjectListTail,
    A,
    BlankNodePropertyList,
    Collection,
    IntegerLiteral,
    DecimalLiteral,
    DoubleLiteral,
    RDFLiteral,
    LanguageTag,
    DatatypeAnnotation,
    BooleanLiteral,
    IRIReference,
    PrefixedName,
    BlankNodeLabel,
    Anon,
}

export interface DocumentSyntax {
    readonly kind: SyntaxKind.Document,
    readonly statements: ReadonlyArray<StatementSyntax>,
    readonly endOfFile: SyntaxTokens[TokenKind.EndOfFile],
}

export type StatementSyntax =
    | DirectiveSyntax
    | TriplesSyntax;

export type DirectiveSyntax =
    | PrefixDirectiveSyntax
    | BaseDirectiveSyntax
    | SparqlPrefixDirectiveSyntax
    | SparqlBaseDirectiveSyntax;

export interface PrefixDirectiveSyntax {
    readonly kind: SyntaxKind.PrefixDirective,
    readonly keyword: SyntaxTokens[TokenKind.AtPrefixKeyword],
    readonly prefixLabel: SyntaxTokens[TokenKind.PNAME_NS],
    readonly iriReference: SyntaxTokens[TokenKind.IRIREF],
    readonly dotToken: SyntaxTokens[TokenKind.Dot],
}

export interface BaseDirectiveSyntax {
    readonly kind: SyntaxKind.BaseDirective,
    readonly keyword: SyntaxTokens[TokenKind.AtBaseKeyword],
    readonly iriReference: SyntaxTokens[TokenKind.IRIREF],
    readonly dotToken: SyntaxTokens[TokenKind.Dot],
}

export interface SparqlBaseDirectiveSyntax {
    readonly kind: SyntaxKind.SparqlBaseDirective,
    readonly keyword: SyntaxTokens[TokenKind.BaseKeyword],
    readonly iriReference: SyntaxTokens[TokenKind.IRIREF],
}

export interface SparqlPrefixDirectiveSyntax {
    readonly kind: SyntaxKind.SparqlPrefixDirective,
    readonly keyword: SyntaxTokens[TokenKind.PrefixKeyword],
    readonly prefixLabel: SyntaxTokens[TokenKind.PNAME_NS],
    readonly iriReference: SyntaxTokens[TokenKind.IRIREF],
}

export type TriplesSyntax =
    | SubjectPredicateObjectListSyntax
    | BlankNodePredicateObjectListSyntax;

export interface SubjectPredicateObjectListSyntax {
    readonly kind: SyntaxKind.SubjectPredicateObjectList,
    readonly subject: SubjectSyntax,
    readonly predicateObjectList: PredicateObjectListSyntax,
    readonly dotToken: SyntaxTokens[TokenKind.Dot],
}

export interface BlankNodePredicateObjectListSyntax {
    readonly kind: SyntaxKind.BlankNodePredicateObjectList,
    readonly blankNode: BlankNodePropertyListSyntax,
    readonly predicateObjectList?: PredicateObjectListSyntax,
    readonly dotToken: SyntaxTokens[TokenKind.Dot],
}

export interface PredicateObjectListSyntax {
    readonly kind: SyntaxKind.PredicateObjectList,
    readonly verbObjectList: VerbObjectListSyntax,
    readonly tail?: PredicateObjectListTailSyntax,
}

export interface PredicateObjectListTailSyntax {
    readonly kind: SyntaxKind.PredicateObjectListTail,
    readonly semicolonToken: SyntaxTokens[TokenKind.Semicolon],
    readonly verbObjectList?: VerbObjectListSyntax,
    readonly tail?: PredicateObjectListTailSyntax,
}

export interface VerbObjectListSyntax {
    readonly kind: SyntaxKind.VerbObjectList,
    readonly verb: PredicateSyntax,
    readonly objectList: ObjectListSyntax,
}

export interface ObjectListSyntax {
    readonly kind: SyntaxKind.ObjectList,
    readonly object: ObjectSyntax,
    readonly tail?: ObjectListTailSyntax,
}

export interface ObjectListTailSyntax {
    readonly kind: SyntaxKind.ObjectListTail,
    readonly commaToken: SyntaxTokens[TokenKind.Comma],
    readonly object: ObjectSyntax,
    readonly tail?: ObjectListTailSyntax,
}

export type SubjectSyntax =
    | IRISyntax
    | BlankNodeSyntax
    | CollectionSyntax;

export type PredicateSyntax =
    | ASyntax
    | IRISyntax;

export type ObjectSyntax =
    | IRISyntax
    | BlankNodeSyntax
    | CollectionSyntax
    | BlankNodePropertyListSyntax
    | LiteralSyntax;

export type LiteralSyntax =
    | RDFLiteralSyntax
    | IntegerLiteralSyntax
    | DecimalLiteralSyntax
    | DoubleLiteralSyntax
    | BooleanLiteralSyntax;

export interface ASyntax {
    readonly kind: SyntaxKind.A,
    readonly keyword: SyntaxTokens[TokenKind.AKeyword],
}

export interface BlankNodePropertyListSyntax {
    readonly kind: SyntaxKind.BlankNodePropertyList,
    readonly openBracketToken: SyntaxTokens[TokenKind.OpenBracket],
    readonly predicateObjectList: PredicateObjectListSyntax,
    readonly closeBracketToken: SyntaxTokens[TokenKind.CloseBracket],
}

export interface CollectionSyntax {
    readonly kind: SyntaxKind.Collection,
    readonly openParenToken: SyntaxTokens[TokenKind.OpenParen],
    readonly objects: ReadonlyArray<ObjectSyntax>,
    readonly closeParenToken: SyntaxTokens[TokenKind.CloseParen],
}

export interface IntegerLiteralSyntax {
    readonly kind: SyntaxKind.IntegerLiteral,
    readonly token: SyntaxTokens[TokenKind.INTEGER],
}

export interface DecimalLiteralSyntax {
    readonly kind: SyntaxKind.DecimalLiteral,
    readonly token: SyntaxTokens[TokenKind.DECIMAL],
}

export interface DoubleLiteralSyntax {
    readonly kind: SyntaxKind.DoubleLiteral,
    readonly token: SyntaxTokens[TokenKind.DOUBLE],
}

export interface RDFLiteralSyntax {
    readonly kind: SyntaxKind.RDFLiteral,
    readonly token: SyntaxTokens[TokenKind.STRING_LITERAL_QUOTE] | SyntaxTokens[TokenKind.STRING_LITERAL_SINGLE_QUOTE] | SyntaxTokens[TokenKind.STRING_LITERAL_LONG_SINGLE_QUOTE] | SyntaxTokens[TokenKind.STRING_LITERAL_LONG_QUOTE],
    readonly suffix?: LanguageTagSyntax | DatatypeAnnotationSyntax,
}

export interface LanguageTagSyntax {
    readonly kind: SyntaxKind.LanguageTag,
    readonly token: SyntaxTokens[TokenKind.LANGTAG],
}

export interface DatatypeAnnotationSyntax {
    readonly kind: SyntaxKind.DatatypeAnnotation,
    readonly caretCaretToken: SyntaxTokens[TokenKind.CaretCaret],
    readonly iri: IRISyntax,
}

export interface BooleanLiteralSyntax {
    readonly kind: SyntaxKind.BooleanLiteral,
    readonly token: SyntaxTokens[TokenKind.TrueKeyword] | SyntaxTokens[TokenKind.FalseKeyword],
}

export type IRISyntax =
    | IRIReferenceSyntax
    | PrefixedNameSyntax;

export interface IRIReferenceSyntax {
    readonly kind: SyntaxKind.IRIReference,
    readonly token: SyntaxTokens[TokenKind.IRIREF],
}

export interface PrefixedNameSyntax {
    readonly kind: SyntaxKind.PrefixedName,
    readonly token: SyntaxTokens[TokenKind.PNAME_NS] | SyntaxTokens[TokenKind.PNAME_LN],
}

export type BlankNodeSyntax =
    | BlankNodeLabelSyntax
    | AnonSyntax;

export interface BlankNodeLabelSyntax {
    readonly kind: SyntaxKind.BlankNodeLabel,
    readonly token: SyntaxTokens[TokenKind.BLANK_NODE_LABEL],
}

export interface AnonSyntax {
    readonly kind: SyntaxKind.Anon,
    readonly openBracketToken: SyntaxTokens[TokenKind.OpenBracket],
    readonly closeBracketToken: SyntaxTokens[TokenKind.CloseBracket],
}

export type SyntaxNode =
    | DocumentSyntax
    | PrefixDirectiveSyntax
    | BaseDirectiveSyntax
    | SparqlBaseDirectiveSyntax
    | SparqlPrefixDirectiveSyntax
    | SubjectPredicateObjectListSyntax
    | BlankNodePredicateObjectListSyntax
    | PredicateObjectListSyntax
    | PredicateObjectListTailSyntax
    | VerbObjectListSyntax
    | ObjectListSyntax
    | ObjectListTailSyntax
    | ASyntax
    | BlankNodePropertyListSyntax
    | CollectionSyntax
    | IntegerLiteralSyntax
    | DecimalLiteralSyntax
    | DoubleLiteralSyntax
    | RDFLiteralSyntax
    | LanguageTagSyntax
    | DatatypeAnnotationSyntax
    | BooleanLiteralSyntax
    | IRIReferenceSyntax
    | PrefixedNameSyntax
    | BlankNodeLabelSyntax
    | AnonSyntax;

export namespace SyntaxNode {

    export function createDocument(statements: readonly StatementSyntax[], trailingTrivia: readonly SyntaxTrivia[] = []): DocumentSyntax {
        return {
            kind: SyntaxKind.Document,
            statements,
            endOfFile: SyntaxToken.create(TokenKind.EndOfFile, undefined, undefined, trailingTrivia)
        };
    }

    export function createPrefixDirective(prefixLabel: string, iriReference: IRIReference, leadingTrivia: readonly SyntaxTrivia[] = [], trailingTrivia: readonly SyntaxTrivia[] = [SyntaxTrivia.carriageReturnLineFeed]): PrefixDirectiveSyntax {
        return {
            kind: SyntaxKind.PrefixDirective,
            keyword: SyntaxToken.create(TokenKind.AtPrefixKeyword, undefined, undefined, leadingTrivia, [SyntaxTrivia.space]),
            prefixLabel: SyntaxToken.create(TokenKind.PNAME_NS, { prefixLabel }, undefined, undefined, [SyntaxTrivia.space]),
            iriReference: SyntaxToken.create(TokenKind.IRIREF, iriReference, undefined, undefined, [SyntaxTrivia.space]),
            dotToken: SyntaxToken.create(TokenKind.Dot, undefined, undefined, undefined, trailingTrivia)
        };
    }

    export function createBaseDirective(iriReference: IRIReference, leadingTrivia: readonly SyntaxTrivia[] = [], trailingTrivia: readonly SyntaxTrivia[] = [SyntaxTrivia.carriageReturnLineFeed]): BaseDirectiveSyntax {
        return {
            kind: SyntaxKind.BaseDirective,
            keyword: SyntaxToken.create(TokenKind.AtBaseKeyword, undefined, undefined, leadingTrivia, [SyntaxTrivia.space]),
            iriReference: SyntaxToken.create(TokenKind.IRIREF, iriReference, undefined, undefined, [SyntaxTrivia.space]),
            dotToken: SyntaxToken.create(TokenKind.Dot, undefined, undefined, undefined, trailingTrivia)
        };
    }

    export function createSubjectPredicateObjectList(subject: SubjectSyntax, predicateObjectList: PredicateObjectListSyntax, trailingTrivia: readonly SyntaxTrivia[] = [SyntaxTrivia.carriageReturnLineFeed]): SubjectPredicateObjectListSyntax {
        return {
            kind: SyntaxKind.SubjectPredicateObjectList,
            subject,
            predicateObjectList,
            dotToken: SyntaxToken.create(TokenKind.Dot, undefined, undefined, undefined, trailingTrivia)
        };
    }

    export function createBlankNodePredicateObjectList(blankNode: BlankNodePropertyListSyntax, predicateObjectList?: PredicateObjectListSyntax, trailingTrivia: readonly SyntaxTrivia[] = [SyntaxTrivia.carriageReturnLineFeed]): BlankNodePredicateObjectListSyntax {
        return {
            kind: SyntaxKind.BlankNodePredicateObjectList,
            blankNode,
            predicateObjectList,
            dotToken: SyntaxToken.create(TokenKind.Dot, undefined, undefined, undefined, trailingTrivia)
        };
    }

    export function createPredicateObjectList(items: Iterable<VerbObjectListSyntax>, separator?: SyntaxTokens[TokenKind.Semicolon]): PredicateObjectListSyntax {
        const iterator = items[Symbol.iterator]();

        function createTail(): PredicateObjectListTailSyntax | undefined {
            const { done, value } = iterator.next();
            return done ? undefined : {
                kind: SyntaxKind.PredicateObjectListTail,
                semicolonToken: separator || SyntaxToken.create(TokenKind.Semicolon, undefined, undefined, undefined, [SyntaxTrivia.space]),
                verbObjectList: value,
                tail: createTail()
            };
        }

        const { done, value } = iterator.next();
        if (done) {
            throw new RangeError();
        }

        return {
            kind: SyntaxKind.PredicateObjectList,
            verbObjectList: value,
            tail: createTail()
        };
    }

    export function createVerbObjectList(verb: PredicateSyntax, objectList: ObjectListSyntax): VerbObjectListSyntax {
        return {
            kind: SyntaxKind.VerbObjectList,
            verb,
            objectList
        };
    }

    export function createObjectList(items: Iterable<ObjectSyntax>, separator?: SyntaxTokens[TokenKind.Comma]): ObjectListSyntax {
        const iterator = items[Symbol.iterator]();

        function createTail(): ObjectListTailSyntax | undefined {
            const { done, value } = iterator.next();
            return done ? undefined : {
                kind: SyntaxKind.ObjectListTail,
                commaToken: separator || SyntaxToken.create(TokenKind.Comma, undefined, undefined, undefined, [SyntaxTrivia.space]),
                object: value,
                tail: createTail()
            };
        }

        const { done, value } = iterator.next();
        if (done) {
            throw new RangeError();
        }

        return {
            kind: SyntaxKind.ObjectList,
            object: value,
            tail: createTail()
        };
    }

    export function createA(leadingTrivia: readonly SyntaxTrivia[] = [], trailingTrivia: readonly SyntaxTrivia[] = [SyntaxTrivia.space]): ASyntax {
        return {
            kind: SyntaxKind.A,
            keyword: SyntaxToken.create(TokenKind.AKeyword, undefined, undefined, leadingTrivia, trailingTrivia)
        };
    }

    export function createBlankNodePropertyList(predicateObjectList: PredicateObjectListSyntax, leadingTrivia: readonly SyntaxTrivia[] = [], trailingTrivia: readonly SyntaxTrivia[] = [SyntaxTrivia.space]): BlankNodePropertyListSyntax {
        return {
            kind: SyntaxKind.BlankNodePropertyList,
            openBracketToken: SyntaxToken.create(TokenKind.OpenBracket, undefined, undefined, leadingTrivia, undefined),
            predicateObjectList,
            closeBracketToken: SyntaxToken.create(TokenKind.CloseBracket, undefined, undefined, undefined, trailingTrivia)
        };
    }

    export function createCollection(objects: readonly ObjectSyntax[], leadingTrivia: readonly SyntaxTrivia[] = [], trailingTrivia: readonly SyntaxTrivia[] = [SyntaxTrivia.space]): CollectionSyntax {
        return {
            kind: SyntaxKind.Collection,
            openParenToken: SyntaxToken.create(TokenKind.OpenParen, undefined, undefined, leadingTrivia, undefined),
            objects,
            closeParenToken: SyntaxToken.create(TokenKind.CloseParen, undefined, undefined, undefined, trailingTrivia)
        };
    }

    export function createIntegerLiteral(value: bigint, leadingTrivia: readonly SyntaxTrivia[] = [], trailingTrivia: readonly SyntaxTrivia[] = [SyntaxTrivia.space]): IntegerLiteralSyntax {
        return {
            kind: SyntaxKind.IntegerLiteral,
            token: SyntaxToken.create(TokenKind.INTEGER, value, undefined, leadingTrivia, trailingTrivia)
        };
    }

    export function createDecimalLiteral(value: number, leadingTrivia: readonly SyntaxTrivia[] = [], trailingTrivia: readonly SyntaxTrivia[] = [SyntaxTrivia.space]): DecimalLiteralSyntax {
        return {
            kind: SyntaxKind.DecimalLiteral,
            token: SyntaxToken.create(TokenKind.DECIMAL, value, undefined, leadingTrivia, trailingTrivia)
        };
    }

    export function createDoubleLiteral(value: number, leadingTrivia: readonly SyntaxTrivia[] = [], trailingTrivia: readonly SyntaxTrivia[] = [SyntaxTrivia.space]): DoubleLiteralSyntax {
        return {
            kind: SyntaxKind.DoubleLiteral,
            token: SyntaxToken.create(TokenKind.DOUBLE, value, undefined, leadingTrivia, trailingTrivia)
        };
    }

    export function createRDFLiteral(value: string, datatypeIRI: IRISyntax, leadingTrivia: readonly SyntaxTrivia[] = []): RDFLiteralSyntax {
        return {
            kind: SyntaxKind.RDFLiteral,
            token: SyntaxToken.create(TokenKind.STRING_LITERAL_QUOTE, value, undefined, leadingTrivia, undefined),
            suffix: {
                kind: SyntaxKind.DatatypeAnnotation,
                caretCaretToken: SyntaxToken.create(TokenKind.CaretCaret, undefined),
                iri: datatypeIRI
            }
        };
    }

    export function createStringLiteral(value: string, language?: string, leadingTrivia: readonly SyntaxTrivia[] = [], trailingTrivia: readonly SyntaxTrivia[] = [SyntaxTrivia.space]): RDFLiteralSyntax {
        return language ? {
            kind: SyntaxKind.RDFLiteral,
            token: SyntaxToken.create(TokenKind.STRING_LITERAL_QUOTE, value, undefined, leadingTrivia, undefined),
            suffix: {
                kind: SyntaxKind.LanguageTag,
                token: SyntaxToken.create(TokenKind.LANGTAG, language, undefined, undefined, trailingTrivia),
            }
        } : {
            kind: SyntaxKind.RDFLiteral,
            token: SyntaxToken.create(TokenKind.STRING_LITERAL_QUOTE, value, undefined, leadingTrivia, trailingTrivia)
        };
    }

    export function createBooleanLiteral(value: boolean, leadingTrivia: readonly SyntaxTrivia[] = [], trailingTrivia: readonly SyntaxTrivia[] = [SyntaxTrivia.space]): BooleanLiteralSyntax {
        return {
            kind: SyntaxKind.BooleanLiteral,
            token: SyntaxToken.create(value ? TokenKind.TrueKeyword : TokenKind.FalseKeyword, undefined, undefined, leadingTrivia, trailingTrivia)
        };
    }

    export function createIRIReference(value: IRIReference, leadingTrivia: readonly SyntaxTrivia[] = [], trailingTrivia: readonly SyntaxTrivia[] = [SyntaxTrivia.space]): IRIReferenceSyntax {
        return {
            kind: SyntaxKind.IRIReference,
            token: SyntaxToken.create(TokenKind.IRIREF, value, undefined, leadingTrivia, trailingTrivia)
        };
    }

    export function createPrefixedName(prefixLabel: string, localName: string, leadingTrivia: readonly SyntaxTrivia[] = [], trailingTrivia: readonly SyntaxTrivia[] = [SyntaxTrivia.space]): PrefixedNameSyntax {
        return {
            kind: SyntaxKind.PrefixedName,
            token: SyntaxToken.create(TokenKind.PNAME_LN, { prefixLabel, localName }, undefined, leadingTrivia, trailingTrivia)
        };
    }

    export function createBlankNodeLabel(localName: string, leadingTrivia: readonly SyntaxTrivia[] = [], trailingTrivia: readonly SyntaxTrivia[] = [SyntaxTrivia.space]): BlankNodeLabelSyntax {
        return {
            kind: SyntaxKind.BlankNodeLabel,
            token: SyntaxToken.create(TokenKind.BLANK_NODE_LABEL, { localName }, undefined, leadingTrivia, trailingTrivia)
        };
    }

    export function createAnon(leadingTrivia: readonly SyntaxTrivia[] = [], trailingTrivia: readonly SyntaxTrivia[] = [SyntaxTrivia.space]): AnonSyntax {
        return {
            kind: SyntaxKind.Anon,
            openBracketToken: SyntaxToken.create(TokenKind.OpenBracket, undefined, undefined, leadingTrivia, undefined),
            closeBracketToken: SyntaxToken.create(TokenKind.CloseBracket, undefined, undefined, undefined, trailingTrivia)
        };
    }

    export function is(node: SyntaxTrivia | SyntaxToken | SyntaxNode): node is SyntaxNode {
        return node.kind >= 300;
    }

    export function* iteratePredicateObjectList(node: PredicateObjectListSyntax | undefined): Generator<VerbObjectListSyntax, void> {
        for (let current: PredicateObjectListSyntax | PredicateObjectListTailSyntax | undefined = node; current; current = current.tail) {
            if (current.verbObjectList) {
                yield current.verbObjectList;
            }
        }
    }

    export function* iterateObjectList(node: ObjectListSyntax | undefined): Generator<ObjectSyntax, void> {
        for (let current: ObjectListSyntax | ObjectListTailSyntax | undefined = node; current; current = current.tail) {
            yield current.object;
        }
    }

    export function* iterateTokens(node: SyntaxNode): Generator<SyntaxToken, void> {
        for (const key in node) {
            const value = node[key as keyof SyntaxNode] as SyntaxKind | SyntaxToken | SyntaxNode | SyntaxNode[] | undefined;
            if (typeof value === "object") {
                if (Array.isArray(value)) {
                    for (const element of value) {
                        yield* iterateTokens(element);
                    }
                }
                else if (SyntaxToken.is(value)) {
                    yield value;
                }
                else {
                    yield* iterateTokens(value);
                }
            }
        }
    }

    export function toString(node: SyntaxNode): string {
        let text = "";
        for (const token of iterateTokens(node)) {
            for (const trivia of token.leadingTrivia) {
                text += trivia.text;
            }
            text += token.text;
            for (const trivia of token.trailingTrivia) {
                text += trivia.text;
            }
        }
        return text;
    }

    export function getFirstToken(node: SyntaxNode): SyntaxToken {
        switch (node.kind) {
            case SyntaxKind.Document:
                return node.statements.length ? getFirstToken(node.statements[0]) : node.endOfFile;
            case SyntaxKind.PrefixDirective:
            case SyntaxKind.BaseDirective:
            case SyntaxKind.SparqlBaseDirective:
            case SyntaxKind.SparqlPrefixDirective:
                return node.keyword;
            case SyntaxKind.SubjectPredicateObjectList:
                return getFirstToken(node.subject);
            case SyntaxKind.BlankNodePredicateObjectList:
                return getFirstToken(node.blankNode);
            case SyntaxKind.PredicateObjectList:
                return getFirstToken(node.verbObjectList);
            case SyntaxKind.PredicateObjectListTail:
                return node.semicolonToken;
            case SyntaxKind.VerbObjectList:
                return getFirstToken(node.verb);
            case SyntaxKind.ObjectList:
                return getFirstToken(node.object);
            case SyntaxKind.ObjectListTail:
                return node.commaToken;
            case SyntaxKind.A:
                return node.keyword;
            case SyntaxKind.BlankNodePropertyList:
                return node.openBracketToken;
            case SyntaxKind.Collection:
                return node.openParenToken;
            case SyntaxKind.IntegerLiteral:
            case SyntaxKind.DecimalLiteral:
            case SyntaxKind.DoubleLiteral:
            case SyntaxKind.RDFLiteral:
            case SyntaxKind.LanguageTag:
                return node.token;
            case SyntaxKind.DatatypeAnnotation:
                return node.caretCaretToken;
            case SyntaxKind.BooleanLiteral:
            case SyntaxKind.IRIReference:
            case SyntaxKind.PrefixedName:
            case SyntaxKind.BlankNodeLabel:
                return node.token;
            case SyntaxKind.Anon:
                return node.openBracketToken;
        }
    }

    export function getLastToken(node: SyntaxNode): SyntaxToken {
        switch (node.kind) {
            case SyntaxKind.Document:
                return node.endOfFile;
            case SyntaxKind.PrefixDirective:
            case SyntaxKind.BaseDirective:
                return node.dotToken;
            case SyntaxKind.SparqlBaseDirective:
            case SyntaxKind.SparqlPrefixDirective:
                return node.iriReference;
            case SyntaxKind.SubjectPredicateObjectList:
            case SyntaxKind.BlankNodePredicateObjectList:
                return node.dotToken;
            case SyntaxKind.PredicateObjectList:
                return getLastToken(node.tail ? node.tail : node.verbObjectList);
            case SyntaxKind.PredicateObjectListTail:
                return node.verbObjectList ? getLastToken(node.verbObjectList) : node.semicolonToken;
            case SyntaxKind.VerbObjectList:
                return getLastToken(node.objectList);
            case SyntaxKind.ObjectList:
                return getLastToken(node.tail ? node.tail : node.object);
            case SyntaxKind.ObjectListTail:
                return getLastToken(node.object);
            case SyntaxKind.A:
                return node.keyword;
            case SyntaxKind.BlankNodePropertyList:
                return node.closeBracketToken;
            case SyntaxKind.Collection:
                return node.closeParenToken;
            case SyntaxKind.IntegerLiteral:
            case SyntaxKind.DecimalLiteral:
            case SyntaxKind.DoubleLiteral:
                return node.token;
            case SyntaxKind.RDFLiteral:
                return node.suffix ? getLastToken(node.suffix) : node.token;
            case SyntaxKind.LanguageTag:
                return node.token;
            case SyntaxKind.DatatypeAnnotation:
                return getLastToken(node.iri);
            case SyntaxKind.BooleanLiteral:
            case SyntaxKind.IRIReference:
            case SyntaxKind.PrefixedName:
            case SyntaxKind.BlankNodeLabel:
                return node.token;
            case SyntaxKind.Anon:
                return node.closeBracketToken;
        }
    }
}
