import { IRIReference } from "@rdf-toolkit/text";
import { BlankNode } from "./blanknode.js";
import { Literal } from "./literal.js";

export interface IRI extends IRIReference {
    readonly termType: "NamedNode";
    readonly value: string;
    compareTo(other: IRI | BlankNode | Literal): number;
    equals(other: IRI | BlankNode | Literal | null | undefined): boolean;
}

class InternedIRI implements IRI {

    static readonly InternPool: { [K in string]: InternedIRI } = {};

    constructor(
        readonly value: string,
        readonly scheme: string,
        readonly authority: string | undefined,
        readonly path: string,
        readonly query: string | undefined,
        readonly fragment: string | undefined) {

        return InternedIRI.InternPool[value] || (InternedIRI.InternPool[value] = this);
    }

    get termType(): "NamedNode" {
        return "NamedNode";
    }

    compareTo(other: IRI | BlankNode | Literal): number {
        switch (other.termType) {
            case "BlankNode":
                return -1;
            case "Literal":
                return 1;
            case "NamedNode":
                return this.value.localeCompare(other.value);
        }
    }

    equals(other: IRI | BlankNode | Literal | null | undefined): boolean {
        return other === this;
    }
}

export namespace IRI {

    export function create(value: string | IRIReference): IRI {
        const components = typeof value === "string" ? IRIReference.parse(value) : value;
        if (!components || typeof components.scheme !== "string") {
            throw new TypeError();
        }
        const string = typeof value === "string" ? value : IRIReference.recompose(components);
        return new InternedIRI(string, components.scheme, components.authority, components.path, components.query, components.fragment);
    }

    export function is(term: IRI | BlankNode | Literal): term is IRI {
        return term.termType === "NamedNode";
    }

    export const RdfLangString: IRI = create("http://www.w3.org/1999/02/22-rdf-syntax-ns#langString");
    export const XsdBoolean: IRI = create("http://www.w3.org/2001/XMLSchema#boolean");
    export const XsdDecimal: IRI = create("http://www.w3.org/2001/XMLSchema#decimal");
    export const XsdDouble: IRI = create("http://www.w3.org/2001/XMLSchema#double");
    export const XsdInteger: IRI = create("http://www.w3.org/2001/XMLSchema#integer");
    export const XsdString: IRI = create("http://www.w3.org/2001/XMLSchema#string");
}
