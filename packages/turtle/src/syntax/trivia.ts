import { SyntaxNode } from "./node.js";
import { SyntaxToken } from "./token.js";

export enum TriviaKind {
    Whitespace = 100,
    Comment,
    EndOfLine,
}

export interface SyntaxTrivia {
    readonly kind: TriviaKind;
    readonly text: string;
}

export namespace SyntaxTrivia {

    export const carriageReturn: SyntaxTrivia = Object.freeze<SyntaxTrivia>({ kind: TriviaKind.EndOfLine, text: "\r" });
    export const carriageReturnLineFeed: SyntaxTrivia = Object.freeze<SyntaxTrivia>({ kind: TriviaKind.EndOfLine, text: "\r\n" });
    export const lineFeed: SyntaxTrivia = Object.freeze<SyntaxTrivia>({ kind: TriviaKind.EndOfLine, text: "\n" });
    export const space: SyntaxTrivia = Object.freeze<SyntaxTrivia>({ kind: TriviaKind.Whitespace, text: " " });
    export const tab: SyntaxTrivia = Object.freeze<SyntaxTrivia>({ kind: TriviaKind.Whitespace, text: "\t" });

    export function createWhitespace(text: string): SyntaxTrivia;
    export function createWhitespace(numberOfSpaces: number): SyntaxTrivia;
    export function createWhitespace(textOrNumberOfSpaces: string | number): SyntaxTrivia {
        const text = typeof textOrNumberOfSpaces === "number" ? " ".repeat(textOrNumberOfSpaces) : textOrNumberOfSpaces;
        switch (text) {
            case space.text: return space;
            case tab.text: return tab;
        }
        return { kind: TriviaKind.Whitespace, text };
    }

    export function createComment(text: string): SyntaxTrivia {
        return { kind: TriviaKind.Comment, text };
    }

    export function createEndOfLine(text: string): SyntaxTrivia {
        switch (text) {
            case carriageReturn.text: return carriageReturn;
            case carriageReturnLineFeed.text: return carriageReturnLineFeed;
            case lineFeed.text: return lineFeed;
        }
        return { kind: TriviaKind.EndOfLine, text };
    }

    export function is(node: SyntaxTrivia | SyntaxToken | SyntaxNode): node is SyntaxTrivia {
        return node.kind >= 100 && node.kind < 200;
    }
}
