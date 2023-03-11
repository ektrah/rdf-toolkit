import { Project } from "../project.js";

export default function main(documentURI: string, filePath: string, args: { project: string }): void {
    const project = new Project(args.project).load();
    project.config.files ||= {};
    project.config.files[documentURI] = project.relative(filePath);
    project.save();
}
