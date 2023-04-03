import { IRI, Literal } from "@rdf-toolkit/rdf/terms";
import { Owl, Xsd } from "@rdf-toolkit/rdf/vocab";
import { DiagnosticBag, DocumentUri } from "@rdf-toolkit/text";
import { SyntaxTree } from "@rdf-toolkit/turtle";
import * as os from "os";
import { printDiagnosticsAndExitOnError } from "../diagnostics.js";
import { DiagnosticOptions, ProjectOptions } from "../options.js";
import { Project } from "../workspaces/project.js";

type Options =
    & DiagnosticOptions
    & ProjectOptions

interface OWLOntology {
    readonly documentURI: string;
    readonly filePath: string;
    readonly ontologyIRI?: string;
    readonly imports: ReadonlyArray<string>;
}

function getRetrievalURLFromIRI(ontologyIRI: string): DocumentUri {
    const url = new URL(ontologyIRI);
    url.hash = "";
    return url.href;
}

function printOntology(documentURI: DocumentUri, ontologies: Record<DocumentUri, OWLOntology>, project: Project, indentation: string): void {
    const ontology: OWLOntology | undefined = ontologies[documentURI];

    if (ontology) {
        process.stdout.write(`\u257C <${ontology.ontologyIRI || ontology.documentURI}> \u2192 ${project.relative(ontology.filePath)}${os.EOL}`);

        for (let i = 0; i < ontology.imports.length; i++) {
            process.stdout.write(indentation);
            process.stdout.write(i + 1 < ontology.imports.length ? "  \u251C" : "  \u2570");
            printOntology(
                getRetrievalURLFromIRI(ontology.imports[i]),
                ontologies,
                project,
                indentation + (i + 1 < ontology.imports.length ? "  \u2502" : "   "))
        }
    }
    else {
        process.stdout.write(`\u257C <${documentURI}> \u2717${os.EOL}`);
    }
}

function printOntologies(ontologies: Record<DocumentUri, OWLOntology>, project: Project): void {
    const namespaceURIs = Object.keys(ontologies).sort();
    if (namespaceURIs.length) {
        process.stdout.write(`  \u2564${os.EOL}`);

        for (let i = 0; i < namespaceURIs.length; i++) {
            process.stdout.write(i + 1 < namespaceURIs.length ? "  \u251C" : "  \u2570");
            printOntology(
                namespaceURIs[i],
                ontologies,
                project,
                (i + 1 < namespaceURIs.length ? "  \u2502" : "   "))
        }
    }
}

export default function main(options: Options): void {
    const project = Project.from(options.project);
    const diagnostics = DiagnosticBag.create();
    const ontologies: Record<DocumentUri, OWLOntology> = {};

    for (const [documentURI, filePath] of project.getFiles()) {
        const syntaxTree = project.readSyntaxTree(documentURI, filePath, diagnostics);
        if (!diagnostics.errors) {
            const triples = SyntaxTree.compileTriples(syntaxTree, diagnostics);
            if (!diagnostics.errors) {
                let ontologyIRI: string | undefined;
                const imports: string[] = [];

                for (const triple of triples) {
                    if (triple.predicate === Owl.imports) {
                        if (IRI.is(triple.subject)) {
                            ontologyIRI = triple.subject.value;
                        }
                        if (IRI.is(triple.object) || (Literal.is(triple.object) && (triple.object.datatype === Xsd.string || triple.object.datatype === Xsd.anyURI))) {
                            if (!imports.includes(triple.object.value)) {
                                imports.push(triple.object.value);
                            }
                        }
                    }
                }

                ontologies[documentURI] = {
                    documentURI,
                    filePath,
                    ontologyIRI,
                    imports: imports.sort()
                };
            }
        }
    }

    printDiagnosticsAndExitOnError(diagnostics, options);

    printOntologies(ontologies, project);
}
