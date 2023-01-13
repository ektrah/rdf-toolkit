// @ts-ignore
import owl from "./vocab/owl.ttl";
// @ts-ignore
import rdf from "./vocab/rdf.ttl";
// @ts-ignore
import rdfs from "./vocab/rdfs.ttl";
// @ts-ignore
import xsd from "./vocab/xsd.ttl";
// @ts-ignore
import worker from "./worker/worker.js";

export namespace Assets {

    export const vocabularies: Readonly<Record<string, string>> = {
        "http://www.w3.org/1999/02/22-rdf-syntax-ns": rdf,
        "http://www.w3.org/2000/01/rdf-schema": rdfs,
        "http://www.w3.org/2001/XMLSchema": xsd,
        "http://www.w3.org/2002/07/owl": owl,
    };

    export const workerScript: string = worker;
}
