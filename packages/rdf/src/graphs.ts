import { Ix } from "@rdf-toolkit/iterable";
import { OWLEngine } from "./engines/owl.js";
import { RDFSEngine } from "./engines/rdfs.js";
import { SHACLEngine } from "./engines/shacl.js";
import { XSDEngine } from "./engines/xsd.js";
import { RichGraph } from "./graphs/rich.js";
import { IRI, IRIOrBlankNode, Literal, Term } from "./terms.js";
import { Triple } from "./triples.js";

export interface Graph {

    triples(subject?: IRIOrBlankNode, predicate?: IRI, object?: Term): Ix<Triple>;
    subjects(predicate: IRI, object: Term): Ix<IRIOrBlankNode>;
    objects(subject: IRIOrBlankNode, predicate: IRI): Ix<Term>;

    getLabel(node: IRIOrBlankNode): Ix<Literal>;
    getComment(node: IRIOrBlankNode): Ix<Literal>;

    list(head: IRIOrBlankNode): Term[] | null;

    classes(): Ix<IRIOrBlankNode>;
    domains(): Ix<[IRI, IRIOrBlankNode]>;
    getInstances(class_: IRIOrBlankNode): Ix<IRIOrBlankNode>;
    getPropertyDomain(property: IRI): Ix<IRIOrBlankNode>;
    getPropertyRange(property: IRI): Ix<IRIOrBlankNode>;
    getSuperClasses(type: IRIOrBlankNode): Ix<IRIOrBlankNode>;
    getSuperProperties(property: IRI): Ix<IRI>;
    isClass(resource: Term): boolean;
    isDatatype(resource: Term): boolean;
    isInstanceOf(resource: Term, type: IRIOrBlankNode): boolean;
    isProperty(property: Term): boolean;
    isSubClassOf(resource: Term, class_: IRIOrBlankNode): boolean;
    isSubPropertyOf(resource: Term, property: IRI): boolean;
    properties(): Ix<IRI>;
    ranges(): Ix<[IRI, IRIOrBlankNode]>;

    getTypes(resource: Term): Ix<IRIOrBlankNode>;
    getSubClasses(class_: IRIOrBlankNode): Ix<IRIOrBlankNode>;
    getSubProperties(property: IRI): Ix<IRI>;

    getDirectInstances(class_: IRIOrBlankNode): Ix<IRIOrBlankNode>;
    getDirectTypes(resource: Term): Ix<IRIOrBlankNode>;
    getDirectSuperClasses(type: IRIOrBlankNode): Ix<IRIOrBlankNode>;
    getDirectSubClasses(type: IRIOrBlankNode): Ix<IRIOrBlankNode>;
    getDirectSuperProperties(property: IRI): Ix<IRI>;
    getDirectSubProperties(property: IRI): Ix<IRI>;

    getEquivalentClasses(type: IRIOrBlankNode): Ix<IRIOrBlankNode>;
    isDeprecated(resource: IRIOrBlankNode): boolean;
}

export namespace Graph {

    export function from(dataset: readonly (readonly Triple[])[]): Graph {
        return new GraphBuilder(dataset).build();
    }
}

interface Engine {
    ingest(triple: Triple): boolean;

    beforeinterpret(): Generator<Triple>;
    interpret(triple: Triple): Generator<Triple>;
    afterinterpret(): Generator<Triple>;
}

class GraphBuilder {
    private readonly rdfsEngine: RDFSEngine = new RDFSEngine();
    private readonly owlEngine: OWLEngine = new OWLEngine();
    private readonly shaclEngine: SHACLEngine = new SHACLEngine();
    private readonly xsdEngine: XSDEngine = new XSDEngine();

    private readonly dataset: Iterable<Iterable<Triple>>;
    private readonly triples: Triple[];

    constructor(dataset: Iterable<Iterable<Triple>>) {
        this.dataset = [...dataset, this.triples = []];
    }

    ingest(triples: Iterable<Triple>): void {
        for (const triple of triples) {
            const a = this.rdfsEngine.ingest(triple);
            const b = this.owlEngine.ingest(triple);
            const c = this.shaclEngine.ingest(triple);
            const d = this.xsdEngine.ingest(triple);
            if (a || b || c || d) {
                this.triples.push(triple);
            }
        }
    }

    build(): Graph {
        for (const triples of this.dataset) {
            for (const triple of triples) {
                this.rdfsEngine.ingest(triple);
                this.owlEngine.ingest(triple);
                this.shaclEngine.ingest(triple);
                this.xsdEngine.ingest(triple);
            }
        }

        this.ingest(this.rdfsEngine.beforeinterpret());
        this.ingest(this.owlEngine.beforeinterpret());
        this.ingest(this.shaclEngine.beforeinterpret());
        this.ingest(this.xsdEngine.beforeinterpret());

        let length;
        do {
            length = this.triples.length;

            for (const triples of this.dataset) {
                for (const triple of triples) {
                    this.ingest(this.rdfsEngine.interpret(triple));
                    this.ingest(this.owlEngine.interpret(triple));
                    this.ingest(this.shaclEngine.interpret(triple));
                    this.ingest(this.xsdEngine.interpret(triple));
                }
            }
        }
        while (length < this.triples.length);

        this.ingest(this.rdfsEngine.afterinterpret());
        this.ingest(this.owlEngine.afterinterpret());
        this.ingest(this.shaclEngine.afterinterpret());
        this.ingest(this.xsdEngine.afterinterpret());

        return new RichGraph(this.dataset, this.rdfsEngine, this.owlEngine);
    }
}
