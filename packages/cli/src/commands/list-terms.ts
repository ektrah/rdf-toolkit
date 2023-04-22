import * as os from "node:os";
import * as process from "node:process";
import { Project } from "../model/project.js";
import { TextFile } from "../model/textfile.js";
import { ProjectOptions } from "../options.js";

type Options =
    & ProjectOptions

function printTerms(file: TextFile, indentation: string): void {
    const terms = Array.from(file.terms).sort((a, b) => a.compareTo(b));

    for (let i = 0; i < terms.length; i++) {
        process.stdout.write(indentation);
        process.stdout.write(i + 1 < terms.length ? "  \u251C" : "  \u2570");
        process.stdout.write("\u257C <");
        process.stdout.write(terms[i].value);
        process.stdout.write(">");
        process.stdout.write(os.EOL);
    }
}

function printFiles(project: Project): void {
    const files = Array.from(project.package.files).sort();

    for (let i = 0; i < files.length; i++) {
        const [documentURI, file] = files[i];

        process.stdout.write(i + 1 < files.length ? "  \u251C" : "  \u2570");
        process.stdout.write("\u257C <");
        process.stdout.write(documentURI);
        process.stdout.write(">");
        if (file) {
            process.stdout.write(" \u2192 ");
            process.stdout.write(project.package.relative(file.filePath));
            process.stdout.write(os.EOL);

            printTerms(file, i + 1 < files.length ? "  \u2502" : "   ");
        }
        else {
            process.stdout.write(" \u00D7");
            process.stdout.write(os.EOL);
        }
    }
}

export default function main(options: Options): void {
    const project = new Project(options.project);

    if (project.files.size) {
        process.stdout.write("  \u2564");
        process.stdout.write(os.EOL);

        printFiles(project);
    }
}
