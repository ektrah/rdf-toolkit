import { Ix } from "@rdf-toolkit/iterable";
import { IRI, IRIOrBlankNode, Literal, Term } from "../terms.js";
import { Triple } from "../triples.js";
import { Rdfs } from "../vocab.js";

export class SimpleGraph {

    constructor(private readonly dataset: Iterable<Iterable<Triple>>) {
    }

    triples(subject?: IRIOrBlankNode, predicate?: IRI, object?: Term): Ix<Triple> {
        let result = Ix.from(this.dataset).concatMap(triples => triples);
        result = subject ? result.filter(triple => triple.subject.equals(subject)) : result;
        result = predicate ? result.filter(triple => triple.predicate.equals(predicate)) : result;
        result = object ? result.filter(triple => triple.object.equals(object)) : result;
        return result;
    }

    subjects(predicate: IRI, object: Term): Ix<IRIOrBlankNode> {
        return this.triples(undefined, predicate, object).map(triple => triple.subject);
    }

    objects(subject: IRIOrBlankNode, predicate: IRI): Ix<Term> {
        return this.triples(subject, predicate, undefined).map(triple => triple.object);
    }

    getLabel(node: IRIOrBlankNode): Ix<Literal> {
        return this.objects(node, Rdfs.label).ofType(Literal.is);
    }

    getComment(node: IRIOrBlankNode): Ix<Literal> {
        return this.objects(node, Rdfs.comment).ofType(Literal.is);
    }
}
