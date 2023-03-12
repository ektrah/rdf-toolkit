import * as fs from "fs";
import * as os from "os";
import * as path from "path";

export class Workspace {

    constructor(readonly directoryPath: string) {
    }

    access(filePath: string, mode?: number): void {
        fs.accessSync(this.resolve(filePath), mode);
    }

    exists(filePath: string): boolean {
        return fs.existsSync(this.resolve(filePath));
    }

    readFile(filePath: string): Buffer {
        return fs.readFileSync(this.resolve(filePath));
    }

    readJSONFile(filePath: string): any {
        return JSON.parse(this.readTextFile(filePath));
    }

    readTextFile(filePath: string): string {
        return fs.readFileSync(this.resolve(filePath), { encoding: "utf-8" });
    }

    relative(filePath: string): string {
        filePath = path.relative(this.directoryPath, filePath);
        return path.isAbsolute(filePath) ? filePath : filePath.replace(path.sep, path.posix.sep);
    }

    resolve(filePath: string): string {
        return path.resolve(this.directoryPath, filePath);
    }

    writeFile(filePath: string, data: Buffer): void {
        filePath = this.resolve(filePath);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, data);
    }

    writeJSONFile(filePath: string, value: any): void {
        const data = JSON.stringify(value, undefined, 2).replace(/\n|\r\n?/g, os.EOL);
        this.writeTextFile(filePath, data.endsWith(os.EOL) ? data : data + os.EOL);
    }

    writeTextFile(filePath: string, text: string): void {
        filePath = this.resolve(filePath);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, text, { encoding: "utf-8" });
    }
}
