import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { ProjectConfig } from "./config.js";

export class Project {
	readonly projectFilePath: string
	readonly projectDirectoryPath: string;

	config: ProjectConfig;

	constructor(projectFilePath: string) {
		this.projectFilePath = path.resolve(projectFilePath);
		this.projectDirectoryPath = path.dirname(this.projectFilePath);
		this.config = {};
	}

	load(): Project {
		const config = JSON.parse(fs.readFileSync(this.projectFilePath, { encoding: "utf-8" }));
		if (!ProjectConfig.is(config)) {
			throw new Error("Invalid project file");
		}
		this.config = config;
		return this;
	}

	save(): Project {
		let data = JSON.stringify(this.config, undefined, 2).replace(/\n|\r\n?/g, os.EOL);
		if (!data.endsWith(os.EOL)) {
			data += os.EOL;
		}
		fs.writeFileSync(this.projectFilePath, data, { encoding: "utf-8" });
		return this;
	}

	resolve(filePath: string): string {
		return path.resolve(this.projectDirectoryPath, filePath);
	}

	relative(filePath: string): string {
		const relativeFilePath = path.relative(this.projectDirectoryPath, filePath);
		return path.isAbsolute(relativeFilePath)
			? relativeFilePath
			: relativeFilePath.replace(path.sep, path.posix.sep);
	}

	readFile(filePath: string): Buffer {
		filePath = path.resolve(this.projectDirectoryPath, filePath);
		return fs.readFileSync(filePath);
	}

	writeFile(filePath: string, data: Buffer): void {
		filePath = path.resolve(this.projectDirectoryPath, filePath);
		fs.mkdirSync(path.dirname(filePath), { recursive: true });
		fs.writeFileSync(filePath, data);
	}
}
