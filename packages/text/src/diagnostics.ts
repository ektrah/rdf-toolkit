import { Diagnostic, DiagnosticSeverity, DocumentUri } from "vscode-languageserver-types";

export interface DiagnosticBag {
    [Symbol.iterator](): IterableIterator<[DocumentUri, Diagnostic]>;
    add(documentUri: DocumentUri, diagnostic: Diagnostic): void;
    clear(): void;
    delete(documentUri: DocumentUri): void;
    entries(): IterableIterator<[DocumentUri, Diagnostic]>;
    get(documentUri: DocumentUri): IterableIterator<Diagnostic>;
    has(documentUri: DocumentUri): boolean;
    keys(): IterableIterator<DocumentUri>;
    readonly errors: number;
    readonly warnings: number;
}

class FullDiagnosticBag implements DiagnosticBag {

    private bag: { [P in string]?: Diagnostic[] };

    errors: number;
    warnings: number;

    constructor() {
        this.bag = {};
        this.errors = 0;
        this.warnings = 0;
    }

    [Symbol.iterator](): IterableIterator<[string, Diagnostic]> {
        return this.entries();
    }

    add(documentUri: DocumentUri, diagnostic: Diagnostic): void {
        (this.bag[documentUri] || (this.bag[documentUri] = [])).push(diagnostic);
        this.errors += diagnostic.severity === DiagnosticSeverity.Error ? 1 : 0;
        this.warnings += diagnostic.severity === DiagnosticSeverity.Warning ? 1 : 0;
    }

    clear(): void {
        this.bag = {};
        this.errors = 0;
        this.warnings = 0;
    }

    delete(documentUri: DocumentUri): void {
        delete this.bag[documentUri];

    }

    *entries(): IterableIterator<[DocumentUri, Diagnostic]> {
        for (const key in this.bag) {
            const items = this.bag[key];
            if (items) {
                for (const item of items) {
                    yield [key, item];
                }
            }
        }
    }

    *get(key: DocumentUri): IterableIterator<Diagnostic> {
        const items = this.bag[key];
        if (items) {
            yield* items;
        }
    }

    has(key: DocumentUri): boolean {
        return key in this.bag;
    }

    *keys(): IterableIterator<string> {
        for (const key in this.bag) {
            yield key;
        }
    }
}

export namespace DiagnosticBag {

    export function create(): DiagnosticBag {
        return new FullDiagnosticBag();
    }
}
