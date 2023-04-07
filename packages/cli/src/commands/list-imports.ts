import { DocumentUri } from "@rdf-toolkit/text";
import * as os from "node:os";
import { Ontology } from "../model/ontology.js";
import { Project } from "../model/project.js";
import { DiagnosticOptions, ProjectOptions } from "../options.js";

type Options =
    & DiagnosticOptions
    & ProjectOptions

const stack: Array<string> = [];

function printOntologies(ontologies2: ReadonlyMap<DocumentUri, Ontology | null>, project: Project, indentation: string): void {
    const ontologies = Array.from(ontologies2)
        .filter(([x]) => !stack.includes(x))
        .sort();

    for (let i = 0; i < ontologies.length; i++) {
        const [documentURI, ontology] = ontologies[i];

        process.stdout.write(indentation);
        process.stdout.write(i + 1 < ontologies.length ? "  \u251C" : "  \u2570");
        process.stdout.write("\u257C <");
        process.stdout.write(documentURI);
        process.stdout.write(">");
        if (ontology) {
            process.stdout.write(" \u2192 ");
            process.stdout.write(project.package.relative(ontology.filePath));
            process.stdout.write(os.EOL);

            stack.push(documentURI);
            printOntologies(ontology.imports, project, indentation + (i + 1 < ontologies.length ? "  \u2502" : "   "));
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

    if (project.package.ontologies.size) {
        process.stdout.write("  \u2564");
        process.stdout.write(os.EOL);

        printOntologies(project.package.ontologies, project, "");
    }
}
