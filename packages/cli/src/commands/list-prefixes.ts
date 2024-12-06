import { Ix } from "@rdf-toolkit/iterable";
import * as os from "node:os";
import * as process from "node:process";
import { Project } from "../model/project.js";
import { ProjectOptions } from "../options.js";

type Options =
    & ProjectOptions

function printPrefixes(project: Project): void {
    const prefixes = Array.from(project.prefixes).sort();

    for (let i = 0; i < prefixes.length; i++) {
        const [prefixLabel, iriSet] = prefixes[i];
        const namespaceIRI = Ix.from(iriSet).singleOrDefault(null);

        process.stdout.write(i + 1 < prefixes.length ? "  \u251C" : "  \u2570");
        process.stdout.write("\u257C ");
        process.stdout.write(prefixLabel);
        process.stdout.write(":");
        if (namespaceIRI) {
            process.stdout.write(" <");
            process.stdout.write(namespaceIRI);
            process.stdout.write(">");
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

    if (project.prefixes.size) {
        process.stdout.write("  \u2564");
        process.stdout.write(os.EOL);

        printPrefixes(project);
    }
}
