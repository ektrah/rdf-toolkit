import { Range } from "@rdf-toolkit/text";
import { BlankNode, IRI, Literal } from "./terms.js";

export enum TripleKind {
    Axiomatic,
    Inferred,
    Parsed,
}

export interface AxiomaticTriple {
    readonly kind: TripleKind.Axiomatic;
    readonly subject: IRI | BlankNode;
    readonly predicate: IRI;
    readonly object: IRI | BlankNode | Literal;
}

export interface InferredTriple {
    readonly kind: TripleKind.Inferred;
    readonly subject: IRI | BlankNode;
    readonly predicate: IRI;
    readonly object: IRI | BlankNode | Literal;
    readonly premise: Triple;
}

export interface ParsedTriple {
    readonly kind: TripleKind.Parsed;
    readonly subject: IRI | BlankNode;
    readonly predicate: IRI;
    readonly object: IRI | BlankNode | Literal;
    readonly location: TripleLocation;
}

export type Triple =
    | AxiomaticTriple
    | InferredTriple
    | ParsedTriple

export interface TripleLocation {
    readonly uri: string;
    readonly subjectRange: Range,
    readonly predicateRange: Range,
    readonly objectRange: Range,
}

export namespace Triple {

    export function createAxiomatic(subject: IRI | BlankNode, predicate: IRI, object: IRI | BlankNode | Literal): AxiomaticTriple {
        return { kind: TripleKind.Axiomatic, subject, predicate, object };
    }

    export function createInferred(subject: IRI | BlankNode, predicate: IRI, object: IRI | BlankNode | Literal, premise: Triple): InferredTriple {
        return { kind: TripleKind.Inferred, subject, predicate, object, premise };
    }

    export function createParsed(subject: IRI | BlankNode, predicate: IRI, object: IRI | BlankNode | Literal, location: TripleLocation): ParsedTriple {
        return { kind: TripleKind.Parsed, subject, predicate, object, location };
    }

    export function isAxiomatic(triple: Triple): triple is AxiomaticTriple {
        return triple.kind === TripleKind.Axiomatic;
    }

    export function isInferred(triple: Triple): triple is InferredTriple {
        return triple.kind === TripleKind.Inferred;
    }

    export function isParsed(triple: Triple): triple is ParsedTriple {
        return triple.kind === TripleKind.Parsed;
    }
}
