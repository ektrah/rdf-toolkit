import { Graph } from "@rdf-toolkit/rdf/graphs";
import { IRI, IRIOrBlankNode, Literal } from "@rdf-toolkit/rdf/terms";
import { Owl } from "@rdf-toolkit/rdf/vocab";
import { splitRange } from "./rdfs.js";
import { flattenOwlIntersections, getDescription, SchemaBuilder } from "./utils.js";

//
//  ?class a owl:Restriction; owl:onProperty ?property
//
//  ?class rdf:subClassOf [ a owl:Restriction; owl:onProperty ?property ]
//
//  ?class rdf:subClassOf [ a owl:Class; owl:intersectionOf ( [ a owl:Restriction; owl:onProperty ?property ] ) ]
//
export default function decompile(graph: Graph, builder: SchemaBuilder): void {
    for (const class_ of graph.classes()) {
        if (graph.isInstanceOf(class_, Owl.Restriction)) {
            decompileOWLRestriction(class_, graph, class_, builder);
        }
        else {
            for (const superClass of graph.getDirectSuperClasses(class_)) {
                for (const intersected of flattenOwlIntersections(superClass, graph)) {
                    if (graph.isInstanceOf(intersected, Owl.Restriction)) {
                        decompileOWLRestriction(intersected, graph, class_, builder);
                    }
                }
            }
        }
    }
}

function decompileOWLRestriction(restriction: IRIOrBlankNode, graph: Graph, class_: IRIOrBlankNode, builder: SchemaBuilder): void {
    const properties = graph.objects(restriction, Owl.onProperty)
        .ofType(IRI.is);

    const values = graph.objects(restriction, Owl.onClass)
        .concat(graph.objects(restriction, Owl.onDataRange))
        .concat(graph.objects(restriction, Owl.allValuesFrom))
        .concat(graph.objects(restriction, Owl.someValuesFrom))
        .concat(graph.objects(restriction, Owl.hasValue))
        .concatMap(x => splitRange(x, graph));

    const minCount = graph.objects(restriction, Owl.cardinality)
        .concat(graph.objects(restriction, Owl.minCardinality))
        .concat(graph.objects(restriction, Owl.qualifiedCardinality))
        .concat(graph.objects(restriction, Owl.minQualifiedCardinality))
        .ofType(Literal.hasBigIntValue)
        .map(x => x.valueAsBigInt)
        .firstOrDefault(undefined);

    const maxCount = graph.objects(restriction, Owl.cardinality)
        .concat(graph.objects(restriction, Owl.maxCardinality))
        .concat(graph.objects(restriction, Owl.qualifiedCardinality))
        .concat(graph.objects(restriction, Owl.maxQualifiedCardinality))
        .ofType(Literal.hasBigIntValue)
        .map(x => x.valueAsBigInt)
        .firstOrDefault(undefined);

    builder.addClass(class_, getDescription(class_, graph));
    for (const property of properties) {
        builder.addClassProperty(class_, property, getDescription(property, graph), minCount, maxCount);
        builder.addPropertyClass(property, class_);
        for (const value of values.concatIfEmpty(graph.getPropertyRange(property).concatMap(x => splitRange(x, graph)))) {
            builder.addClassPropertyValue(class_, property, value);
        }
    }
}
