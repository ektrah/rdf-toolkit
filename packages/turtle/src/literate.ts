import { DiagnosticBag, TextDocument } from "@rdf-toolkit/text";
import { TurtleScanner } from "./scanner.js";
import { SyntaxToken, SyntaxTrivia, TokenKind } from "./syntax.js";

export function* tokenizeLiterateTurtle(document: TextDocument, diagnostics: DiagnosticBag): Generator<SyntaxToken, void, undefined> {
    type Mutable<Type> = {
        -readonly [Key in keyof Type]: Type[Key];
    };

    const regexp = /(?<=\n|\r|^)[ ]{0,3}([`]{3,}|[~]{3,})([^\n\r]*)(?:\n|\r\n?|$)/ug;
    const text = document.getText();

    let offset = 0;

    for (; ;) {
        const m = regexp.exec(text);
        if (!m) {
            break;
        }

        const start = regexp.lastIndex;
        let end: number;
        for (; ;) {
            const n = regexp.exec(text);
            if (!n) {
                end = text.length;
                break;
            }
            if (n[1].startsWith(m[1])) {
                end = n.index;
                break;
            }
        }

        if (/^\s*turtle\b/ui.test(m[2])) {
            const subDocument = TextDocument.create(document.uri, "turtle", document.version, text.substring(0, end));
            const tokens = [...new TurtleScanner(subDocument, start, diagnostics)];
            const endOfFileToken = tokens.pop();

            if (endOfFileToken && tokens.length) {
                const firstToken: Mutable<SyntaxToken> = tokens[0];
                const lastToken: Mutable<SyntaxToken> = tokens[tokens.length - 1];

                firstToken.leadingTrivia = textToTrivia(text.substring(offset, start)).concat(firstToken.leadingTrivia);
                lastToken.trailingTrivia = (lastToken.trailingTrivia).concat(endOfFileToken.leadingTrivia, endOfFileToken.trailingTrivia);

                offset = end;
                yield* tokens;
            }
        }
    }

    yield <SyntaxToken>{
        kind: TokenKind.EndOfFile,
        leadingTrivia: textToTrivia(text.substring(offset)),
        offset: text.length,
        text: "",
        trailingTrivia: [],
        value: undefined,
    };
}

function textToTrivia(text: string): SyntaxTrivia[] {
    const parts = text.split(/(\n|\r\n?)/ug);
    const trivia: SyntaxTrivia[] = [];
    let i = 0;
    while (i + 1 < parts.length) {
        if (parts[i]) {
            trivia.push(SyntaxTrivia.createComment(parts[i]));
        }
        trivia.push(SyntaxTrivia.createEndOfLine(parts[i + 1]));
        i += 2;
    }
    if (i < parts.length) {
        if (parts[i]) {
            trivia.push(SyntaxTrivia.createComment(parts[i]));
        }
    }
    return trivia;
}
