import { DiagnosticBag, DocumentUri } from "@rdf-toolkit/text";
import * as os from "os";
import { printDiagnosticsAndExitOnError } from "../diagnostics.js";
import { DiagnosticOptions, ProjectOptions } from "../options.js";
import { Project } from "../workspaces/project.js";

type Options =
    & DiagnosticOptions
    & ProjectOptions

export default function main(documentURI: DocumentUri, filePath: string, options: Options): void {
    const project = Project.from(options.project);
    filePath = project.relative(filePath);

    const diagnostics = DiagnosticBag.create();
    project.readSyntaxTree(documentURI, filePath, diagnostics);
    printDiagnosticsAndExitOnError(diagnostics, options);

    project.config.files ||= {};
    if (project.config.files[documentURI] !== filePath) {
        project.config.files[documentURI] = filePath;
        project.saveConfig();
        process.stdout.write(`<${documentURI}> \u2192 ${filePath}${os.EOL}`);
    }
}
