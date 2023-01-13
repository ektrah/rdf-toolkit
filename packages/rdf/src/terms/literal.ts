import { BlankNode } from "./blanknode.js";
import { IRI } from "./iri.js";

export interface Literal {
    readonly termType: "Literal";
    readonly value: string;
    readonly valueAsBigInt?: bigint;
    readonly valueAsBoolean?: boolean;
    readonly valueAsNumber?: number;
    readonly valueAsString?: string;
    readonly language: string;
    readonly datatype: IRI;
    compareTo(other: IRI | BlankNode | Literal): number;
    equals(other: IRI | BlankNode | Literal | null | undefined): boolean;
}

class AnyLiteral implements Literal {

    constructor(
        readonly value: string,
        readonly language: string,
        readonly datatype: IRI) {
    }

    get termType(): "Literal" {
        return "Literal";
    }

    compareTo(other: IRI | BlankNode | Literal): number {
        switch (other.termType) {
            case "BlankNode":
                return -1;
            case "Literal":
                return this.datatype.compareTo(other.datatype) ||
                    this.language.localeCompare(other.language) ||
                    this.value.localeCompare(other.value);
            case "NamedNode":
                return -1;
        }
    }

    equals(other: IRI | BlankNode | Literal | null | undefined): boolean {
        return (other === this) || !!other && Literal.is(other) && (other.value === this.value) && (other.language === this.language) && (other.datatype === this.datatype);
    }
}

class BigIntLiteral extends AnyLiteral {

    constructor(readonly valueAsBigInt: bigint, datatype: IRI) {
        super(valueAsBigInt.toString(), "", datatype);
    }
}

class BooleanLiteral extends AnyLiteral {

    private static readonly InternPool_true: { [K in string]: BooleanLiteral } = {};
    private static readonly InternPool_false: { [K in string]: BooleanLiteral } = {};

    constructor(readonly valueAsBoolean: boolean, datatype: IRI) {
        super(valueAsBoolean ? "true" : "false", "", datatype);
        return valueAsBoolean
            ? BooleanLiteral.InternPool_true[datatype.value] || (BooleanLiteral.InternPool_true[datatype.value] = this)
            : BooleanLiteral.InternPool_false[datatype.value] || (BooleanLiteral.InternPool_false[datatype.value] = this);
    }
}

class NumberLiteral extends AnyLiteral {

    constructor(readonly valueAsNumber: number, datatype: IRI) {
        super(valueAsNumber.toString(), "", datatype);
    }
}

class LanguageTaggedLiteral extends AnyLiteral {

    constructor(readonly valueAsString: string, language: string) {
        super(valueAsString, language, IRI.RdfLangString);
    }
}

class StringLiteral extends AnyLiteral {

    constructor(readonly valueAsString: string, datatype: IRI) {
        super(valueAsString, "", datatype);
    }
}

export namespace Literal {

    export function create(value: string, datatype: IRI): Literal;
    export function create(value: string, language: string): Literal;
    export function create(value: string, languageOrDatatype: string | IRI): Literal {
        if (typeof languageOrDatatype === "string") {
            return new LanguageTaggedLiteral(value, languageOrDatatype);
        }
        else {
            switch (languageOrDatatype.value) {
                case "http://www.w3.org/2001/XMLSchema#byte":
                case "http://www.w3.org/2001/XMLSchema#int":
                case "http://www.w3.org/2001/XMLSchema#integer":
                case "http://www.w3.org/2001/XMLSchema#long":
                case "http://www.w3.org/2001/XMLSchema#negativeInteger":
                case "http://www.w3.org/2001/XMLSchema#nonNegativeInteger":
                case "http://www.w3.org/2001/XMLSchema#nonPositiveInteger":
                case "http://www.w3.org/2001/XMLSchema#positiveInteger":
                case "http://www.w3.org/2001/XMLSchema#short":
                case "http://www.w3.org/2001/XMLSchema#unsignedByte":
                case "http://www.w3.org/2001/XMLSchema#unsignedInt":
                case "http://www.w3.org/2001/XMLSchema#unsignedLong":
                case "http://www.w3.org/2001/XMLSchema#unsignedShort":
                    try { return new BigIntLiteral(BigInt(value), languageOrDatatype); } catch { }
                    break;

                case "http://www.w3.org/2001/XMLSchema#boolean":
                    switch (value) {
                        case "true":
                        case "1":
                            return new BooleanLiteral(true, languageOrDatatype);
                        case "false":
                        case "0":
                            return new BooleanLiteral(false, languageOrDatatype);
                    }
                    break;

                case "http://www.w3.org/2001/XMLSchema#double":
                case "http://www.w3.org/2001/XMLSchema#float":
                    try { return new NumberLiteral(Number.parseFloat(value), languageOrDatatype); } catch { }
                    break;

                case "http://www.w3.org/2001/XMLSchema#decimal":
                    try { return new NumberLiteral(Number.parseFloat(value), languageOrDatatype); } catch { }
                    break;

                case "http://www.w3.org/2001/XMLSchema#language":
                case "http://www.w3.org/2001/XMLSchema#Name":
                case "http://www.w3.org/2001/XMLSchema#NCName":
                case "http://www.w3.org/2001/XMLSchema#NMTOKEN":
                case "http://www.w3.org/2001/XMLSchema#normalizedString":
                case "http://www.w3.org/2001/XMLSchema#string":
                case "http://www.w3.org/2001/XMLSchema#token":
                    return new StringLiteral(value, languageOrDatatype);
            }

            return new AnyLiteral(value, "", languageOrDatatype);
        }
    }

    export function createBoolean(value: boolean): Literal {
        return new BooleanLiteral(value, IRI.XsdBoolean);
    }

    export function createDecimal(value: number): Literal {
        return new NumberLiteral(value, IRI.XsdDecimal);
    }

    export function createDouble(value: number): Literal {
        return new NumberLiteral(value, IRI.XsdDouble);
    }

    export function createInteger(value: bigint): Literal {
        return new BigIntLiteral(value, IRI.XsdInteger);
    }

    export function createLanguageTaggedString(value: string, language: string): Literal {
        return new LanguageTaggedLiteral(value, language);
    }

    export function createString(value: string): Literal {
        return new StringLiteral(value, IRI.XsdString);
    }

    export function is(term: IRI | BlankNode | Literal): term is Literal {
        return term.termType === "Literal";
    }

    export function hasBigIntValue(term: IRI | BlankNode | Literal): term is Literal & { readonly valueAsBigInt: bigint } {
        return term.termType === "Literal" && typeof term.valueAsBigInt === "bigint";
    }

    export function hasBooleanValue(term: IRI | BlankNode | Literal): term is Literal & { readonly valueAsBoolean: boolean } {
        return term.termType === "Literal" && typeof term.valueAsBoolean === "boolean";
    }

    export function hasNumberValue(term: IRI | BlankNode | Literal): term is Literal & { readonly valueAsNumber: number } {
        return term.termType === "Literal" && typeof term.valueAsNumber === "number";
    }

    export function hasStringValue(term: IRI | BlankNode | Literal): term is Literal & { readonly valueAsString: string } {
        return term.termType === "Literal" && typeof term.valueAsString === "string";
    }
}
