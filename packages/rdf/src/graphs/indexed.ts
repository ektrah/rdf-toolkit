import { Ix, ReadonlyMultiMap } from "@rdf-toolkit/iterable";
import { IRI, IRIOrBlankNode, Term } from "../terms.js";
import { Triple } from "../triples.js";
import { Rdf } from "../vocab.js";
import { SimpleGraph } from "./simple.js";

export class IndexedGraph extends SimpleGraph {

    private readonly triplesBySubject: ReadonlyMultiMap<IRIOrBlankNode, Triple>;

    constructor(dataset: Iterable<Iterable<Triple>>) {
        super(dataset);
        this.triplesBySubject = Ix.from(dataset).concatMap(triples => triples).toMultiMap(triple => triple.subject, triple => triple);
    }

    override triples(subject?: IRIOrBlankNode, predicate?: IRI, object?: Term): Ix<Triple> {
        if (subject) {
            let result = this.triplesBySubject.get(subject);
            result = predicate ? result.filter(triple => triple.predicate.equals(predicate)) : result;
            result = object ? result.filter(triple => triple.object.equals(object)) : result;
            return result;
        }
        return super.triples(subject, predicate, object);
    }

    list(list: IRIOrBlankNode): Term[] | null {
        const result: Term[] = [];
        while (list !== Rdf.nil) {
            let first: Term | null = null;
            let rest: IRIOrBlankNode | null = null;
            for (const triple of this.triplesBySubject.get(list)) {
                switch (triple.predicate) {
                    case Rdf.first:
                        if (first) {
                            return null;
                        }
                        first = triple.object;
                        break;
                    case Rdf.rest:
                        if (!IRIOrBlankNode.is(triple.object) || rest) {
                            return null;
                        }
                        rest = triple.object;
                        break;
                }
            }
            if (!first || !rest) {
                return null;
            }
            result.push(first);
            list = rest;
        }
        return result;
    }
}
