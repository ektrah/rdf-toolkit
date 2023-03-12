import * as os from "os";
import * as process from "process";
import { Project } from "../project.js";

export default function main(documentURI: string, args: { project: string }): void {
    const project = Project.from(args.project);
    if (project.config.files && documentURI in project.config.files) {
        delete project.config.files[documentURI];
        project.saveConfig();
        process.stdout.write(`<${documentURI}> \u2717${os.EOL}`);
    }
}
