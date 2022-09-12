import {OpenAPIV3_1} from "openapi-types";
import {parseType} from "./parseType.js";
import {PropertyDefinition} from "../domain/PropertyDefinition.js";
import {resolveRef} from "./resolveRef.js";

export const parseProperties = (doc: OpenAPIV3_1.Document, schema: OpenAPIV3_1.SchemaObject): [PropertyDefinition[], string[]] => {
  const properties: PropertyDefinition[] = [];
  const imports: string[] = [];

  if (schema.allOf != null) {
    for (const member of schema.allOf) {
      let schema: OpenAPIV3_1.SchemaObject;
      if ('$ref' in member) {
        schema = resolveRef<OpenAPIV3_1.SchemaObject>(doc, member.$ref);
      } else {
        schema = member;
      }
      const [memberProperties, memberImports] = parseProperties(doc, schema);
      properties.push(...memberProperties);
      imports.push(...memberImports);
    }
  } else {
    for (const [name, prop] of Object.entries(schema.properties ?? {})) {
      const [type, propImports] = parseType(prop);
      properties.push(({
        name,
        type,
        isRequired: schema.required?.includes(name) ?? false,
        isArray: type.endsWith('[]'),
        serializer: propImports.length > 0 ? propImports[propImports.length - 1] : undefined
      }));
      imports.push(...propImports);
    }
  }

  return [properties, imports]
}
