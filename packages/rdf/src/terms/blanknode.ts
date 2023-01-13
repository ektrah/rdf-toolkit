import { IRI } from "./iri.js";
import { Literal } from "./literal.js";

export interface BlankNode {
    readonly termType: "BlankNode";
    readonly value: string;
    compareTo(other: IRI | BlankNode | Literal): number;
    equals(other: IRI | BlankNode | Literal | null | undefined): boolean;
}

class InternedBlankNode implements BlankNode {

    static readonly InternPool: { [K in string]: InternedBlankNode } = {};

    constructor(readonly value: string) {
        return InternedBlankNode.InternPool[value] || (InternedBlankNode.InternPool[value] = this);
    }

    get termType(): "BlankNode" {
        return "BlankNode";
    }

    compareTo(other: IRI | BlankNode | Literal): number {
        switch (other.termType) {
            case "BlankNode":
                return this.value.localeCompare(other.value);
            case "Literal":
                return 1;
            case "NamedNode":
                return 1;
        }
    }

    equals(other: IRI | BlankNode | Literal | null | undefined): boolean {
        return other === this;
    }
}

export namespace BlankNode {

    export function create(id: string): BlankNode {
        return new InternedBlankNode("http://example.com/.well-known/genid/" + id);
    }

    export function is(term: IRI | BlankNode | Literal): term is BlankNode {
        return term.termType === "BlankNode";
    }
}
