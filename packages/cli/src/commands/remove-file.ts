import { Project } from "../project.js";

export default function main(documentURI: string, args: { project: string }): void {
    const project = new Project(args.project).load();
    project.config.files ||= {};
    delete project.config.files[documentURI];
    project.save();
}
