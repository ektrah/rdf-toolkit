import { DocumentUri } from "@rdf-toolkit/text";
import * as os from "node:os";
import * as process from "node:process";
import { PACKAGE_JSON } from "../model/package.js";
import { Project } from "../model/project.js";
import { ProjectOptions } from "../options.js";
import { Is } from "../type-checks.js";

type Options =
    & ProjectOptions

export default function main(documentURI: DocumentUri, options: Options): void {
    const project = new Project(options.project);
    const json = project.package.json;

    if (Is.record(json["rdf:files"], Is.string) && (documentURI in json["rdf:files"])) {
        delete json["rdf:files"][documentURI];
        project.package.writeJSON(PACKAGE_JSON, json, false);
        process.stdout.write("<");
        process.stdout.write(documentURI);
        process.stdout.write("> \u00D7");
        process.stdout.write(os.EOL);
    }
}
