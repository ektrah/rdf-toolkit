import * as os from "node:os";
import * as process from "node:process";
import { Project } from "../model/project.js";
import { ProjectOptions } from "../options.js";

type Options =
    & ProjectOptions

function printOntologies(project: Project): void {
    const ontologies = Array.from(project.ontologies).sort();

    for (let i = 0; i < ontologies.length; i++) {
        const [documentURI, ontology] = ontologies[i];

        process.stdout.write(i + 1 < ontologies.length ? "  \u251C" : "  \u2570");
        process.stdout.write("\u257C <");
        process.stdout.write(documentURI);
        process.stdout.write(">");
        if (ontology) {
            process.stdout.write(" \u2192 ");
            process.stdout.write(project.package.relative(ontology.filePath));
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

    if (project.ontologies.size) {
        process.stdout.write("  \u2564");
        process.stdout.write(os.EOL);

        printOntologies(project);
    }
}
