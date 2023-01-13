import { IRIReference } from "@rdf-toolkit/text";
import { TokenKind } from "./token.js";

export type SyntaxTokenValues = {
    readonly [TokenKind.AKeyword]: undefined;
    readonly [TokenKind.TrueKeyword]: undefined;
    readonly [TokenKind.FalseKeyword]: undefined;
    readonly [TokenKind.AtPrefixKeyword]: undefined;
    readonly [TokenKind.AtBaseKeyword]: undefined;
    readonly [TokenKind.BaseKeyword]: undefined;
    readonly [TokenKind.PrefixKeyword]: undefined;

    readonly [TokenKind.OpenParen]: undefined;
    readonly [TokenKind.CloseParen]: undefined;
    readonly [TokenKind.Comma]: undefined;
    readonly [TokenKind.Dot]: undefined;
    readonly [TokenKind.Semicolon]: undefined;
    readonly [TokenKind.OpenBracket]: undefined;
    readonly [TokenKind.CloseBracket]: undefined;

    readonly [TokenKind.CaretCaret]: undefined;

    readonly [TokenKind.EndOfFile]: undefined;

    readonly [TokenKind.BadToken]: string;

    readonly [TokenKind.IRIREF]: IRIReference;
    readonly [TokenKind.PNAME_NS]: { readonly prefixLabel: string, readonly localName?: undefined };
    readonly [TokenKind.PNAME_LN]: { readonly prefixLabel: string, readonly localName: string };
    readonly [TokenKind.BLANK_NODE_LABEL]: { readonly prefixLabel?: undefined, readonly localName: string };
    readonly [TokenKind.LANGTAG]: string;
    readonly [TokenKind.INTEGER]: bigint;
    readonly [TokenKind.DECIMAL]: number;
    readonly [TokenKind.DOUBLE]: number;
    readonly [TokenKind.STRING_LITERAL_QUOTE]: string;
    readonly [TokenKind.STRING_LITERAL_SINGLE_QUOTE]: string;
    readonly [TokenKind.STRING_LITERAL_LONG_SINGLE_QUOTE]: string;
    readonly [TokenKind.STRING_LITERAL_LONG_QUOTE]: string;
}

export type SyntaxTokenValue = SyntaxTokenValues[TokenKind]

export namespace SyntaxTokenValue {

    export function getErrorTokenValue<T extends TokenKind>(kind: T): SyntaxTokenValues[T] {
        return errorTokenValue[kind];
    }

    export function parse<T extends TokenKind>(kind: T, text: string): SyntaxTokenValues[T] | null {
        return tokenValue[kind](text);
    }

    export function stringify<T extends TokenKind>(kind: T, value: SyntaxTokenValues[T]): string {
        return tokenText[kind](value);
    }
}

const errorTokenValue: SyntaxTokenValues = {
    [TokenKind.AKeyword]: undefined,
    [TokenKind.TrueKeyword]: undefined,
    [TokenKind.FalseKeyword]: undefined,
    [TokenKind.AtPrefixKeyword]: undefined,
    [TokenKind.AtBaseKeyword]: undefined,
    [TokenKind.BaseKeyword]: undefined,
    [TokenKind.PrefixKeyword]: undefined,

    [TokenKind.OpenParen]: undefined,
    [TokenKind.CloseParen]: undefined,
    [TokenKind.Comma]: undefined,
    [TokenKind.Dot]: undefined,
    [TokenKind.Semicolon]: undefined,
    [TokenKind.OpenBracket]: undefined,
    [TokenKind.CloseBracket]: undefined,

    [TokenKind.CaretCaret]: undefined,

    [TokenKind.EndOfFile]: undefined,

    [TokenKind.BadToken]: "",

    [TokenKind.IRIREF]: Object.freeze({ scheme: "http", authority: "example.com", path: "/.well-known/genid/error" }),
    [TokenKind.PNAME_NS]: Object.freeze({ prefixLabel: "error" }),
    [TokenKind.PNAME_LN]: Object.freeze({ prefixLabel: "error", localName: "error" }),
    [TokenKind.BLANK_NODE_LABEL]: Object.freeze({ localName: "error" }),
    [TokenKind.LANGTAG]: "x-error",
    [TokenKind.INTEGER]: 0n,
    [TokenKind.DECIMAL]: 0.0,
    [TokenKind.DOUBLE]: 0.0,
    [TokenKind.STRING_LITERAL_QUOTE]: "",
    [TokenKind.STRING_LITERAL_SINGLE_QUOTE]: "",
    [TokenKind.STRING_LITERAL_LONG_SINGLE_QUOTE]: "",
    [TokenKind.STRING_LITERAL_LONG_QUOTE]: "",
};

const tokenValue: { readonly [T in TokenKind]: (text: string) => SyntaxTokenValues[T] | null } = {
    [TokenKind.AKeyword]: () => undefined,
    [TokenKind.TrueKeyword]: () => undefined,
    [TokenKind.FalseKeyword]: () => undefined,
    [TokenKind.AtPrefixKeyword]: () => undefined,
    [TokenKind.AtBaseKeyword]: () => undefined,
    [TokenKind.BaseKeyword]: () => undefined,
    [TokenKind.PrefixKeyword]: () => undefined,

    [TokenKind.OpenParen]: () => undefined,
    [TokenKind.CloseParen]: () => undefined,
    [TokenKind.Comma]: () => undefined,
    [TokenKind.Dot]: () => undefined,
    [TokenKind.Semicolon]: () => undefined,
    [TokenKind.OpenBracket]: () => undefined,
    [TokenKind.CloseBracket]: () => undefined,

    [TokenKind.CaretCaret]: () => undefined,

    [TokenKind.EndOfFile]: () => undefined,

    [TokenKind.BadToken]: (value) => value,

    [TokenKind.IRIREF]: unescapeIRIReference,
    [TokenKind.PNAME_NS]: unescapePrefix,
    [TokenKind.PNAME_LN]: unescapePrefixedName,
    [TokenKind.BLANK_NODE_LABEL]: unescapeBlankNodeLabel,
    [TokenKind.LANGTAG]: unescapeLanguageTag,
    [TokenKind.INTEGER]: unescapeInteger,
    [TokenKind.DECIMAL]: unescapeDecimal,
    [TokenKind.DOUBLE]: unescapeDouble,
    [TokenKind.STRING_LITERAL_QUOTE]: unescapeStringLiteralQuote,
    [TokenKind.STRING_LITERAL_SINGLE_QUOTE]: unescapeStringLiteralSingleQuote,
    [TokenKind.STRING_LITERAL_LONG_SINGLE_QUOTE]: unescapeStringLiteralLongSingleQuote,
    [TokenKind.STRING_LITERAL_LONG_QUOTE]: unescapeStringLiteralLongQuote,
};

const tokenText: { readonly [T in TokenKind]: (value: SyntaxTokenValues[T]) => string } = {
    [TokenKind.AKeyword]: () => "a",
    [TokenKind.TrueKeyword]: () => "true",
    [TokenKind.FalseKeyword]: () => "false",
    [TokenKind.AtPrefixKeyword]: () => "@prefix",
    [TokenKind.AtBaseKeyword]: () => "@base",
    [TokenKind.BaseKeyword]: () => "BASE",
    [TokenKind.PrefixKeyword]: () => "PREFIX",

    [TokenKind.OpenParen]: () => "(",
    [TokenKind.CloseParen]: () => ")",
    [TokenKind.Comma]: () => ",",
    [TokenKind.Dot]: () => ".",
    [TokenKind.Semicolon]: () => ";",
    [TokenKind.OpenBracket]: () => "[",
    [TokenKind.CloseBracket]: () => "]",

    [TokenKind.CaretCaret]: () => "^^",

    [TokenKind.EndOfFile]: () => "",

    [TokenKind.BadToken]: (value) => value,

    [TokenKind.IRIREF]: (iriReference) => `<${escapeUCHAR(IRIReference.recompose(iriReference))}>`,
    [TokenKind.PNAME_NS]: ({ prefixLabel }) => `${prefixLabel}:`,
    [TokenKind.PNAME_LN]: ({ prefixLabel, localName }) => `${prefixLabel}:${escapeESC(localName)}`,
    [TokenKind.BLANK_NODE_LABEL]: ({ localName }) => `_:${escapeESC(localName)}`,
    [TokenKind.LANGTAG]: (language) => `@${language}`,
    [TokenKind.INTEGER]: (value) => `${value}`,
    [TokenKind.DECIMAL]: (value) => `${value}`,
    [TokenKind.DOUBLE]: (value) => `${value}`,
    [TokenKind.STRING_LITERAL_QUOTE]: (value) => `"${escapeUECHAR(value)}"`,
    [TokenKind.STRING_LITERAL_SINGLE_QUOTE]: (value) => `'${escapeUECHAR(value)}'`,
    [TokenKind.STRING_LITERAL_LONG_SINGLE_QUOTE]: (value) => `'''${escapeUECHAR(value)}'''`,
    [TokenKind.STRING_LITERAL_LONG_QUOTE]: (value) => `"""${escapeUECHAR(value)}"""`,
};

function escapeESC(text: string): string {
    return text.replace(/[!#-/;=?@_~]/ug, function (ch) {
        return "\\" + ch;
    });
}

function escapeUCHAR(text: string): string {
    return text.replace(/[^ -!#-&(-[\]-~]/ug, function (ch) {
        const codePoint = ch.codePointAt(0) || 0;
        if (codePoint < 0x10000) {
            return "\\u" + codePoint.toString(16).padStart(4, "0");
        }
        else {
            return "\\U" + codePoint.toString(16).padStart(8, "0");
        }
    });
}

function escapeUECHAR(text: string): string {
    return text.replace(/[^ -!#-&(-[\]-~]/ug, function (ch) {
        switch (ch) {
            case "\t":
                return "\\t";
            case "\b":
                return "\\b";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\f":
                return "\\f";
            case "\"":
                return "\\\"";
            case "'":
                return "\\'";
            case "\\":
                return "\\\\";
            default:
                const codePoint = ch.codePointAt(0) || 0;
                if (codePoint < 0x10000) {
                    return "\\u" + codePoint.toString(16).padStart(4, "0");
                }
                else {
                    return "\\U" + codePoint.toString(16).padStart(8, "0");
                }
        }
    });
}

function unescapeESC(text: string): string {
    return text.replace(/[\\](?:[!#-/;=?@_~])/ug, function (esc) {
        return esc[1];
    });
}

function unescapeUCHAR(text: string): string {
    return text.replace(/[\\](?:[u][0-9A-Fa-f]{4}|[U][0-9A-Fa-f]{8})/ug, function (esc) {
        switch (esc[1]) {
            case "u":
            case "U":
                return String.fromCodePoint(Number.parseInt(esc.substr(2), 16));
            default:
                throw new Error(); // should never happen
        }
    });
}

function unescapeUECHAR(text: string): string {
    return text.replace(/[\\](?:[tbnrf"'\\]|[u][0-9A-Fa-f]{4}|[U][0-9A-Fa-f]{8})/ug, function (esc) {
        switch (esc[1]) {
            case "t":
                return "\t";
            case "b":
                return "\b";
            case "n":
                return "\n";
            case "r":
                return "\r";
            case "f":
                return "\f";
            case "\"":
                return "\"";
            case "'":
                return "'";
            case "\\":
                return "\\";
            case "u":
            case "U":
                return String.fromCodePoint(Number.parseInt(esc.substr(2), 16));
            default:
                throw new Error(); // should never happen
        }
    });
}

function unescapeIRIReference(text: string): SyntaxTokenValues[TokenKind.IRIREF] | null {
    const s = /^[<]((?:[^\0- <>"{}|^`\\]|[\\](?:[u][0-9A-Fa-f]{4}|[U][0-9A-Fa-f]{8}))*)[>]$/u.exec(text);
    if (s) {
        try { return IRIReference.parse(unescapeUCHAR(s[1])); } catch { }
    }
    return null;
}

function unescapePrefix(text: string): SyntaxTokenValues[TokenKind.PNAME_NS] | null {
    const s = /^((?:[A-Za-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\u{10000}-\u{effff}](?:[.]*[-0-9_A-Za-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\u{10000}-\u{effff}\xB7\u0300-\u036F\u203F-\u2040])*)?)[:]$/u.exec(text);
    if (s) {
        return { prefixLabel: s[1] };
    }
    return null;
}

function unescapePrefixedName(text: string): SyntaxTokenValues[TokenKind.PNAME_LN] | null {
    // const PN_CHARS_BASE    = /[A-Za-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\u{10000}-\u{effff}]/u;
    // const PN_CHARS_U       = /[_\{PN_CHARS_BASE}]/u;
    // const PN_CHARS         = /[-0-9\{PN_CHARS_U}\xB7\u0300-\u036F\u203F-\u2040]/u;

    // const PN_PREFIX        = /[\{PN_CHARS_BASE}](?:[.]*[\{PN_CHARS}])*/u;
    // const PN_LOCAL         = /(?:[:0-9\{PN_CHARS_U}]|\{PLX})(?:[.]*(?:[\{PN_CHARS}:]|\{PLX}))*/u;
    // const PLX              = /[%][0-9A-Fa-f]{2}|[\\][!#-/;=?@_~]/u;

    // const PNAME_NS         = /((?:\{PN_PREFIX})?)[:]/u;
    // const PNAME_LN         = /\{PNAME_NS}(\{PN_LOCAL})/u;
    // const BLANK_NODE_LABEL = /[_][:]([0-9\{PN_CHARS_U}](?:[.]*[\{PN_CHARS}])*)/u;

    const s = /^((?:[A-Za-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\u{10000}-\u{effff}](?:[.]*[-0-9_A-Za-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\u{10000}-\u{effff}\xB7\u0300-\u036F\u203F-\u2040])*)?)[:]((?:[:0-9_A-Za-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\u{10000}-\u{effff}]|[%][0-9A-Fa-f]{2}|[\\][!#-/;=?@_~])(?:[.]*(?:[-0-9_A-Za-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\u{10000}-\u{effff}\xB7\u0300-\u036F\u203F-\u2040:]|[%][0-9A-Fa-f]{2}|[\\][!#-/;=?@_~]))*)$/u.exec(text);
    if (s) {
        try { return { prefixLabel: s[1], localName: unescapeESC(s[2]) }; } catch { }
    }
    return null;
}

function unescapeBlankNodeLabel(text: string): SyntaxTokenValues[TokenKind.BLANK_NODE_LABEL] | null {
    const s = /^[_][:]([0-9_A-Za-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\u{10000}-\u{effff}](?:[.]*[-0-9_A-Za-z\xc0-\xd6\xd8-\xf6\xf8-\u02ff\u0370-\u037d\u037f-\u1fff\u200c-\u200d\u2070-\u218f\u2c00-\u2fef\u3001-\ud7ff\uf900-\ufdcf\ufdf0-\ufffd\u{10000}-\u{effff}\xB7\u0300-\u036F\u203F-\u2040])*)$/u.exec(text);
    if (s) {
        try { return { localName: s[1] }; } catch { }
    }
    return null;
}

function unescapeLanguageTag(text: string): SyntaxTokenValues[TokenKind.LANGTAG] | null {
    const s = /^[@]([A-Za-z]+(?:[-][0-9A-Za-z]+)*)$/u.exec(text);
    if (s) {
        try { return s[1].toLowerCase(); } catch { }
    }
    return null;
}

function unescapeInteger(text: string): SyntaxTokenValues[TokenKind.INTEGER] | null {
    if (/^[+-]?[0-9]+$/u.test(text)) {
        try { return BigInt(text); } catch { }
    }
    return null;
}

function unescapeDecimal(text: string): SyntaxTokenValues[TokenKind.DECIMAL] | null {
    if (/^[+-]?[0-9]*[.][0-9]+$/u.test(text)) {
        try { return Number.parseFloat(text) } catch { }
    }
    return null;
}

function unescapeDouble(text: string): SyntaxTokenValues[TokenKind.DOUBLE] | null {
    if (/^[+-]?(?:[0-9]+[.][0-9]*[eE][+-]?[0-9]+|[.][0-9]+[eE][+-]?[0-9]+|[0-9]+[eE][+-]?[0-9]+)$/u.test(text)) {
        try { return Number.parseFloat(text); } catch { }
    }
    return null;
}

function unescapeStringLiteralQuote(text: string): SyntaxTokenValues[TokenKind.STRING_LITERAL_QUOTE] | null {
    const s = /^["]((?:[^\n\r"\\]|[\\](?:[tbnrf"'\\]|[u][0-9A-Fa-f]{4}|[U][0-9A-Fa-f]{8}))*)["]$/u.exec(text);
    if (s) {
        try { return unescapeUECHAR(s[1]); } catch { }
    }
    return null;
}

function unescapeStringLiteralSingleQuote(text: string): SyntaxTokenValues[TokenKind.STRING_LITERAL_SINGLE_QUOTE] | null {
    const s = /^[']((?:[^\n\r'\\]|[\\](?:[tbnrf"'\\]|[u][0-9A-Fa-f]{4}|[U][0-9A-Fa-f]{8}))*)[']$/u.exec(text);
    if (s) {
        try { return unescapeUECHAR(s[1]); } catch { }
    }
    return null;
}

function unescapeStringLiteralLongSingleQuote(text: string): SyntaxTokenValues[TokenKind.STRING_LITERAL_LONG_SINGLE_QUOTE] | null {
    const s = /^[']['][']((?:['][']?|[^'\\]|[\\](?:[tbnrf"'\\]|[u][0-9A-Fa-f]{4}|[U][0-9A-Fa-f]{8}))*)[']['][']$/u.exec(text);
    if (s) {
        try { return unescapeUECHAR(s[1]); } catch { }
    }
    return null;
}

function unescapeStringLiteralLongQuote(text: string): SyntaxTokenValues[TokenKind.STRING_LITERAL_LONG_QUOTE] | null {
    const s = /^["]["]["]((?:["]["]?|[^"\\]|[\\](?:[tbnrf"'\\]|[u][0-9A-Fa-f]{4}|[U][0-9A-Fa-f]{8}))*)["]["]["]$/u.exec(text);
    if (s) {
        try { return unescapeUECHAR(s[1]); } catch { }
    }
    return null;
}
