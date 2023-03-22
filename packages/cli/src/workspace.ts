import { DiagnosticBag, TextDocument } from "@rdf-toolkit/text";
import { SyntaxTree } from "@rdf-toolkit/turtle";
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

    read(filePath: string): Buffer {
        return fs.readFileSync(this.resolve(filePath));
    }

    readJSON(filePath: string): any {
        return JSON.parse(this.readText(filePath));
    }

    readSyntaxTree(documentURI: string, filePath: string, diagnostics: DiagnosticBag): SyntaxTree {
        return SyntaxTree.parse(this.readTextDocument(documentURI, filePath), diagnostics);
    }

    readText(filePath: string): string {
        return fs.readFileSync(this.resolve(filePath), { encoding: "utf-8" });
    }

    readTextDocument(documentURI: string, filePath: string): TextDocument {
        // see <https://code.visualstudio.com/docs/languages/identifiers>
        const language =
            /[.](?:md|mkdn?|mdwn|mdown|markdown)$/i.test(filePath) ? "markdown" :
                /[.](?:ttl)$/i.test(filePath) ? "turtle" :
                    /[.](?:owl|rdf|xml)$/i.test(filePath) ? "xml" :
                        "plaintext";
        return TextDocument.create(documentURI, language, 0, this.readText(filePath));
    }

    relative(filePath: string): string {
        filePath = path.relative(this.directoryPath, filePath);
        return path.isAbsolute(filePath) ? filePath : filePath.split(path.sep).join(path.posix.sep);
    }

    resolve(filePath: string): string {
        return path.resolve(this.directoryPath, filePath);
    }

    write(filePath: string, data: Buffer): void {
        filePath = this.resolve(filePath);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, data);
    }

    writeJSON(filePath: string, value: any): void {
        const data = JSON.stringify(value, undefined, 2).replace(/\n|\r\n?/g, os.EOL);
        this.writeText(filePath, data.endsWith(os.EOL) ? data : data + os.EOL);
    }

    writeSyntaxTree(filePath: string, syntaxTree: SyntaxTree): void {
        this.writeTextDocument(filePath, syntaxTree.document);
    }

    writeText(filePath: string, text: string): void {
        filePath = this.resolve(filePath);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, text, { encoding: "utf-8" });
    }

    writeTextDocument(filePath: string, document: TextDocument): void {
        this.writeText(filePath, document.getText());
    }
}
