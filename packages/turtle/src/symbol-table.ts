import { IRI, Literal } from "@rdf-toolkit/rdf/terms";
import { Rdf } from "@rdf-toolkit/rdf/vocab";
import { Diagnostic, DiagnosticBag, DiagnosticSeverity, IRIReference } from "@rdf-toolkit/text";
import { SyntaxTree } from "./syntax-tree.js";
import { SyntaxVisitor } from "./syntax-visitor.js";
import { ASyntax, BaseDirectiveSyntax, BooleanLiteralSyntax, DecimalLiteralSyntax, DirectiveSyntax, DoubleLiteralSyntax, IntegerLiteralSyntax, IRIReferenceSyntax, IRISyntax, ObjectSyntax, PredicateSyntax, PrefixDirectiveSyntax, PrefixedNameSyntax, RDFLiteralSyntax, SparqlBaseDirectiveSyntax, SparqlPrefixDirectiveSyntax, SubjectSyntax, SyntaxKind, SyntaxNode, TokenKind } from "./syntax.js";

export interface BaseDirective {
    readonly baseIRI: string;
}

export interface PrefixDirective {
    readonly prefixLabel: string;
    readonly namespaceIRI: string;
}

export interface SymbolTable {
    get(node: BaseDirectiveSyntax | SparqlBaseDirectiveSyntax): BaseDirective | undefined;
    get(node: PrefixDirectiveSyntax | SparqlPrefixDirectiveSyntax): PrefixDirective | undefined;
    get(node: SubjectSyntax): IRI | undefined;
    get(node: PredicateSyntax): IRI | undefined;
    get(node: ObjectSyntax): IRI | Literal | undefined;
}

export namespace SymbolTable {

    export function from(syntaxTree: SyntaxTree, diagnostics: DiagnosticBag): SymbolTable {
        return new FullSymbolTable(new SymbolsVisitor(syntaxTree, diagnostics).build());
    }
}

class FullSymbolTable {

    constructor(private readonly table: WeakMap<SyntaxNode, IRI | Literal | BaseDirective | PrefixDirective>) {
    }

    get(node: BaseDirectiveSyntax | SparqlBaseDirectiveSyntax): BaseDirective | undefined;
    get(node: PrefixDirectiveSyntax | SparqlPrefixDirectiveSyntax): PrefixDirective | undefined;
    get(node: SubjectSyntax): IRI | undefined;
    get(node: PredicateSyntax): IRI | undefined;
    get(node: ObjectSyntax): IRI | Literal | undefined;
    get(node: SyntaxNode): IRI | Literal | BaseDirective | PrefixDirective | undefined {
        return this.table.get(node);
    }
}

class SymbolsVisitor extends SyntaxVisitor {
    private readonly table: WeakMap<SyntaxNode, IRI | Literal | BaseDirective | PrefixDirective>;
    private readonly namespaces: Map<string, string>;

    private baseIRI: IRIReference;

    constructor(private readonly syntaxTree: SyntaxTree, private readonly diagnostics: DiagnosticBag) {
        super();

        const baseIRI = IRIReference.parse(syntaxTree.document.uri);
        if (!baseIRI || !baseIRI.scheme) {
            throw new Error();
        }

        this.table = new WeakMap();
        this.namespaces = new Map();
        this.baseIRI = baseIRI;
    }

    build(): WeakMap<SyntaxNode, IRI | Literal | BaseDirective | PrefixDirective> {
        this.visit(this.syntaxTree);
        return this.table;
    }

    override visitDirective(node: DirectiveSyntax): void {
        switch (node.kind) {
            case SyntaxKind.PrefixDirective:
            case SyntaxKind.SparqlPrefixDirective:
                const prefixLabel = node.prefixLabel.value.prefixLabel;
                const namespaceIRI = IRIReference.recompose(IRIReference.resolve(node.iriReference.value, this.baseIRI));
                this.namespaces.set(prefixLabel, namespaceIRI);
                this.table.set(node, { prefixLabel, namespaceIRI });
                break;

            case SyntaxKind.BaseDirective:
            case SyntaxKind.SparqlBaseDirective:
                this.baseIRI = IRIReference.resolve(node.iriReference.value, this.baseIRI);
                const baseIRI = IRIReference.recompose(this.baseIRI);
                this.table.set(node, { baseIRI });
                break;
        }
    }

    override visitA(node: ASyntax): void {
        this.table.set(node, Rdf.type);
    }

    override visitIntegerLiteral(node: IntegerLiteralSyntax): void {
        this.table.set(node, Literal.createInteger(node.token.value));
    }

    override visitDecimalLiteral(node: DecimalLiteralSyntax): void {
        this.table.set(node, Literal.createDecimal(node.token.value));
    }

    override visitDoubleLiteral(node: DoubleLiteralSyntax): void {
        this.table.set(node, Literal.createDouble(node.token.value));
    }

    override visitRDFLiteral(node: RDFLiteralSyntax): void {
        const value = node.token.value;
        if (!node.suffix) {
            this.table.set(node, Literal.createString(value));
        }
        else {
            switch (node.suffix.kind) {
                case SyntaxKind.LanguageTag:
                    this.table.set(node, Literal.createLanguageTaggedString(value, node.suffix.token.value));
                    break;
                case SyntaxKind.DatatypeAnnotation:
                    const datatype = this.visitIRI(node.suffix.iri);
                    if (datatype) {
                        this.table.set(node, Literal.create(value, datatype));
                    }
                    break;
            }
        }
    }

    override visitBooleanLiteral(node: BooleanLiteralSyntax): void {
        switch (node.token.kind) {
            case TokenKind.TrueKeyword:
                this.table.set(node, Literal.createBoolean(true));
                break;
            case TokenKind.FalseKeyword:
                this.table.set(node, Literal.createBoolean(false));
                break;
        }
    }

    override visitIRI(node: IRISyntax): IRI | undefined {
        switch (node.kind) {
            case SyntaxKind.IRIReference:
                return this.visitIRIReference(node);
            case SyntaxKind.PrefixedName:
                return this.visitPrefixedName(node);
        }
    }

    override visitIRIReference(node: IRIReferenceSyntax): IRI {
        const iri = IRI.create(IRIReference.resolve(node.token.value, this.baseIRI));
        this.table.set(node, iri);
        return iri;
    }

    override visitPrefixedName(node: PrefixedNameSyntax): IRI | undefined {
        const { prefixLabel, localName } = node.token.value;

        const namespaceIRI = this.namespaces.get(prefixLabel);
        if (!namespaceIRI) {
            this.diagnostics.add(this.syntaxTree.document.uri, Diagnostic.create(this.syntaxTree.getRange(node), `undefined prefix '${prefixLabel}:'`, DiagnosticSeverity.Error));
            return;
        }

        const s = namespaceIRI + (localName || "");
        const r = IRIReference.parse(s);
        if (!r || !r.scheme) {
            this.diagnostics.add(this.syntaxTree.document.uri, Diagnostic.create(this.syntaxTree.getRange(node), `invalid IRI <${s}>`, DiagnosticSeverity.Error));
            return;
        }

        const iri = IRI.create(r);
        this.table.set(node, iri);
        return iri;
    }
}
