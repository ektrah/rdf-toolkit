import * as os from "node:os";
import * as process from "node:process";
import { PACKAGE_JSON } from "../model/package.js";
import { Project } from "../model/project.js";
import { ProjectOptions } from "../options.js";
import { Is } from "../type-checks.js";

type Options =
    & ProjectOptions

export default function main(prefixLabel: string, namespaceIRI: string, options: Options): void {
    const project = new Project(options.project);
    const json = project.package.json;

    const prefixes = Is.record(json["rdf:prefixes"], Is.string) ? json["rdf:prefixes"] : {};
    if (prefixes[prefixLabel] !== namespaceIRI) {
        prefixes[prefixLabel] = namespaceIRI;
        json["rdf:prefixes"] = prefixes;
        project.package.writeJSON(PACKAGE_JSON, json, false);

        process.stdout.write(prefixLabel);
        process.stdout.write(": <");
        process.stdout.write(namespaceIRI);
        process.stdout.write(">");
        process.stdout.write(os.EOL);
    }
}
