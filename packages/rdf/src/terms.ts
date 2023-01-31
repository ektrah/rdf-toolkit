import { BlankNode } from "./terms/blanknode.js";
import { IRI } from "./terms/iri.js";
import { Literal } from "./terms/literal.js";

export { BlankNode, IRI, Literal };

export type IRIOrBlankNode =
    | IRI
    | BlankNode

export type Term =
    | IRI
    | BlankNode
    | Literal

export namespace IRIOrBlankNode {

    export function is(term: Term): term is IRI | BlankNode {
        return term.termType === "NamedNode" || term.termType === "BlankNode";
    }
}
