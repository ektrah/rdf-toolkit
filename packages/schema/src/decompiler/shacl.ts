import { Ix } from "@rdf-toolkit/iterable";
import { Graph } from "@rdf-toolkit/rdf/graphs";
import { IRI, IRIOrBlankNode, Literal, Term } from "@rdf-toolkit/rdf/terms";
import { Rdfs, Shacl } from "@rdf-toolkit/rdf/vocab";
import { splitRange } from "./rdfs.js";
import { getDescription, SchemaBuilder } from "./utils.js";

//
//  ?class a rdf:Class, sh:NodeShape; sh:property [ a sh:PropertyShape; sh:path ?property ]
//
//  [ a sh:NodeShape; sh:targetClass ?class; sh:property [ a sh:PropertyShape; sh:path ?property ] ]
//
export default function decompile(graph: Graph, builder: SchemaBuilder): void {
    for (const nodeShape of graph.getInstances(Shacl.NodeShape)) {
        const classes = (graph.isClass(nodeShape) ? Ix.of(nodeShape) : Ix.empty)
            .concat(graph.objects(nodeShape, Shacl.targetClass).ofType(IRIOrBlankNode.is));

        for (const class_ of classes) {
            builder.addClass(class_, getDescription(class_, graph));
            for (const property of graph.objects(nodeShape, Shacl.targetSubjectsOf).ofType(IRI.is)) {
                builder.addClassProperty(class_, property, getDescription(property, graph), undefined, undefined);
                builder.addPropertyClass(property, class_);
            }
        }

        for (const propertyShape of graph.objects(nodeShape, Shacl.property).ofType(IRIOrBlankNode.is)) {
            const properties = graph.objects(propertyShape, Shacl.path)
                .ofType(IRI.is);

            const values = graph.objects(propertyShape, Shacl.class)
                .concat(graph.objects(propertyShape, Shacl.datatype))
                .concat(graph.objects(propertyShape, Shacl.or).concatMap(x => splitOr(x, graph)))
                .concat(graph.objects(propertyShape, Shacl.in).concatMap(x => splitIn(x, graph)))
                .concat(graph.objects(propertyShape, Shacl.xone).concatMap(x => splitOr(x, graph)))
                .concat(graph.objects(propertyShape, Shacl.hasValue))
                .concat(graph.objects(propertyShape, Shacl.node))
                .concat(graph.objects(propertyShape, Shacl.nodeKind).concatMap(x => mapNodeKindToClass(x)))
                .concat(graph.objects(propertyShape, Shacl.qualifiedValueShape).concatMap(x => extract(x, graph)));

            const minCount = graph.objects(propertyShape, Shacl.minCount)
                .concat(graph.objects(propertyShape, Shacl.qualifiedMinCount))
                .ofType(Literal.hasBigIntValue)
                .map(x => x.valueAsBigInt)
                .firstOrDefault(undefined);

            const maxCount = graph.objects(propertyShape, Shacl.maxCount)
                .concat(graph.objects(propertyShape, Shacl.qualifiedMaxCount))
                .ofType(Literal.hasBigIntValue)
                .map(x => x.valueAsBigInt)
                .firstOrDefault(undefined);

            const propertyDescription = getDescription(propertyShape, graph);
            for (const class_ of classes) {
                for (const property of properties) {
                    builder.addClassProperty(class_, property, propertyDescription || getDescription(property, graph), minCount, maxCount);
                    builder.addPropertyClass(property, class_);
                    for (const value of values.concatIfEmpty(graph.getPropertyRange(property).concatMap(x => splitRange(x, graph)))) {
                        builder.addClassPropertyValue(class_, property, value);
                    }
                }
            }
        }
    }
}

function* extract(node: Term, graph: Graph): Generator<Term> {
    if (IRIOrBlankNode.is(node)) {
        for (const t of graph.triples(node)) {
            switch (t.predicate) {
                case Shacl.class:
                case Shacl.datatype:
                case Shacl.hasValue:
                case Shacl.nodeKind:
                    yield t.object;
            }
        }
    }
}

function* splitIn(node: Term, graph: Graph): Generator<Term> {
    if (IRIOrBlankNode.is(node)) {
        const items = graph.list(node);
        if (items) {
            for (const item of items) {
                yield item;
            }
        }
    }
}

function* splitOr(node: Term, graph: Graph): Generator<Term> {
    if (IRIOrBlankNode.is(node)) {
        const items = graph.list(node);
        if (items) {
            for (const item of items) {
                yield* extract(item, graph);
            }
        }
    }
}

function* mapNodeKindToClass(node: Term): Generator<Term> {
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
