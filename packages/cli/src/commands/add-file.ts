import * as fs from "fs";
import * as os from "os";
import * as process from "process";
import { Project } from "../project.js";

export default async function main(documentURI: string, filePath: string, args: { fetch: boolean, project: string }): Promise<void> {
    const project = Project.from(args.project);
    filePath = project.relative(filePath);

    if (!project.exists(filePath) && args.fetch) {
        const response = await fetch(new URL(documentURI));
        if (response.ok) {
            const buffer = await response.arrayBuffer();
            project.writeFile(filePath, Buffer.from(buffer));
        }
    }
    project.access(filePath, fs.constants.R_OK);

    project.config.files ||= {};
    if (project.config.files[documentURI] !== filePath) {
        project.config.files[documentURI] = filePath;
        project.saveConfig();
        process.stdout.write(`<${documentURI}> \u2192 ${filePath}${os.EOL}`);
    }
}
