import * as fs from "fs";
import * as os from "os";
import * as process from "process";
import { ProjectOptions } from "../options.js";
import { Project } from "../workspaces/project.js";

type Options =
    & ProjectOptions

export default function main(options: Options): void {
    const project = Project.from(options.project);

    for (const [documentURI, filePath] of project.getFiles().sort()) {
        fs.accessSync(filePath, fs.constants.R_OK);
        process.stdout.write(`<${documentURI}> \u2192 ${project.relative(filePath)}${os.EOL}`);
    }
}
