import { Graph } from "@rdf-toolkit/rdf/graphs";
import { IRI, IRIOrBlankNode, Term } from "@rdf-toolkit/rdf/terms";
import { Class, ClassProperty, Schema } from "./main.js";

export enum ResultSeverity {
    Error,
    Warning,
    Information,
    Hint,
}

export enum ResultType {
    PropertyDeprecated = 500,
    ClassDeprecated,
    ExtraProperty,
    NoValue,

    Cardinality = 600,
    MissingClass,
    NotSatisfied,
}

export type PropertyDeprecatedWarning = {
    readonly type: ResultType.PropertyDeprecated;
    readonly severity: ResultSeverity.Warning;
    readonly property: ClassProperty;
}

export type ClassDeprecatedWarning = {
    readonly type: ResultType.ClassDeprecated;
    readonly severity: ResultSeverity.Warning;
    readonly class: Class;
}

export type ExtraPropertyWarning = {
    readonly type: ResultType.ExtraProperty;
    readonly severity: ResultSeverity.Warning;
    readonly propertyID: IRI;
}

export type NoValueWarning = {
    readonly type: ResultType.NoValue;
    readonly severity: ResultSeverity.Warning;
    readonly property: ClassProperty;
    readonly subject: IRIOrBlankNode;
    readonly object: Term;
}

export type CardinalityError = {
    readonly type: ResultType.Cardinality;
    readonly severity: ResultSeverity.Error;
    readonly property: ClassProperty;
    readonly actualCount: bigint;
}

export type NotSatisfiedError = {
    readonly type: ResultType.NotSatisfied;
    readonly severity: ResultSeverity.Error;
    readonly property: ClassProperty;
    readonly subject: IRIOrBlankNode;
    readonly object: Term;
}

export type MissingClassError = {
    readonly type: ResultType.MissingClass;
    readonly severity: ResultSeverity.Error;
    readonly classID: IRIOrBlankNode;
}

export type ValidationResult =
    | PropertyDeprecatedWarning
    | ClassDeprecatedWarning
    | ExtraPropertyWarning
    | NoValueWarning
    | CardinalityError
    | NotSatisfiedError
    | MissingClassError;

export default function validate(subject: IRIOrBlankNode, graph: Graph, schema: Schema): ValidationResult[] {
    const results: ValidationResult[] = [];

    function matches(object: Term, value: Term) {
        return object.equals(value) || IRIOrBlankNode.is(value) && graph.isInstanceOf(object, value);
    }

    function validateAgainstProperty(subject: IRIOrBlankNode, property: ClassProperty): void {
        let actualCount = 0n;
        let warnDeprecated = true;

        for (const object of graph.objects(subject, property.id)) {

            if (property.deprecated && warnDeprecated) {
                results.push({ type: ResultType.PropertyDeprecated, severity: ResultSeverity.Warning, property });
                warnDeprecated = false;
            }

            if (!property.value.length) {
                results.push({ type: ResultType.NoValue, severity: ResultSeverity.Warning, property, subject, object });
            }
            else if (!property.value.some(v => matches(object, v))) {
                results.push({ type: ResultType.NotSatisfied, severity: ResultSeverity.Error, property, subject, object });
            }

            actualCount++;
        }

        if (actualCount < property.minCount || property.maxCount >= 0 && actualCount > property.maxCount) {
            results.push({ type: ResultType.Cardinality, severity: ResultSeverity.Error, property, actualCount });
        }
    }

    function validateAgainstClass(subject: IRIOrBlankNode, class_: Class): void {
        if (class_.deprecated) {
            results.push({ type: ResultType.ClassDeprecated, severity: ResultSeverity.Warning, class: class_ });
        }

        for (const property of class_.properties) {
            validateAgainstProperty(subject, property);
        }
    }

    function validate(subject: IRIOrBlankNode): void {
        const extraProperties: Set<IRI> = graph.triples(subject).map(t => t.predicate).toSet();

        for (const classID of graph.getTypes(subject).ofType(IRI.is)) {
            const class_ = schema.classes.get(classID);
            if (!class_) {
                results.push({ type: ResultType.MissingClass, severity: ResultSeverity.Error, classID });
            }
            else {
                validateAgainstClass(subject, class_);

                for (const property of class_.properties) {
                    extraProperties.delete(property.id);
                }
            }
        }

        for (const propertyID of extraProperties) {
            results.push({ type: ResultType.ExtraProperty, severity: ResultSeverity.Warning, propertyID });
        }
    }

    validate(subject);
    return results;
}
