import * as os from "os";
import { ProjectOptions } from "../options.js";
import { Project } from "../workspaces/project.js";

type Options =
    & ProjectOptions

export default function main(options: Options): void {
    const project = Project.from(options.project);

    for (const filePath of Object.keys(project.getSources()).sort()) {
        process.stdout.write(`${project.relative(filePath)}${os.EOL}`);
    }
}
