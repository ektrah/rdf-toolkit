import { DiagnosticBag } from "@rdf-toolkit/text";
import * as process from "node:process";
import { DiagnosticOptions } from "./options.js";

export function hasErrors(diagnostics: DiagnosticBag, options: DiagnosticOptions): boolean {
    return !!(options.warnAsError ? diagnostics.errors + diagnostics.warnings : diagnostics.errors);
}

export function printDiagnosticsAndExitOnError(diagnostics: DiagnosticBag, options: DiagnosticOptions): void {
    for (const [documentURI, diagnostic] of diagnostics) {
        console.dir({ documentURI, diagnostic }, { depth: undefined });
    }
    if (hasErrors(diagnostics, options)) {
        console.log(`${diagnostics.errors} error(s), ${diagnostics.warnings} warning(s)`);
        process.exit(1);
    }
}
