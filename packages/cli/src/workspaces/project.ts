import { DocumentUri } from "@rdf-toolkit/text";
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

    getFiles(): Array<[DocumentUri, string]> {
        const files: Array<[DocumentUri, string]> = [];
        if (this.config.files) {
            for (const documentURI in this.config.files) {
                files.push([documentURI, this.resolve(this.config.files[documentURI])]);
            }
        }
        return files;
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

    saveConfig(): void {
        this.writeJSON(this.fileName, this.config);
    }
}
