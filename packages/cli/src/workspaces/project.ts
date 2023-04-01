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

    saveConfig(): void {
        this.writeJSON(this.fileName, this.config);
    }
}
