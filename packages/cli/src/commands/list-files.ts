import * as fs from "fs";
import * as os from "os";
import * as process from "process";
import { Project } from "../project.js";

export default function main(args: { project: string }): void {
    const project = Project.from(args.project);
    const files = Object
        .entries(project.config.files || {})
        .sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]));
    for (const [documentURI, filePath] of files) {
        project.access(filePath, fs.constants.R_OK);
        process.stdout.write(`<${documentURI}> \u2192 ${filePath}${os.EOL}`);
    }
}
