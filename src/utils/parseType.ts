import { OpenAPIV3_1 } from "openapi-types";

export const parseType = (
  schemaOrRef: OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.SchemaObject
): [string, string[]] => {
  if ("$ref" in schemaOrRef) {
    const refParts = schemaOrRef.$ref.split("/");
    const ref = refParts[refParts.length - 1];
    return [ref, [ref]];
  }

  switch (schemaOrRef.type) {
    case undefined:
      return ["unknown", []];
    case "array":
      if (schemaOrRef.items != null) {
        const [type, imports] = parseType(schemaOrRef.items);
        return [`${type}[]`, imports];
      } else {
        return ["unknown[]", []];
      }
    case "integer":
      return ["number", []];
    default:
      return [schemaOrRef.type as string, []];
  }
};
