import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import prettyBytes from "pretty-bytes";
import * as process from "process";

export class Site {

    readonly siteDirectoryPath: string;

    constructor(private readonly projectDirectoryPath: string, siteDirectory: string) {
        this.siteDirectoryPath = path.resolve(projectDirectoryPath, siteDirectory);
    }

    writeFile(file: string, data: Buffer): string {
        const filePath = path.resolve(this.siteDirectoryPath, file);
        const directoryPath = path.dirname(filePath);
        process.stderr.write(`${path.relative(this.projectDirectoryPath, filePath)} (${prettyBytes(data.length)})${os.EOL}`);
        fs.mkdirSync(directoryPath, { recursive: true });
        fs.writeFileSync(filePath, data);
        return filePath;
    }
}
