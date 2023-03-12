import { Project } from "../project.js";

export default function main(args: { project: string }): void {
    const project = Project.create(args.project);
    project.saveConfig();
}
