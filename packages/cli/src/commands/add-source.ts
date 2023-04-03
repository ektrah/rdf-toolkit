import { ProjectOptions } from "../options.js";
import { Project } from "../workspaces/project.js";

type Options =
    & ProjectOptions

export default function main(filePath: string, options: Options): void {
    const project = Project.from(options.project);

    if (project.addSource(filePath)) {
        project.saveConfig();
    }
}
