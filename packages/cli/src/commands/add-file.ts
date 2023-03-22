import { DiagnosticBag } from "@rdf-toolkit/text";
import * as os from "os";
import * as process from "process";
import { printDiagnosticsAndExitOnError } from "../diagnostics.js";
import { DiagnosticOptions, ProjectOptions } from "../options.js";
import { Project } from "../project.js";

type Options = { readonly fetch?: boolean }
    & ProjectOptions
    & DiagnosticOptions

export default async function main(documentURI: string, filePath: string, options: Options): Promise<void> {
    const project = Project.from(options.project);
    filePath = project.relative(filePath);

    if (!project.exists(filePath) && options.fetch) {
        const headers = new Headers();
        headers.append("Accept", "text/turtle");
        const response = await fetch(documentURI, { headers });
        if (response.ok) {
            const buffer = await response.arrayBuffer();
            project.write(filePath, Buffer.from(buffer));
        }
    }

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
