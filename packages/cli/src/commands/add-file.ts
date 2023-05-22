import { DocumentUri, IRIReference } from "@rdf-toolkit/text";
import { SyntaxKind } from "@rdf-toolkit/turtle";
import * as os from "node:os";
import * as process from "node:process";
import { printDiagnosticsAndExitOnError } from "../diagnostics.js";
import { PACKAGE_JSON } from "../model/package.js";
import { Project } from "../model/project.js";
import { DiagnosticOptions, ProjectOptions } from "../options.js";
import { Is } from "../type-checks.js";

type Options =
    & DiagnosticOptions
    & ProjectOptions

export default function main(documentURI: DocumentUri, filePath: string, options: Options): void {
    const project = new Project(options.project);
    const json = project.package.json;

    filePath = project.package.relative(filePath);

    const diagnostics = project.diagnostics;
    const syntaxTree = project.package.readSyntaxTree(documentURI, filePath, diagnostics)
    printDiagnosticsAndExitOnError(diagnostics, options);

    const files = Is.record(json["rdf:files"], Is.string) ? json["rdf:files"] : {};
    const prefixes = Is.record(json["rdf:prefixes"], Is.string) ? json["rdf:prefixes"] : {};
    if (files[documentURI] !== filePath) {
        files[documentURI] = filePath;
        json["rdf:files"] = files;

        {
            let baseIRI = IRIReference.parse(syntaxTree.document.uri);
            if (!baseIRI || !baseIRI.scheme) {
                throw new Error();
            }

            const namespaces = new Map<string, string>;
            let preferredPrefixLabel: string | undefined;
            let preferredNamespaceIRI: string | undefined;
            for (const node of syntaxTree.root.statements) {
                switch (node.kind) {
                    case SyntaxKind.PrefixDirective:
                    case SyntaxKind.SparqlPrefixDirective:
                        const prefixLabel = node.prefixLabel.value.prefixLabel;
                        const namespaceIRI = IRIReference.recompose(IRIReference.resolve(node.iriReference.value, baseIRI));
                        namespaces.set(prefixLabel, namespaceIRI);
                        if (namespaceIRI === documentURI || namespaceIRI === documentURI + "/" || namespaceIRI === documentURI + "#") {
                            preferredPrefixLabel = prefixLabel;
                            preferredNamespaceIRI = namespaceIRI;
                        }
                        break;

                    case SyntaxKind.BaseDirective:
                    case SyntaxKind.SparqlBaseDirective:
                        baseIRI = IRIReference.resolve(node.iriReference.value, baseIRI);
                        break;
                }
            }

            if (preferredPrefixLabel && preferredNamespaceIRI) {
                prefixes[preferredPrefixLabel] = preferredNamespaceIRI;
                json["rdf:prefixes"] = prefixes;
            }
        }

        project.package.writeJSON(PACKAGE_JSON, json, false);

        process.stdout.write("<");
        process.stdout.write(documentURI);
        process.stdout.write("> \u2192 ");
        process.stdout.write(filePath);
        process.stdout.write(os.EOL);
    }
}
