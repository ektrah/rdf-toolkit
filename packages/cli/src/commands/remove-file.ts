import * as os from "os";
import * as process from "process";
import { ProjectOptions } from "../options.js";
import { Project } from "../project.js";

type Options = {}
    & ProjectOptions

export default function main(documentURI: string, options: Options): void {
    const project = Project.from(options.project);
    if (project.config.files && documentURI in project.config.files) {
        delete project.config.files[documentURI];
        project.saveConfig();
        process.stdout.write(`<${documentURI}> \u2717${os.EOL}`);
    }
}
