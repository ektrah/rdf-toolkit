import { BlankNode, IRI, IRIOrBlankNode, Literal, Term } from "@rdf-toolkit/rdf/terms";
import { ParsedTriple, Triple, TripleLocation } from "@rdf-toolkit/rdf/triples";
import { Rdf } from "@rdf-toolkit/rdf/vocab";
import { Diagnostic, DiagnosticBag, DiagnosticSeverity, IRIReference, Range } from "@rdf-toolkit/text";
import { ParserState, SyntaxTree } from "./syntax-tree.js";
import { BlankNodeLabelSyntax, BlankNodePredicateObjectListSyntax, BooleanLiteralSyntax, CollectionSyntax, DocumentSyntax, IRISyntax, ObjectListSyntax, ObjectListTailSyntax, ObjectSyntax, PredicateObjectListSyntax, PredicateObjectListTailSyntax, PredicateSyntax, PrefixedNameSyntax, RDFLiteralSyntax, SubjectPredicateObjectListSyntax, SubjectSyntax, SyntaxKind, SyntaxNode, SyntaxToken, SyntaxTokenValue, TokenKind, VerbObjectListSyntax } from "./syntax.js";

export class TurtleCompiler {

    private readonly bnodeLabels: Record<string, BlankNode>;
    private readonly namespaces: Record<string, string>;
    private readonly triples: Array<ParsedTriple>;

    private baseIRI: IRIReference;
    private bnodeCounter: number;

    constructor(private readonly syntaxTree: SyntaxTree, private readonly diagnostics: DiagnosticBag) {
        const baseIRI = IRIReference.parse(syntaxTree.document.uri);
        if (!baseIRI || !baseIRI.scheme) {
            throw new Error();
        }

        this.bnodeLabels = {};
        this.namespaces = {};
        this.triples = [];
        this.baseIRI = baseIRI;

        const string = syntaxTree.document.uri;
        let hash = 0;
        for (let i = 0; i < string.length; i++) {
            const char = string.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        this.bnodeCounter = hash & ((1 << 31) - 1);
    }

    private reportError(node: SyntaxToken | SyntaxNode, message: string): void {
        this.diagnostics.add(this.syntaxTree.document.uri, Diagnostic.create(this.syntaxTree.getRange(node), message, DiagnosticSeverity.Error));
    }

    private emitTriple(subject: IRIOrBlankNode, subjectRange: Range, predicate: IRI, predicateRange: Range, object: Term, objectRange: Range): void {
        const location: TripleLocation = { uri: this.syntaxTree.document.uri, subjectRange, predicateRange, objectRange };
        this.triples.push(Triple.createParsed(subject, predicate, object, location));
    }

    private createBlankNode(): BlankNode {
        return BlankNode.create("b" + (this.bnodeCounter++).toString().padStart(10, "0"));
    }

    compile(): ParserState {
        this.compileDocument(this.syntaxTree.root);
        return {
            baseIRI: IRIReference.recompose(this.baseIRI),
            bnodeLabels: this.bnodeLabels,
            namespaces: this.namespaces,
            triples: this.triples
        };
    }

    private compileDocument(document: DocumentSyntax): void {
        for (const statement of document.statements) {
            switch (statement.kind) {
                case SyntaxKind.PrefixDirective:
                case SyntaxKind.SparqlPrefixDirective:
                    this.namespaces[statement.prefixLabel.value.prefixLabel] = IRIReference.recompose(IRIReference.resolve(statement.iriReference.value, this.baseIRI));
                    break;
                case SyntaxKind.BaseDirective:
                case SyntaxKind.SparqlBaseDirective:
                    this.baseIRI = IRIReference.resolve(statement.iriReference.value, this.baseIRI);
                    break;
                case SyntaxKind.SubjectPredicateObjectList:
                    this.compileSubjectPredicateObjectList(statement);
                    break;
                case SyntaxKind.BlankNodePredicateObjectList:
                    this.compileBlankNodePredicateObjectList(statement);
                    break;
            }
        }
    }

    private compileBlankNodePredicateObjectList(blankNodePredicateObjectList: BlankNodePredicateObjectListSyntax): void {
        const subject = this.createBlankNode();
        const subjectRange = this.syntaxTree.getRange(blankNodePredicateObjectList);
        this.compilePredicateObjectList(subject, subjectRange, blankNodePredicateObjectList.blankNode.predicateObjectList);
        if (blankNodePredicateObjectList.predicateObjectList) {
            this.compilePredicateObjectList(subject, subjectRange, blankNodePredicateObjectList.predicateObjectList);
        }
    }

    private compileSubjectPredicateObjectList(triples: SubjectPredicateObjectListSyntax): void {
        const subject = this.compileSubject(triples.subject);
        const subjectRange = this.syntaxTree.getRange(triples.subject);
        this.compilePredicateObjectList(subject, subjectRange, triples.predicateObjectList);
    }

    private compilePredicateObjectList(subject: IRIOrBlankNode, subjectRange: Range, predicateObjectList: PredicateObjectListSyntax): void {
        for (let node: PredicateObjectListSyntax | PredicateObjectListTailSyntax | undefined = predicateObjectList; node; node = node.tail) {
            if (node.verbObjectList) {
                this.compileVerbObjectList(subject, subjectRange, node.verbObjectList);
            }
        }
    }

    private compileVerbObjectList(subject: IRIOrBlankNode, subjectRange: Range, verbObjectList: VerbObjectListSyntax): void {
        const predicate = this.compilePredicate(verbObjectList.verb);
        const predicateRange = this.syntaxTree.getRange(verbObjectList.verb);
        this.compileObjectList(subject, subjectRange, predicate, predicateRange, verbObjectList.objectList);
    }

    private compileObjectList(subject: IRIOrBlankNode, subjectRange: Range, predicate: IRI, predicateRange: Range, objectList: ObjectListSyntax): void {
        for (let node: ObjectListSyntax | ObjectListTailSyntax | undefined = objectList; node; node = node.tail) {
            this.emitTriple(subject, subjectRange, predicate, predicateRange, this.compileObject(node.object), this.syntaxTree.getRange(node.object));
        }
    }

    private compileSubject(subject: SubjectSyntax): IRIOrBlankNode {
        switch (subject.kind) {
            case SyntaxKind.Collection:
                return this.compileCollection(subject);
            case SyntaxKind.IRIReference:
            case SyntaxKind.PrefixedName:
                return this.compileIRI(subject);
            case SyntaxKind.BlankNodeLabel:
                return this.compileBlankNodeLabel(subject);
            case SyntaxKind.Anon:
                return this.createBlankNode();
        }
    }

    private compilePredicate(predicate: PredicateSyntax): IRI {
        switch (predicate.kind) {
            case SyntaxKind.A:
                return Rdf.type;
            case SyntaxKind.IRIReference:
            case SyntaxKind.PrefixedName:
                return this.compileIRI(predicate);
        }
    }

    private compileObject(object: ObjectSyntax): Term {
        switch (object.kind) {
            case SyntaxKind.BlankNodePropertyList:
                const blankNode = this.createBlankNode();
                this.compilePredicateObjectList(blankNode, this.syntaxTree.getRange(object), object.predicateObjectList);
                return blankNode;
            case SyntaxKind.Collection:
                return this.compileCollection(object);
            case SyntaxKind.IntegerLiteral:
                return Literal.createInteger(object.token.value);
            case SyntaxKind.DecimalLiteral:
                return Literal.createDecimal(object.token.value);
            case SyntaxKind.DoubleLiteral:
                return Literal.createDouble(object.token.value);
            case SyntaxKind.RDFLiteral:
                return this.compileRDFLiteral(object);
            case SyntaxKind.BooleanLiteral:
                return this.compileBooleanLiteral(object);
            case SyntaxKind.IRIReference:
            case SyntaxKind.PrefixedName:
                return this.compileIRI(object);
            case SyntaxKind.BlankNodeLabel:
                return this.compileBlankNodeLabel(object);
            case SyntaxKind.Anon:
                return this.createBlankNode();
        }
    }

    private compileCollection(collection: CollectionSyntax): IRIOrBlankNode {
        let i = 0;
        const collectionRange = this.syntaxTree.getRange(collection);
        const head = i < collection.objects.length ? this.createBlankNode() : Rdf.nil;
        let current = head;
        while (current !== Rdf.nil) {
            const object = collection.objects[i++];
            const objectRange = this.syntaxTree.getRange(object);
            const first = this.compileObject(object);
            const rest = i < collection.objects.length ? this.createBlankNode() : Rdf.nil;
            this.emitTriple(current, collectionRange, Rdf.first, objectRange, first, objectRange);
            this.emitTriple(current, collectionRange, Rdf.rest, objectRange, rest, objectRange);
            current = rest;
        }
        return head;
    }

    private compileRDFLiteral(literal: RDFLiteralSyntax): Literal {
        const value = literal.token.value;
        if (!literal.suffix) {
            return Literal.createString(value);
        }
        switch (literal.suffix.kind) {
            case SyntaxKind.LanguageTag:
                return Literal.createLanguageTaggedString(value, literal.suffix.token.value);
            case SyntaxKind.DatatypeAnnotation:
                return Literal.create(value, this.compileIRI(literal.suffix.iri));
        }
    }

    private compileBooleanLiteral(literal: BooleanLiteralSyntax): Literal {
        switch (literal.token.kind) {
            case TokenKind.TrueKeyword:
                return Literal.createBoolean(true);
            case TokenKind.FalseKeyword:
                return Literal.createBoolean(false);
        }
    }

    private compileIRI(iri: IRISyntax): IRI {
        switch (iri.kind) {
            case SyntaxKind.IRIReference:
                return IRI.create(IRIReference.resolve(iri.token.value, this.baseIRI));
            case SyntaxKind.PrefixedName:
                return this.compilePrefixedName(iri);
        }
    }

    private compilePrefixedName(prefixedName: PrefixedNameSyntax): IRI {
        const { prefixLabel, localName } = prefixedName.token.value;
        let namespace: string | undefined = this.namespaces[prefixLabel];
        if (!namespace) {
            this.reportError(prefixedName, `undefined prefix '${prefixLabel}:'`);
            namespace = "http://example.com/.well-known/genid/";
        }
        let iriref = IRIReference.parse(namespace + (localName || ""));
        if (!iriref || !iriref.scheme) {
            this.reportError(prefixedName, `invalid IRI <${namespace + (localName || "")}>`);
            iriref = SyntaxTokenValue.getErrorTokenValue(TokenKind.IRIREF);
        }
        return IRI.create(iriref);
    }

    private compileBlankNodeLabel(blankNodeLabel: BlankNodeLabelSyntax): BlankNode {
        const { localName } = blankNodeLabel.token.value;
        return this.bnodeLabels[localName] || (this.bnodeLabels[localName] = this.createBlankNode());
    }
}
