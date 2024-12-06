import * as os from "node:os";
import * as process from "node:process";
import { PACKAGE_JSON } from "../model/package.js";
import { Project } from "../model/project.js";
import { ProjectOptions } from "../options.js";
import { Is } from "../type-checks.js";

type Options =
    & ProjectOptions

export default function main(prefixLabel: string, options: Options): void {
    const project = new Project(options.project);
    const json = project.package.json;

    if (Is.record(json["rdf:prefixes"], Is.string) && (prefixLabel in json["rdf:prefixes"])) {
        delete json["rdf:prefixes"][prefixLabel];
        project.package.writeJSON(PACKAGE_JSON, json, false);
        process.stdout.write(prefixLabel);
        process.stdout.write(": \u00D7");
        process.stdout.write(os.EOL);
    }
}
