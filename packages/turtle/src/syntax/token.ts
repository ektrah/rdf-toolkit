import { SyntaxNode } from "./node.js";
import { SyntaxTrivia } from "./trivia.js";
import { SyntaxTokenValue, SyntaxTokenValues } from "./value.js";

export enum TokenKind {
    AKeyword = 200,
    TrueKeyword,
    FalseKeyword,
    AtPrefixKeyword,
    AtBaseKeyword,
    BaseKeyword,
    PrefixKeyword,

    OpenParen,
    CloseParen,
    Comma,
    Dot,
    Semicolon,
    OpenBracket,
    CloseBracket,

    CaretCaret,

    EndOfFile,

    BadToken,

    IRIREF,
    PNAME_NS,
    PNAME_LN,
    BLANK_NODE_LABEL,
    LANGTAG,
    INTEGER,
    DECIMAL,
    DOUBLE,
    STRING_LITERAL_QUOTE,
    STRING_LITERAL_SINGLE_QUOTE,
    STRING_LITERAL_LONG_SINGLE_QUOTE,
    STRING_LITERAL_LONG_QUOTE,
}

interface _SyntaxToken<T extends TokenKind> {
    readonly kind: T;
    readonly leadingTrivia: readonly SyntaxTrivia[];
    readonly offset: number;
    readonly text: string;
    readonly trailingTrivia: readonly SyntaxTrivia[];
    readonly value: SyntaxTokenValues[T],
}

export type SyntaxTokens = { readonly [T in TokenKind]: _SyntaxToken<T> }

export type SyntaxToken = SyntaxTokens[TokenKind]

export namespace SyntaxToken {

    export function create<T extends TokenKind>(kind: T, value: SyntaxTokenValues[T], text?: string, leadingTrivia?: readonly SyntaxTrivia[], trailingTrivia?: readonly SyntaxTrivia[]): SyntaxTokens[T] {
        return {
            kind,
            leadingTrivia: leadingTrivia || [],
            offset: Number.NaN,
            text: text || SyntaxTokenValue.stringify(kind, value),
            trailingTrivia: trailingTrivia || [],
            value,
        } as SyntaxTokens[T];
    }

    export function createMissing<T extends TokenKind>(kind: T): SyntaxTokens[T] {
        return create(kind, SyntaxTokenValue.getErrorTokenValue(kind));
    }

    export function is(node: SyntaxTrivia | SyntaxToken | SyntaxNode): node is SyntaxToken;
    export function is<T extends TokenKind>(node: SyntaxTrivia | SyntaxToken | SyntaxNode, kind: T): node is SyntaxTokens[T];
    export function is(node: SyntaxTrivia | SyntaxToken | SyntaxNode, kind?: TokenKind): node is SyntaxToken {
        return kind ? node.kind === kind : node.kind >= 200 && node.kind < 300;
    }
}
