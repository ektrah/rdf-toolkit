import { MultiMap } from "@rdf-toolkit/iterable";
import { IRIOrBlankNode } from "../terms.js";
import { Triple } from "../triples.js";
import { Owl, Rdf, Rdfs } from "../vocab.js";
import { RDFEngine } from "./rdf.js";

// https://www.w3.org/TR/2012/REC-owl2-primer-20121211/
export class OWLEngine {

    readonly equivalentClassMap: MultiMap<IRIOrBlankNode, IRIOrBlankNode>;       //  {Class} -- owl:equivalentClass --> {Class}

    constructor(private readonly rdfEngine: RDFEngine) {
        this.equivalentClassMap = new MultiMap();
    }

    ingest(triple: Triple): boolean {
        switch (triple.predicate) {
            case Owl.equivalentClass:
                return IRIOrBlankNode.is(triple.object) && this.equivalentClassMap.add(triple.subject, triple.object);
            default:
                return false;
        }
    }

    *beforeinterpret(): Generator<Triple> {
        yield Triple.createAxiomatic(Owl.equivalentClass, Rdfs.domain, Rdfs.Class);
        yield Triple.createAxiomatic(Owl.intersectionOf, Rdfs.domain, Rdfs.Class);
        yield Triple.createAxiomatic(Owl.unionOf, Rdfs.domain, Rdfs.Class);

        yield Triple.createAxiomatic(Owl.equivalentClass, Rdfs.range, Rdfs.Class);
        yield Triple.createAxiomatic(Owl.intersectionOf, Rdfs.range, Rdf.List);
        yield Triple.createAxiomatic(Owl.unionOf, Rdfs.range, Rdf.List);
    }

    *interpret(triple: Triple): Generator<Triple> {

        // every OWL class is a subclass of owl:Thing and equivalent to itself
        if (triple.subject !== Rdfs.Resource && triple.predicate === Rdf.type && triple.object === Owl.Class) {
            const class_ = triple.subject;
            yield Triple.createInferred(class_, Rdfs.subClassOf, Owl.Thing, triple);
            yield Triple.createInferred(class_, Owl.equivalentClass, class_, triple);
        }

        // class equivalence is reflexive, symmetric, and transitive
        if (triple.predicate === Owl.equivalentClass && IRIOrBlankNode.is(triple.object)) {
            const class_ = triple.subject;
            const equivalentClass = triple.object;
            yield Triple.createInferred(class_, Owl.equivalentClass, class_, triple);
            yield Triple.createInferred(equivalentClass, Owl.equivalentClass, class_, triple);
            for (const transitiveEquivalentClass of this.equivalentClassMap.get(equivalentClass)) {
                yield Triple.createInferred(class_, Owl.equivalentClass, transitiveEquivalentClass, triple);
            }
        }

        // every class in a union is a subclass of the union
        if (triple.predicate === Owl.unionOf && IRIOrBlankNode.is(triple.object)) {
            const union = triple.subject;
            for (let list: IRIOrBlankNode = triple.object; list != Rdf.nil;) {
                const first = this.rdfEngine.firstMap.get(list);
                const rest = this.rdfEngine.restMap.get(list);
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
                const first = this.rdfEngine.firstMap.get(list);
                const rest = this.rdfEngine.restMap.get(list);
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
