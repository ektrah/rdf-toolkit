import { SyntaxTree } from "./main.js";
import { AnonSyntax, ASyntax, BaseDirectiveSyntax, BlankNodeLabelSyntax, BlankNodePredicateObjectListSyntax, BlankNodePropertyListSyntax, BlankNodeSyntax, BooleanLiteralSyntax, CollectionSyntax, DatatypeAnnotationSyntax, DecimalLiteralSyntax, DirectiveSyntax, DocumentSyntax, DoubleLiteralSyntax, IntegerLiteralSyntax, IRIReferenceSyntax, IRISyntax, LanguageTagSyntax, LiteralSyntax, ObjectListSyntax, ObjectListTailSyntax, ObjectSyntax, PredicateObjectListSyntax, PredicateObjectListTailSyntax, PredicateSyntax, PrefixDirectiveSyntax, PrefixedNameSyntax, RDFLiteralSyntax, SparqlBaseDirectiveSyntax, SparqlPrefixDirectiveSyntax, StatementSyntax, SubjectPredicateObjectListSyntax, SubjectSyntax, SyntaxKind, SyntaxToken, SyntaxTrivia, TriplesSyntax, VerbObjectListSyntax } from "./syntax.js";

export class SyntaxVisitor {

    constructor(private readonly descentIntoTrivia = false) {
    }

    visit(syntaxTree: SyntaxTree): void {
        this.visitDocument(syntaxTree.root);
    }

    visitDocument(node: DocumentSyntax): void {
        node.statements.forEach(statement => this.visitStatement(statement));
        this.visitToken(node.endOfFile);
    }

    visitStatement(node: StatementSyntax): void {
        switch (node.kind) {
            case SyntaxKind.PrefixDirective:
            case SyntaxKind.BaseDirective:
            case SyntaxKind.SparqlBaseDirective:
            case SyntaxKind.SparqlPrefixDirective:
                this.visitDirective(node);
                break;
            case SyntaxKind.SubjectPredicateObjectList:
            case SyntaxKind.BlankNodePredicateObjectList:
                this.visitTriples(node);
                break;
        }
    }

    visitDirective(node: DirectiveSyntax): void {
        switch (node.kind) {
            case SyntaxKind.PrefixDirective:
                this.visitPrefixDirective(node);
                break;
            case SyntaxKind.BaseDirective:
                this.visitBaseDirective(node);
                break;
            case SyntaxKind.SparqlBaseDirective:
                this.visitSparqlBaseDirective(node);
                break;
            case SyntaxKind.SparqlPrefixDirective:
                this.visitSparqlPrefixDirective(node);
                break;
        }
    }

    visitPrefixDirective(node: PrefixDirectiveSyntax): void {
        this.visitToken(node.keyword);
        this.visitToken(node.prefixLabel);
        this.visitToken(node.iriReference);
        this.visitToken(node.dotToken);
    }

    visitBaseDirective(node: BaseDirectiveSyntax): void {
        this.visitToken(node.keyword);
        this.visitToken(node.iriReference);
        this.visitToken(node.dotToken);
    }

    visitSparqlBaseDirective(node: SparqlBaseDirectiveSyntax): void {
        this.visitToken(node.keyword);
        this.visitToken(node.iriReference);
    }

    visitSparqlPrefixDirective(node: SparqlPrefixDirectiveSyntax): void {
        this.visitToken(node.keyword);
        this.visitToken(node.prefixLabel);
        this.visitToken(node.iriReference);
    }

    visitTriples(node: TriplesSyntax): void {
        switch (node.kind) {
            case SyntaxKind.SubjectPredicateObjectList:
                this.visitSubjectPredicateObjectList(node);
                break;
            case SyntaxKind.BlankNodePredicateObjectList:
                this.visitBlankNodePredicateObjectList(node);
                break;
        }
    }

    visitSubjectPredicateObjectList(node: SubjectPredicateObjectListSyntax): void {
        this.visitSubject(node.subject);
        this.visitPredicateObjectList(node.predicateObjectList);
        this.visitToken(node.dotToken);
    }

    visitBlankNodePredicateObjectList(node: BlankNodePredicateObjectListSyntax): void {
        this.visitBlankNodePropertyList(node.blankNode);
        if (node.predicateObjectList) {
            this.visitPredicateObjectList(node.predicateObjectList);
        }
        this.visitToken(node.dotToken);
    }

    visitPredicateObjectList(node: PredicateObjectListSyntax): void {
        this.visitVerbObjectList(node.verbObjectList);
        if (node.tail) {
            this.visitPredicateObjectListTail(node.tail);
        }
    }

    visitPredicateObjectListTail(node: PredicateObjectListTailSyntax): void {
        this.visitToken(node.semicolonToken);
        if (node.verbObjectList) {
            this.visitVerbObjectList(node.verbObjectList);
        }
        if (node.tail) {
            this.visitPredicateObjectListTail(node.tail);
        }
    }

    visitVerbObjectList(node: VerbObjectListSyntax): void {
        this.visitPredicate(node.verb);
        this.visitObjectList(node.objectList);
    }

    visitObjectList(node: ObjectListSyntax): void {
        this.visitObject(node.object);
        if (node.tail) {
            this.visitObjectListTail(node.tail);
        }
    }

    visitObjectListTail(node: ObjectListTailSyntax): void {
        this.visitToken(node.commaToken);
        this.visitObject(node.object);
        if (node.tail) {
            this.visitObjectListTail(node.tail);
        }
    }

    visitSubject(node: SubjectSyntax): void {
        switch (node.kind) {
            case SyntaxKind.Collection:
                this.visitCollection(node);
                break;
            case SyntaxKind.IRIReference:
            case SyntaxKind.PrefixedName:
                this.visitIRI(node);
                break;
            case SyntaxKind.BlankNodeLabel:
            case SyntaxKind.Anon:
                this.visitBlankNode(node);
                break;
        }
    }

    visitPredicate(node: PredicateSyntax): void {
        switch (node.kind) {
            case SyntaxKind.A:
                this.visitA(node);
                break;
            case SyntaxKind.IRIReference:
            case SyntaxKind.PrefixedName:
                this.visitIRI(node);
                break;
        }
    }

    visitObject(node: ObjectSyntax): void {
        switch (node.kind) {
            case SyntaxKind.BlankNodePropertyList:
                this.visitBlankNodePropertyList(node);
                break;
            case SyntaxKind.Collection:
                this.visitCollection(node);
                break;
            case SyntaxKind.IntegerLiteral:
            case SyntaxKind.DecimalLiteral:
            case SyntaxKind.DoubleLiteral:
            case SyntaxKind.RDFLiteral:
            case SyntaxKind.BooleanLiteral:
                this.visitLiteral(node);
                break;
            case SyntaxKind.IRIReference:
            case SyntaxKind.PrefixedName:
                this.visitIRI(node);
                break;
            case SyntaxKind.BlankNodeLabel:
            case SyntaxKind.Anon:
                this.visitBlankNode(node);
                break;
        }
    }

    visitLiteral(node: LiteralSyntax): void {
        switch (node.kind) {
            case SyntaxKind.IntegerLiteral:
                this.visitIntegerLiteral(node);
                break;
            case SyntaxKind.DecimalLiteral:
                this.visitDecimalLiteral(node);
                break;
            case SyntaxKind.DoubleLiteral:
                this.visitDoubleLiteral(node);
                break;
            case SyntaxKind.RDFLiteral:
                this.visitRDFLiteral(node);
                break;
            case SyntaxKind.BooleanLiteral:
                this.visitBooleanLiteral(node);
                break;
        }
    }

    visitA(node: ASyntax): void {
        this.visitToken(node.keyword);
    }

    visitBlankNodePropertyList(node: BlankNodePropertyListSyntax): void {
        this.visitToken(node.openBracketToken);
        this.visitPredicateObjectList(node.predicateObjectList);
        this.visitToken(node.closeBracketToken);
    }

    visitCollection(node: CollectionSyntax): void {
        this.visitToken(node.openParenToken);
        node.objects.forEach(object => this.visitObject(object));
        this.visitToken(node.closeParenToken);
    }

    visitIntegerLiteral(node: IntegerLiteralSyntax): void {
        this.visitToken(node.token);
    }

    visitDecimalLiteral(node: DecimalLiteralSyntax): void {
        this.visitToken(node.token);
    }

    visitDoubleLiteral(node: DoubleLiteralSyntax): void {
        this.visitToken(node.token);
    }

    visitRDFLiteral(node: RDFLiteralSyntax): void {
        this.visitToken(node.token);
        if (node.suffix) {
            this.visitRDFLiteralSuffix(node.suffix);
        }
    }

    visitRDFLiteralSuffix(node: LanguageTagSyntax | DatatypeAnnotationSyntax): void {
        switch (node.kind) {
            case SyntaxKind.LanguageTag:
                this.visitLanguageTag(node);
                break;
            case SyntaxKind.DatatypeAnnotation:
                this.visitDatatypeAnnotation(node);
                break;
        }
    }

    visitLanguageTag(node: LanguageTagSyntax): void {
        this.visitToken(node.token);
    }

    visitDatatypeAnnotation(node: DatatypeAnnotationSyntax): void {
        this.visitToken(node.caretCaretToken);
        this.visitIRI(node.iri);
    }

    visitBooleanLiteral(node: BooleanLiteralSyntax): void {
        this.visitToken(node.token);
    }

    visitIRI(node: IRISyntax): void {
        switch (node.kind) {
            case SyntaxKind.IRIReference:
                this.visitIRIReference(node);
                break;
            case SyntaxKind.PrefixedName:
                this.visitPrefixedName(node);
                break;
        }
    }

    visitIRIReference(node: IRIReferenceSyntax): void {
        this.visitToken(node.token);
    }

    visitPrefixedName(node: PrefixedNameSyntax): void {
        this.visitToken(node.token);
    }

    visitBlankNode(node: BlankNodeSyntax): void {
        switch (node.kind) {
            case SyntaxKind.BlankNodeLabel:
                this.visitBlankNodeLabel(node);
                break;
            case SyntaxKind.Anon:
                this.visitAnon(node);
                break;
        }
    }

    visitBlankNodeLabel(node: BlankNodeLabelSyntax): void {
        this.visitToken(node.token);
    }

    visitAnon(node: AnonSyntax): void {
        this.visitToken(node.openBracketToken);
        this.visitToken(node.closeBracketToken);
    }

    visitToken(token: SyntaxToken): void {
        if (this.descentIntoTrivia) {
            token.leadingTrivia.forEach(trivia => this.visitTrivia(trivia));
            token.trailingTrivia.forEach(trivia => this.visitTrivia(trivia));
        }
    }

    visitTrivia(trivia: SyntaxTrivia): void {
    }
}

export class SyntaxRewriter {

    constructor(private readonly descentIntoTrivia = false) {
    }

    rewrite(syntaxTree: SyntaxTree): SyntaxTree {
        return SyntaxTree.create(syntaxTree.document.uri, syntaxTree.document.languageId, syntaxTree.document.version + 1, this.rewriteDocument(syntaxTree.root));
    }

    rewriteDocument(node: DocumentSyntax): DocumentSyntax {
        return {
            kind: SyntaxKind.Document,
            statements: node.statements.map(statement => this.rewriteStatement(statement)),
            endOfFile: this.rewriteToken(node.endOfFile),
        };
    }

    rewriteStatement(node: StatementSyntax): StatementSyntax {
        switch (node.kind) {
            case SyntaxKind.PrefixDirective:
            case SyntaxKind.BaseDirective:
            case SyntaxKind.SparqlBaseDirective:
            case SyntaxKind.SparqlPrefixDirective:
                return this.rewriteDirective(node);
            case SyntaxKind.SubjectPredicateObjectList:
            case SyntaxKind.BlankNodePredicateObjectList:
                return this.rewriteTriples(node);
        }
    }

    rewriteDirective(node: DirectiveSyntax): DirectiveSyntax {
        switch (node.kind) {
            case SyntaxKind.PrefixDirective:
                return this.rewritePrefixDirective(node);
            case SyntaxKind.BaseDirective:
                return this.rewriteBaseDirective(node);
            case SyntaxKind.SparqlBaseDirective:
                return this.rewriteSparqlBaseDirective(node);
            case SyntaxKind.SparqlPrefixDirective:
                return this.rewriteSparqlPrefixDirective(node);
        }
    }

    rewritePrefixDirective(node: PrefixDirectiveSyntax): PrefixDirectiveSyntax {
        return {
            kind: SyntaxKind.PrefixDirective,
            keyword: this.rewriteToken(node.keyword),
            prefixLabel: this.rewriteToken(node.prefixLabel),
            iriReference: this.rewriteToken(node.iriReference),
            dotToken: this.rewriteToken(node.dotToken),
        };
    }

    rewriteBaseDirective(node: BaseDirectiveSyntax): BaseDirectiveSyntax {
        return {
            kind: SyntaxKind.BaseDirective,
            keyword: this.rewriteToken(node.keyword),
            iriReference: this.rewriteToken(node.iriReference),
            dotToken: this.rewriteToken(node.dotToken),
        };
    }

    rewriteSparqlBaseDirective(node: SparqlBaseDirectiveSyntax): SparqlBaseDirectiveSyntax {
        return {
            kind: SyntaxKind.SparqlBaseDirective,
            keyword: this.rewriteToken(node.keyword),
            iriReference: this.rewriteToken(node.iriReference),
        };
    }

    rewriteSparqlPrefixDirective(node: SparqlPrefixDirectiveSyntax): SparqlPrefixDirectiveSyntax {
        return {
            kind: SyntaxKind.SparqlPrefixDirective,
            keyword: this.rewriteToken(node.keyword),
            prefixLabel: this.rewriteToken(node.prefixLabel),
            iriReference: this.rewriteToken(node.iriReference),
        };
    }

    rewriteTriples(node: TriplesSyntax): TriplesSyntax {
        switch (node.kind) {
            case SyntaxKind.SubjectPredicateObjectList:
                return this.rewriteSubjectPredicateObjectList(node);
            case SyntaxKind.BlankNodePredicateObjectList:
                return this.rewriteBlankNodePredicateObjectList(node);
        }
    }

    rewriteSubjectPredicateObjectList(node: SubjectPredicateObjectListSyntax): SubjectPredicateObjectListSyntax {
        return {
            kind: SyntaxKind.SubjectPredicateObjectList,
            subject: this.rewriteSubject(node.subject),
            predicateObjectList: this.rewritePredicateObjectList(node.predicateObjectList),
            dotToken: this.rewriteToken(node.dotToken),
        };
    }

    rewriteBlankNodePredicateObjectList(node: BlankNodePredicateObjectListSyntax): BlankNodePredicateObjectListSyntax {
        return {
            kind: SyntaxKind.BlankNodePredicateObjectList,
            blankNode: this.rewriteBlankNodePropertyList(node.blankNode),
            predicateObjectList: node.predicateObjectList ? this.rewritePredicateObjectList(node.predicateObjectList) : undefined,
            dotToken: this.rewriteToken(node.dotToken),
        };
    }

    rewritePredicateObjectList(node: PredicateObjectListSyntax): PredicateObjectListSyntax {
        return {
            kind: SyntaxKind.PredicateObjectList,
            verbObjectList: this.rewriteVerbObjectList(node.verbObjectList),
            tail: node.tail ? this.rewritePredicateObjectListTail(node.tail) : undefined,
        };
    }

    rewritePredicateObjectListTail(node: PredicateObjectListTailSyntax): PredicateObjectListTailSyntax | undefined {
        return {
            kind: SyntaxKind.PredicateObjectListTail,
            semicolonToken: this.rewriteToken(node.semicolonToken),
            verbObjectList: node.verbObjectList ? this.rewriteVerbObjectList(node.verbObjectList) : undefined,
            tail: node.tail ? this.rewritePredicateObjectListTail(node.tail) : undefined,
        };
    }

    rewriteVerbObjectList(node: VerbObjectListSyntax): VerbObjectListSyntax {
        return {
            kind: SyntaxKind.VerbObjectList,
            verb: this.rewritePredicate(node.verb),
            objectList: this.rewriteObjectList(node.objectList),
        };
    }

    rewriteObjectList(node: ObjectListSyntax): ObjectListSyntax {
        return {
            kind: SyntaxKind.ObjectList,
            object: this.rewriteObject(node.object),
            tail: node.tail ? this.rewriteObjectListTail(node.tail) : undefined,
        };
    }

    rewriteObjectListTail(node: ObjectListTailSyntax): ObjectListTailSyntax | undefined {
        return {
            kind: SyntaxKind.ObjectListTail,
            commaToken: this.rewriteToken(node.commaToken),
            object: this.rewriteObject(node.object),
            tail: node.tail ? this.rewriteObjectListTail(node.tail) : undefined,
        };
    }

    rewriteSubject(node: SubjectSyntax): SubjectSyntax {
        switch (node.kind) {
            case SyntaxKind.Collection:
                return this.rewriteCollection(node);
            case SyntaxKind.IRIReference:
            case SyntaxKind.PrefixedName:
                return this.rewriteIRI(node);
            case SyntaxKind.BlankNodeLabel:
            case SyntaxKind.Anon:
                return this.rewriteBlankNode(node);
        }
    }

    rewritePredicate(node: PredicateSyntax): PredicateSyntax {
        switch (node.kind) {
            case SyntaxKind.A:
                return this.rewriteA(node);
            case SyntaxKind.IRIReference:
            case SyntaxKind.PrefixedName:
                return this.rewriteIRI(node);
        }
    }

    rewriteObject(node: ObjectSyntax): ObjectSyntax {
        switch (node.kind) {
            case SyntaxKind.BlankNodePropertyList:
                return this.rewriteBlankNodePropertyList(node);
            case SyntaxKind.Collection:
                return this.rewriteCollection(node);
            case SyntaxKind.IntegerLiteral:
            case SyntaxKind.DecimalLiteral:
            case SyntaxKind.DoubleLiteral:
            case SyntaxKind.RDFLiteral:
            case SyntaxKind.BooleanLiteral:
                return this.rewriteLiteral(node);
            case SyntaxKind.IRIReference:
            case SyntaxKind.PrefixedName:
                return this.rewriteIRI(node);
            case SyntaxKind.BlankNodeLabel:
            case SyntaxKind.Anon:
                return this.rewriteBlankNode(node);
        }
    }

    rewriteLiteral(node: LiteralSyntax): LiteralSyntax {
        switch (node.kind) {
            case SyntaxKind.IntegerLiteral:
                return this.rewriteIntegerLiteral(node);
            case SyntaxKind.DecimalLiteral:
                return this.rewriteDecimalLiteral(node);
            case SyntaxKind.DoubleLiteral:
                return this.rewriteDoubleLiteral(node);
            case SyntaxKind.RDFLiteral:
                return this.rewriteRDFLiteral(node);
            case SyntaxKind.BooleanLiteral:
                return this.rewriteBooleanLiteral(node);
        }
    }

    rewriteA(node: ASyntax): ASyntax {
        return {
            kind: SyntaxKind.A,
            keyword: this.rewriteToken(node.keyword),
        };
    }

    rewriteBlankNodePropertyList(node: BlankNodePropertyListSyntax): BlankNodePropertyListSyntax {
        return {
            kind: SyntaxKind.BlankNodePropertyList,
            openBracketToken: this.rewriteToken(node.openBracketToken),
            predicateObjectList: this.rewritePredicateObjectList(node.predicateObjectList),
            closeBracketToken: this.rewriteToken(node.closeBracketToken),
        };
    }

    rewriteCollection(node: CollectionSyntax): CollectionSyntax {
        return {
            kind: SyntaxKind.Collection,
            openParenToken: this.rewriteToken(node.openParenToken),
            objects: node.objects.map(object => this.rewriteObject(object)),
            closeParenToken: this.rewriteToken(node.closeParenToken),
        };
    }

    rewriteIntegerLiteral(node: IntegerLiteralSyntax): IntegerLiteralSyntax {
        return {
            kind: SyntaxKind.IntegerLiteral,
            token: this.rewriteToken(node.token),
        };
    }

    rewriteDecimalLiteral(node: DecimalLiteralSyntax): DecimalLiteralSyntax {
        return {
            kind: SyntaxKind.DecimalLiteral,
            token: this.rewriteToken(node.token),
        };
    }

    rewriteDoubleLiteral(node: DoubleLiteralSyntax): DoubleLiteralSyntax {
        return {
            kind: SyntaxKind.DoubleLiteral,
            token: this.rewriteToken(node.token),
        };
    }

    rewriteRDFLiteral(node: RDFLiteralSyntax): RDFLiteralSyntax {
        return {
            kind: SyntaxKind.RDFLiteral,
            token: this.rewriteToken(node.token),
            suffix: node.suffix ? this.rewriteRDFLiteralSuffix(node.suffix) : undefined,
        };
    }

    rewriteRDFLiteralSuffix(node: LanguageTagSyntax | DatatypeAnnotationSyntax): LanguageTagSyntax | DatatypeAnnotationSyntax | undefined {
        switch (node.kind) {
            case SyntaxKind.LanguageTag:
                return this.rewriteLanguageTag(node);
            case SyntaxKind.DatatypeAnnotation:
                return this.rewriteDatatypeAnnotation(node);
        }
    }

    rewriteLanguageTag(node: LanguageTagSyntax): LanguageTagSyntax {
        return {
            kind: SyntaxKind.LanguageTag,
            token: this.rewriteToken(node.token),
        };
    }

    rewriteDatatypeAnnotation(node: DatatypeAnnotationSyntax): DatatypeAnnotationSyntax {
        return {
            kind: SyntaxKind.DatatypeAnnotation,
            caretCaretToken: this.rewriteToken(node.caretCaretToken),
            iri: this.rewriteIRI(node.iri),
        };
    }

    rewriteBooleanLiteral(node: BooleanLiteralSyntax): BooleanLiteralSyntax {
        return {
            kind: SyntaxKind.BooleanLiteral,
            token: this.rewriteToken(node.token),
        };
    }

    rewriteIRI(node: IRISyntax): IRISyntax {
        switch (node.kind) {
            case SyntaxKind.IRIReference:
                return this.rewriteIRIReference(node);
            case SyntaxKind.PrefixedName:
                return this.rewritePrefixedName(node);
        }
    }

    rewriteIRIReference(node: IRIReferenceSyntax): IRIReferenceSyntax {
        return {
            kind: SyntaxKind.IRIReference,
            token: this.rewriteToken(node.token),
        };
    }

    rewritePrefixedName(node: PrefixedNameSyntax): PrefixedNameSyntax {
        return {
            kind: SyntaxKind.PrefixedName,
            token: this.rewriteToken(node.token),
        };
    }

    rewriteBlankNode(node: BlankNodeSyntax): BlankNodeSyntax {
        switch (node.kind) {
            case SyntaxKind.BlankNodeLabel:
                return this.rewriteBlankNodeLabel(node);
            case SyntaxKind.Anon:
                return this.rewriteAnon(node);
        }
    }

    rewriteBlankNodeLabel(node: BlankNodeLabelSyntax): BlankNodeLabelSyntax {
        return {
            kind: SyntaxKind.BlankNodeLabel,
            token: this.rewriteToken(node.token),
        };
    }

    rewriteAnon(node: AnonSyntax): AnonSyntax {
        return {
            kind: SyntaxKind.Anon,
            openBracketToken: this.rewriteToken(node.openBracketToken),
            closeBracketToken: this.rewriteToken(node.closeBracketToken),
        };
    }

    rewriteToken<T extends SyntaxToken>(token: T): T {
        if (this.descentIntoTrivia) {
            return SyntaxToken.create(token.kind, token.value, token.text, token.leadingTrivia.map(trivia => this.rewriteTrivia(trivia)), token.trailingTrivia.map(trivia => this.rewriteTrivia(trivia))) as T;
        }
        else {
            return token;
        }
    }

    rewriteTrivia(trivia: SyntaxTrivia): SyntaxTrivia {
        return trivia;
    }
}
