import { IRI, Literal } from "@rdf-toolkit/rdf/terms";
import { Owl, Rdf, Xsd } from "@rdf-toolkit/rdf/vocab";
import { SubjectPredicateObjectListSyntax, SymbolTable, SyntaxKind, SyntaxNode, SyntaxTree } from "@rdf-toolkit/turtle";

export interface Ontology {
    readonly ontologyIRI: string;
    readonly versionIRI: string | undefined;
    readonly imports: ReadonlyArray<string>;
}

export namespace Ontology {

    export function from(syntaxTree: SyntaxTree, symbolTable: SymbolTable): Ontology | undefined {
        const statement = findOWLOntology(syntaxTree, symbolTable);
        if (!statement) {
            return;
        }

        const subject = symbolTable.get(statement.subject);
        if (!subject) {
            return;
        }

        const imports = new Set<string>();
        for (const verbObjectList of SyntaxNode.iteratePredicateObjectList(statement.predicateObjectList)) {
            if (symbolTable.get(verbObjectList.verb) === Owl.imports) {
                for (const node of SyntaxNode.iterateObjectList(verbObjectList.objectList)) {
                    const object = symbolTable.get(node);
                    if (object && (IRI.is(object) || (Literal.is(object) && (object.datatype === Xsd.string || object.datatype === Xsd.anyURI)))) {
                        imports.add(object.value);
                    }
                }
            }
        }

        return {
            ontologyIRI: subject.value,
            versionIRI: undefined, // TODO
            imports: Array.from(imports)
        };
    }
}

function findOWLOntology(syntaxTree: SyntaxTree, symbolTable: SymbolTable): SubjectPredicateObjectListSyntax | undefined {
    let ontology: SubjectPredicateObjectListSyntax | undefined;

    for (const statement of syntaxTree.root.statements) {
        if (statement.kind === SyntaxKind.SubjectPredicateObjectList) {
            for (const verbObjectList of SyntaxNode.iteratePredicateObjectList(statement.predicateObjectList)) {
                if (symbolTable.get(verbObjectList.verb) === Rdf.type) {
                    for (const node of SyntaxNode.iterateObjectList(verbObjectList.objectList)) {
                        if (symbolTable.get(node) === Owl.Ontology) {
                            if (ontology && ontology !== statement) {
                                // TODO: report error
                                return;
                            }
                            ontology = statement;
                        }
                    }
                }
            }
        }
    }

    if (!ontology) {
        // TODO: report error
        return;
    }

    return ontology;
}
