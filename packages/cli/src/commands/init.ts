import { ProjectOptions } from "../options.js";
import { Project } from "../workspaces/project.js";

type Options =
    & ProjectOptions

export default function main(options: Options): void {
    const project = Project.create(options.project);
    project.saveConfig();
}
