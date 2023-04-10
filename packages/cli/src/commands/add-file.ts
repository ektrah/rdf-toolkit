import { DocumentUri } from "@rdf-toolkit/text";
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
    project.package.readSyntaxTree(documentURI, filePath, diagnostics)
    printDiagnosticsAndExitOnError(diagnostics, options);

    const files = Is.record(json.ontologies, Is.string) ? json.ontologies : {};
    if (files[documentURI] !== filePath) {
        files[documentURI] = filePath;
        json.ontologies = files;
        project.package.writeJSON(PACKAGE_JSON, json, false);

        process.stdout.write("<");
        process.stdout.write(documentURI);
        process.stdout.write("> \u2192 ");
        process.stdout.write(filePath);
        process.stdout.write(os.EOL);
    }
}
