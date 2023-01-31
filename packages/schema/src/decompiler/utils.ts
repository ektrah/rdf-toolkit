import { Ix } from "@rdf-toolkit/iterable";
import { Graph } from "@rdf-toolkit/rdf/graphs";
import { IRI, IRIOrBlankNode, Literal, Term } from "@rdf-toolkit/rdf/terms";
import { Triple } from "@rdf-toolkit/rdf/triples";
import { Owl, Rdf, Rdfs, Shacl, Vocabulary } from "@rdf-toolkit/rdf/vocab";
import { IRIReference } from "@rdf-toolkit/text";
import { Class, EntityKind, Ontology, Property, Schema } from "../main.js";

const Dc11 = Vocabulary.create("http://purl.org/dc/elements/1.1/", ["description", "title", "date"]);
const Dcterms = Vocabulary.create("http://purl.org/dc/terms/", ["description", "title", "created", "modified"]);
const Skos = Vocabulary.create("http://www.w3.org/2004/02/skos/core#", ["definition"]);

const DescriptionProperties: ReadonlySet<IRI> = new Set([
    Skos.definition,
    Rdfs.comment,
    Shacl.description,
    Dcterms.description,
    Dc11.description,
]);

export function getDescription(subject: IRIOrBlankNode, graph: Graph): string | undefined {
    return Ix.from(DescriptionProperties)
        .concatMap(p => graph.getSuperProperties(p))
        .concatMap(p => graph.objects(subject, p))
        .ofType(Literal.hasStringValue)
        .map(x => x.valueAsString)
        .filter(s => s.trim() !== "")
        .firstOrDefault(undefined);
}

export function flattenOwlIntersections(node: IRIOrBlankNode, graph: Graph): Ix<IRIOrBlankNode> {
    return graph.objects(node, Owl.intersectionOf)
        .ofType(IRIOrBlankNode.is)
        .concatMap(x => Ix.from(graph.list(x)))
        .ofType(IRIOrBlankNode.is)
        .concatMap(x => flattenOwlIntersections(x, graph))
        .wrap(x => x, Ix.of(node));
}

function getDirectSuperClasses(node: IRIOrBlankNode, graph: Graph): Ix<IRIOrBlankNode> {
    const superClasses = Ix.of(node)
        .concat(graph.objects(node, Owl.equivalentClass).ofType(IRIOrBlankNode.is))
        .concatMap(x => graph.getDirectSuperClasses(x))
        .concatMap(x => flattenOwlIntersections(x, graph))
        .distinct()
        .sort();

    return superClasses
        .filter(x => (x !== Owl.Thing && !graph.isInstanceOf(x, Owl.Restriction) && !graph.triples(x, Owl.unionOf).some()))
        .concatIfEmpty(superClasses
            .filter(x => !(x !== Owl.Thing && !graph.isInstanceOf(x, Owl.Restriction) && !graph.triples(x, Owl.unionOf).some()))
            .wrap(() => Ix.of(Owl.Thing), Ix.empty));
}

function* mapNodeKind(node: Term): Generator<Term> {
    switch (node) {
        case Shacl.BlankNode:
        case Shacl.IRI:
        case Shacl.BlankNodeOrIRI:
        case Shacl.BlankNodeOrLiteral:
        case Shacl.IRIOrLiteral:
            yield Rdfs.Resource;
            break;
        case Shacl.Literal:
            yield Rdfs.Literal;
            break;
    }
}

export class SchemaBuilder {
    private readonly schema: {
        readonly classes: Map<IRIOrBlankNode, {
            description: string | undefined,
            readonly properties: Map<IRI, {
                description: string | undefined,
                readonly values: Set<Term>,
                minCount: bigint | undefined,
                maxCount: bigint | undefined
            }>
        }>,
        readonly properties: Map<IRI, {
            description: string | undefined,
            readonly domainIncludes: Set<IRIOrBlankNode>
        }>,
    };

    constructor() {
        this.schema = {
            classes: new Map(),
            properties: new Map(),
        };
    }

    addClass(class_: IRIOrBlankNode, description: string | undefined) {
        let c = this.schema.classes.get(class_);
        if (!c) {
            this.schema.classes.set(class_, c = {
                description: undefined,
                properties: new Map()
            });
        }

        if (typeof c.description === "undefined") {
            c.description = description;
        }
    }

    addClassProperty(class_: IRIOrBlankNode, property: IRI, description: string | undefined, minCount: bigint | undefined, maxCount: bigint | undefined) {
        let c = this.schema.classes.get(class_);
        if (!c) {
            this.schema.classes.set(class_, c = {
                description: undefined,
                properties: new Map()
            });
        }

        let p = c.properties.get(property);
        if (!p) {
            c.properties.set(property, p = {
                description: undefined,
                values: new Set(),
                minCount: undefined,
                maxCount: undefined
            });
        }

        if (typeof p.description === "undefined") {
            p.description = description;
        }
        if (typeof p.minCount === "undefined") {
            p.minCount = minCount;
        }
        if (typeof p.maxCount === "undefined") {
            p.maxCount = maxCount;
        }
    }

    addClassPropertyValue(class_: IRIOrBlankNode, property: IRI, value: Term) {
        let c = this.schema.classes.get(class_);
        if (!c) {
            this.schema.classes.set(class_, c = {
                description: undefined,
                properties: new Map()
            });
        }

        let p = c.properties.get(property);
        if (!p) {
            c.properties.set(property, p = {
                description: undefined,
                values: new Set(),
                minCount: undefined,
                maxCount: undefined
            });
        }

        for (const item of p.values) {
            if (value.equals(item)) {
                return;
            }
        }

        p.values.add(value);
    }

    addProperty(property: IRI, description: string | undefined): void {
        let p = this.schema.properties.get(property);
        if (!p) {
            this.schema.properties.set(property, p = {
                description: undefined,
                domainIncludes: new Set(),
            });
        }

        if (typeof p.description === "undefined") {
            p.description = description;
        }
    }

    addPropertyClass(property: IRI, class_: IRIOrBlankNode): void {
        let p = this.schema.properties.get(property);
        if (!p) {
            this.schema.properties.set(property, p = {
                description: undefined,
                domainIncludes: new Set(),
            });
        }

        p.domainIncludes.add(class_);
    }

    toSchema(dataset: Iterable<Iterable<Triple>>, graph: Graph): Schema {
        return {
            classes: Ix
                .from(this.schema.classes)
                .sort((a, b) => a[0].compareTo(b[0]))
                .toMap<IRIOrBlankNode, Class>(
                    c => c[0],
                    c => ({
                        kind: EntityKind.Class,

                        id: c[0],

                        description: c[1].description,

                        subClassOf: Array.from(getDirectSuperClasses(c[0], graph))
                            .sort((a, b) => a.compareTo(b)),

                        properties: Array.from(c[1].properties)
                            .sort((a, b) => a[0].compareTo(b[0]))
                            .map(p => ({
                                id: p[0],

                                description: p[1].description,

                                value: Ix.from(p[1].values)
                                    .filter(x => !graph.isInstanceOf(x, Shacl.NodeKind))
                                    .concatIfEmpty(Ix
                                        .from(p[1].values)
                                        .filter(x => graph.isInstanceOf(x, Shacl.NodeKind))
                                        .concatMap(x => mapNodeKind(x)))
                                    .concatIfEmpty((graph.isInstanceOf(p[0], Owl.ObjectProperty) ? Ix.of(Owl.Thing) : Ix.empty)
                                        .concat(graph.isInstanceOf(p[0], Owl.DatatypeProperty) ? Ix.of(Rdfs.Literal) : Ix.empty))
                                    .toArray()
                                    .sort((a, b) => a.compareTo(b)),

                                minCount: typeof p[1].minCount === "undefined" ? 0n : p[1].minCount,

                                maxCount: typeof p[1].maxCount === "undefined" ? -1n : p[1].maxCount,

                                deprecated: graph.isDeprecated(p[0])
                            })),

                        deprecated: graph.isDeprecated(c[0])
                    })),

            properties: Ix.from(this.schema.properties)
                .sort((a, b) => a[0].compareTo(b[0]))
                .toMap<IRI, Property>(
                    p => p[0],
                    p => ({
                        kind: EntityKind.Property,

                        id: p[0],

                        description: p[1].description,

                        subPropertyOf: Array.from(graph.getDirectSuperProperties(p[0])),

                        domainIncludes: Array.from(p[1].domainIncludes)
                            .sort((a, b) => a.compareTo(b))
                    })),

            ontologies: Ix.from(getOntologies(dataset, graph))
                .sort((a, b) => a.id.compareTo(b.id))
                .toMap<IRIOrBlankNode, Ontology>(
                    o => o.id,
                    o => o)
        };
    }
}

function getOntologies(dataset: Iterable<Iterable<Triple>>, graph: Graph): Ontology[] {
    const ontologies: Ontology[] = [];
    for (const triples of dataset) {
        const definitions: Set<IRIOrBlankNode> = new Set();
        let id1: IRIOrBlankNode | null = null;
        let id2: IRIOrBlankNode | null = null;
        let id3: IRIOrBlankNode | null = null;
        let id4: IRIOrBlankNode | null = null;
        for (const triple of triples) {
            switch (triple.predicate) {
                case Rdf.type:
                    definitions.add(triple.subject);
                    if (triple.object === Owl.Ontology && !id1) {
                        id1 = triple.subject;
                    }
                    break;
                case Owl.backwardCompatibleWith:
                case Owl.imports:
                case Owl.incompatibleWith:
                case Owl.priorVersion:
                case Owl.versionIRI:
                    if (!id2) {
                        id2 = triple.subject;
                    }
                    break;
                case Dc11.title:
                case Dc11.date:
                case Dcterms.title:
                case Dcterms.created:
                case Dcterms.modified:
                    if ((triple.subject.value.endsWith("/") || triple.subject.value.endsWith("#")) && !id3) {
                        id3 = triple.subject;
                    }
                    break;
            }
            if (Triple.isParsed(triple) && !id4) {
                const iriref = IRIReference.parse(triple.location.uri);
                if (iriref && iriref.scheme) {
                    id4 = IRI.create(iriref);
                }
            }
        }
        const id = id1 || id2 || id3 || id4;
        if (id) {
            ontologies.push({
                kind: EntityKind.Ontology,
                id,
                description: getDescription(id, graph),
                definitions: Array.from(definitions).sort((a, b) => a.compareTo(b))
            });
        }
    }
    return ontologies;
}
