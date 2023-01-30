import { Graph } from "@rdf-toolkit/rdf/graphs";
import { IRI, IRIOrBlankNode, Term } from "@rdf-toolkit/rdf/terms";
import { Triple } from "@rdf-toolkit/rdf/triples";
import decompileGraph from "./decompiler.js";
import validateInstance, { ValidationResult } from "./validator.js";

export { ResultSeverity, ResultType } from "./validator.js";
export type { CardinalityError, ClassDeprecatedWarning, ExtraPropertyWarning, MissingClassError, NotSatisfiedError, PropertyDeprecatedWarning, ValidationResult } from "./validator.js";

export enum EntityKind {
    Class,
    Property,
    Ontology,
}

export interface ClassProperty {
    readonly id: IRI;
    readonly description?: string;
    readonly value: readonly Term[];
    readonly minCount: bigint;
    readonly maxCount: bigint;
    readonly deprecated: boolean;
}

export interface Class {
    readonly kind: EntityKind.Class;
    readonly id: IRIOrBlankNode;
    readonly description?: string;
    readonly subClassOf: readonly IRIOrBlankNode[];
    readonly properties: readonly ClassProperty[];
    readonly deprecated: boolean;
}

export interface Property {
    readonly kind: EntityKind.Property;
    readonly id: IRI;
    readonly description?: string;
    readonly subPropertyOf: readonly IRI[];
    readonly domainIncludes: readonly IRIOrBlankNode[];
}

export interface Ontology {
    readonly kind: EntityKind.Ontology;
    readonly id: IRIOrBlankNode;
    readonly description?: string;
    readonly definitions: readonly IRIOrBlankNode[];
}

export interface Schema {
    readonly classes: ReadonlyMap<IRIOrBlankNode, Class>;
    readonly properties: ReadonlyMap<IRI, Property>;
    readonly ontologies: ReadonlyMap<IRIOrBlankNode, Ontology>;
}

export namespace Schema {

    export function decompile(dataset: Iterable<Iterable<Triple>>, graph: Graph): Schema {
        return decompileGraph(dataset, graph);
    }

    export function validate(subject: IRIOrBlankNode, graph: Graph, schema: Schema): ValidationResult[] {
        return validateInstance(subject, graph, schema);
    }
}
