import { DocumentUri } from "@rdf-toolkit/text";
import { PrefixDirective, SymbolTable, SyntaxKind } from "@rdf-toolkit/turtle";
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
    const syntaxTree = project.package.readSyntaxTree(documentURI, filePath, diagnostics);
    const symbolTable = SymbolTable.from(syntaxTree, project.diagnostics);
    printDiagnosticsAndExitOnError(diagnostics, options);

    const files = Is.record(json["rdf:files"], Is.string) ? json["rdf:files"] : {};
    const prefixes = Is.record(json["rdf:prefixes"], Is.string) ? json["rdf:prefixes"] : {};
    if (files[documentURI] !== filePath) {
        files[documentURI] = filePath;
        json["rdf:files"] = files;

        let preferredPrefix: PrefixDirective | undefined;
        for (const statement of syntaxTree.root.statements) {
            if (statement.kind === SyntaxKind.PrefixDirective || statement.kind === SyntaxKind.SparqlPrefixDirective) {
                const prefix = symbolTable.get(statement);
                if (prefix && prefix.prefixLabel) {
                    try {
                        const url = new URL(prefix.namespaceIRI);
                        url.hash = "";
                        if (url.href === documentURI) {
                            preferredPrefix = prefix;
                            break;
                        }
                    }
                    catch {
                        // continue regardless of error
                    }
                }
            }
        }

        if (preferredPrefix && !Object.values(prefixes).includes(preferredPrefix.namespaceIRI)) {
            prefixes[preferredPrefix.prefixLabel] = preferredPrefix.namespaceIRI;
            json["rdf:prefixes"] = prefixes;
        }

        project.package.writeJSON(PACKAGE_JSON, json, false);

        process.stdout.write("<");
        process.stdout.write(documentURI);
        process.stdout.write("> \u2192 ");
        process.stdout.write(filePath);
        process.stdout.write(os.EOL);
    }
}
