export class PrefixTable {
    private readonly table: readonly [string, string][];

    constructor(input: Iterable<Record<string, string>>) {
        const namespacesToPrefixLabels: Map<string, string> = new Map();
        const prefixLabelsToOrdinal: Map<string, number> = new Map();
        for (const namespaces of input) {
            for (let prefixLabel in namespaces) {
                const namespace = namespaces[prefixLabel];
                if (!namespacesToPrefixLabels.has(namespace)) {
                    if (/^$|^ns[0-9]+$/u.test(prefixLabel)) {
                        const m = /[/]([A-Za-z][-0-9_A-Za-z]*)[/#]$/u.exec(namespace);
                        prefixLabel = m ? m[1] : "ns";
                    }
                    let ordinal = prefixLabelsToOrdinal.get(prefixLabel);
                    if (ordinal) {
                        let newPrefixLabel;
                        do { newPrefixLabel = prefixLabel + "_" + (++ordinal); } while (prefixLabelsToOrdinal.has(newPrefixLabel));
                        prefixLabelsToOrdinal.set(prefixLabel, ordinal);
                        prefixLabel = newPrefixLabel;
                    }
                    prefixLabelsToOrdinal.set(prefixLabel, 1);
                    namespacesToPrefixLabels.set(namespace, prefixLabel);
                }
            }
        }
        this.table = Array.from(namespacesToPrefixLabels).sort((a, b) => b[0].length - a[0].length);
    }

    all(): readonly [string, string][] {
        return this.table;
    }

    lookup(iri: string): { readonly localName: string; readonly prefixLabel: string; } | null {
        for (const [namespace, prefixLabel] of this.table) {
            if (iri.startsWith(namespace)) {
                return { prefixLabel, localName: iri.slice(namespace.length) };
            }
        }
        return null;
    }
}
