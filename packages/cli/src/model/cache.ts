import { DiagnosticBag } from "@rdf-toolkit/text";
import { Ontology } from "./ontology.js";
import { Package } from "./package.js";

export interface ModelCache {
    readonly diagnostics: DiagnosticBag;
    readonly files: Map<string, Ontology>;
    readonly packages: Map<string, Package>;
}
