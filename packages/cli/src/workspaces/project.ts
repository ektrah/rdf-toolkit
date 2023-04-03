import { DocumentUri } from "@rdf-toolkit/text";
import * as glob from "glob";
import * as path from "path";
import { ProjectConfig } from "../config.js";
import { Workspace } from "./workspace.js";

export class Project extends Workspace {
    readonly fileName: string

    config: ProjectConfig;

    static create(filePath: string): Project {
        const project = new Project(filePath);
        project.initConfig();
        return project;
    }

    static from(filePath: string): Project {
        const project = new Project(filePath);
        project.loadConfig();
        return project;
    }

    constructor(filePath: string) {
        super(path.dirname(filePath));
        this.fileName = this.relative(filePath);
        this.config = {};
    }

    addFile(documentURI: DocumentUri, filePath: string): boolean {
        filePath = this.relative(filePath);
        if (this.config.files?.[documentURI] !== filePath) {
            this.config.files ||= {};
            this.config.files[documentURI] = filePath;
            return true;
        }
        return false;
    }

    addSource(filePath: string): boolean {
        filePath = this.relative(filePath);
        if (!this.config.sources?.includes(filePath)) {
            this.config.sources ||= [];
            this.config.sources.push(filePath);
            this.config.sources.sort();
            return true;
        }
        return false;
    }

    getFiles(): Array<[DocumentUri, string]> {
        const files: Array<[DocumentUri, string]> = [];
        const projects = this.getSources();
        for (const filePath in projects) {
            const project = projects[filePath];
            if (project.config.files) {
                for (const documentURI in project.config.files) {
                    files.push([documentURI, project.resolve(project.config.files[documentURI])]);
                }
            }
        }
        return files;
    }

    getSources(): Record<string, Project> {
        const projects: Record<string, Project> = {};
        const queue: Array<Project> = [this];
        for (let i = 0; i < queue.length; i++) {
            const project = queue[i];
            projects[project.resolve(project.fileName)] = project;
            if (project.config.sources) {
                for (const pattern of project.config.sources) {
                    for (const filePath of glob.iterateSync(pattern, { absolute: true, cwd: project.directoryPath })) {
                        if (!(filePath in projects)) {
                            queue.push(Project.from(filePath));
                        }
                    }
                }
            }
        }
        return projects;
    }

    initConfig(): void {
        this.config = {};
    }

    loadConfig(): void {
        const value = this.readJSON(this.fileName);
        if (!ProjectConfig.is(value)) {
            throw new Error("Invalid project configuration")
        }
        this.config = value;
    }

    removeFile(documentURI: DocumentUri): boolean {
        if (this.config.files && documentURI in this.config.files) {
            delete this.config.files[documentURI];
            return true;
        }
        return false;
    }

    removeSource(filePath: string): boolean {
        filePath = this.relative(filePath);
        if (this.config.sources) {
            const index = this.config.sources.indexOf(filePath);
            if (index >= 0) {
                this.config.sources.splice(index, 1);
                return true;
            }
        }
        return false;
    }

    saveConfig(): void {
        this.writeJSON(this.fileName, this.config);
    }
}
