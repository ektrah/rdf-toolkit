import { Ix } from "@rdf-toolkit/iterable";
import { DocumentUri } from "@rdf-toolkit/text";
import * as os from "node:os";
import { Project } from "../model/project.js";
import { TextFile } from "../model/textfile.js";
import { DiagnosticOptions, ProjectOptions } from "../options.js";

type Options =
    & DiagnosticOptions
    & ProjectOptions

const stack: Array<string> = [];

function printFiles(files: ArrayLike<[DocumentUri, TextFile | null]>, project: Project, indentation: string): void {
    for (let i = 0; i < files.length; i++) {
        const [documentURI, file] = files[i];

        process.stdout.write(indentation);
        process.stdout.write(i + 1 < files.length ? "  \u251C" : "  \u2570");
        process.stdout.write("\u257C <");
        process.stdout.write(documentURI);
        process.stdout.write(">");
        if (file) {
            process.stdout.write(" \u2192 ");
            process.stdout.write(project.package.relative(file.filePath));
            process.stdout.write(os.EOL);

            stack.push(documentURI);
            printFiles(Ix.from(file.imports).map(ontologyIRI => project.resolveImport(ontologyIRI)).toArray().sort(), project, indentation + (i + 1 < files.length ? "  \u2502" : "   "));
            stack.pop();
        }
        else {
            process.stdout.write(" \u00D7");
            process.stdout.write(os.EOL);
        }
    }
}

export default function main(options: Options): void {
    const project = new Project(options.project);
    const files = Array.from(project.package.files).sort();

    if (files.length) {
        process.stdout.write("  \u2564");
        process.stdout.write(os.EOL);

        printFiles(files, project, "");
    }
}
