import {OpenAPIV3_1} from "openapi-types";
import {parseType} from "./parseType.js";
import {PropertyDefinition} from "../domain/PropertyDefinition.js";

export const parseProperties = (schema: OpenAPIV3_1.SchemaObject): [PropertyDefinition[], string[]] => {
  const properties: PropertyDefinition[] = [];
  const imports: string[] = [];

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

  return [properties, imports]
}
