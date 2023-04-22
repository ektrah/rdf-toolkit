import { Ix } from "@rdf-toolkit/iterable";
import * as os from "node:os";
import * as process from "node:process";
import { Project } from "../model/project.js";
import { ProjectOptions } from "../options.js";

type Options =
    & ProjectOptions

function printFiles(project: Project): void {
    const files = Array.from(project.files).sort();

    for (let i = 0; i < files.length; i++) {
        const [documentURI, fileSet] = files[i];
        const file = Ix.from(fileSet).singleOrDefault(null);

        process.stdout.write(i + 1 < files.length ? "  \u251C" : "  \u2570");
        process.stdout.write("\u257C <");
        process.stdout.write(documentURI);
        process.stdout.write(">");
        if (file) {
            process.stdout.write(" \u2192 ");
            process.stdout.write(project.package.relative(file.filePath));
            process.stdout.write(os.EOL);
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
