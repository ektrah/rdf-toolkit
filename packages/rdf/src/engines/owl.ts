import { IRIOrBlankNode } from "../terms.js";
import { Triple } from "../triples.js";
import { Owl, Rdf, Rdfs } from "../vocab.js";

export class OWLEngine {

    readonly firstMap: Map<IRIOrBlankNode, Triple>;
    readonly restMap: Map<IRIOrBlankNode, Triple>;

    constructor() {
        this.firstMap = new Map();
        this.restMap = new Map();
    }

    ingest(triple: Triple): boolean {
        switch (triple.predicate) {
            case Rdf.first:
                this.firstMap.set(triple.subject, triple);
                break;
            case Rdf.rest:
                this.restMap.set(triple.subject, triple);
                break;
        }

        return false;
    }

    *beforeinterpret(): Generator<Triple> {
    }

    *interpret(triple: Triple): Generator<Triple> {

        // every OWL class is a subclass of owl:Thing
        if (triple.subject !== Rdfs.Resource && triple.predicate === Rdf.type && triple.object === Owl.Class) {
            yield Triple.createInferred(triple.subject, Rdfs.subClassOf, Owl.Thing, triple);
        }

        // every class in a union is a subclass of the union
        if (triple.predicate === Owl.unionOf && IRIOrBlankNode.is(triple.object)) {
            const union = triple.subject;
            for (let list: IRIOrBlankNode = triple.object; list != Rdf.nil;) {
                const first = this.firstMap.get(list);
                const rest = this.restMap.get(list);
                if (first && IRIOrBlankNode.is(first.object)) {
                    yield Triple.createInferred(first.object, Rdfs.subClassOf, union, first);
                }
                if (rest && IRIOrBlankNode.is(rest.object)) {
                    list = rest.object;
                }
                else {
                    list = Rdf.nil;
                }
            }
        }

        // every class in an intersection is a superclass of the intersection
        if (triple.predicate === Owl.intersectionOf && IRIOrBlankNode.is(triple.object)) {
            const intersection = triple.subject;
            for (let list: IRIOrBlankNode = triple.object; list != Rdf.nil;) {
                const first = this.firstMap.get(list);
                const rest = this.restMap.get(list);
                if (first && IRIOrBlankNode.is(first.object)) {
                    yield Triple.createInferred(intersection, Rdfs.subClassOf, first.object, first);
                }
                if (rest && IRIOrBlankNode.is(rest.object)) {
                    list = rest.object;
                }
                else {
                    list = Rdf.nil;
                }
            }
        }
    }

    *afterinterpret(): Generator<Triple> {
    }
}
