import * as path from "node:path";
import { PackageConfig, PACKAGE_JSON } from "../model/package.js";
import { Project } from "../model/project.js";
import { ForceOptions, ProjectOptions } from "../options.js";

type Options =
    & ForceOptions
    & ProjectOptions

export default function main(options: Options): void {
    const project = new Project(options.project);

    // https://docs.npmjs.com/creating-a-package-json-file#default-values-extracted-from-the-current-directory
    const json: PackageConfig = {
        name: path.basename(options.project),
        version: "1.0.0",
        description: "",
        keywords: [],
        author: "",
        license: "ISC"
    };

    project.package.writeJSON(PACKAGE_JSON, json, !options.force);
}
