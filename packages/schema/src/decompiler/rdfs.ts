import { Ix } from "@rdf-toolkit/iterable";
import { Graph } from "@rdf-toolkit/rdf/graphs";
import { IRIOrBlankNode, Term } from "@rdf-toolkit/rdf/terms";
import { Owl, Vocabulary } from "@rdf-toolkit/rdf/vocab";
import { getDescription, SchemaBuilder } from "./utils.js";

const Dcam = Vocabulary.create("http://purl.org/dc/dcam/", ["domainIncludes", "rangeIncludes"]);
const HttpSchemaOrg = Vocabulary.create("http://schema.org/", ["domainIncludes", "rangeIncludes"]);
const HttpsSchemaOrg = Vocabulary.create("https://schema.org/", ["domainIncludes", "rangeIncludes"]);

//
//  ?class rdf:type rdfs:Class
//
//  ?property rdfs:domain ?class ; rdfs:range ?value
//
//  ?property dcam:domainIncludes ?class ; dcam:rangeIncludes ?value
//
export default function decompile(graph: Graph, builder: SchemaBuilder): void {
    for (const class_ of graph.classes()) {
        builder.addClass(class_, getDescription(class_, graph));
    }

    for (const property of graph.properties()) {
        const propertyDescription = getDescription(property, graph);
        builder.addProperty(property, propertyDescription);

        const classes = graph.getPropertyDomain(property)
            .filter(x => !graph.getPropertyDomain(property).some(y => y !== x && graph.isSubClassOf(y, x)))
            .concatMap(x => splitDomain(x, graph))
            .concat(graph.objects(property, Dcam.domainIncludes)
                .concat(graph.objects(property, HttpSchemaOrg.domainIncludes))
                .concat(graph.objects(property, HttpsSchemaOrg.domainIncludes))
                .ofType(IRIOrBlankNode.is));

        const values = graph.getPropertyRange(property)
            .filter(x => !graph.getPropertyRange(property).some(y => y !== x && graph.isSubClassOf(y, x)))
            .concatMap(x => splitRange(x, graph))
            .concat(graph.objects(property, Dcam.rangeIncludes)
                .concat(graph.objects(property, HttpSchemaOrg.rangeIncludes))
                .concat(graph.objects(property, HttpsSchemaOrg.rangeIncludes)));

        for (const class_ of classes) {
            const classDescription = getDescription(class_, graph);
            builder.addClass(class_, classDescription);
            builder.addClassProperty(class_, property, propertyDescription, undefined, undefined);
            builder.addPropertyClass(property, class_);
            for (const value of values) {
                builder.addClassPropertyValue(class_, property, value);
            }
        }
    }
}

function* splitDomain(node: IRIOrBlankNode, graph: Graph): Generator<IRIOrBlankNode> {
    let didYield = false;
    for (const triple of graph.triples(node)) {
        switch (triple.predicate) {
            case Owl.unionOf:
                if (IRIOrBlankNode.is(triple.object)) {
                    for (const item of Ix.from(graph.list(triple.object))) {
                        if (IRIOrBlankNode.is(item)) {
                            didYield = true;
                            yield item;
                        }
                    }
                }
                break;
        }
    }
    if (!didYield) {
        yield node;
    }
}

export function* splitRange(node: Term, graph: Graph): Generator<Term> {
    let didYield = false;
    for (const triple of IRIOrBlankNode.is(node) ? graph.triples(node) : Ix.empty) {
        switch (triple.predicate) {
            case Owl.onClass:
            case Owl.onDataRange:
            case Owl.allValuesFrom:
            case Owl.someValuesFrom:
            case Owl.hasValue:
                didYield = true;
                yield* splitRange(triple.object, graph);
                break;
            case Owl.unionOf:
            case Owl.oneOf:
                if (IRIOrBlankNode.is(triple.object)) {
                    for (const item of Ix.from(graph.list(triple.object))) {
                        didYield = true;
                        yield item;
                    }
                }
                break;
            case Owl.onDatatype:
                didYield = true;
                yield triple.object;
                break;
        }
    }
    if (!didYield) {
        yield node;
    }
}
