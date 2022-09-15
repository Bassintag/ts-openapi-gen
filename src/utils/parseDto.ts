import { OpenAPIV3_1 } from "openapi-types";
import { DtoDefinition } from "../domain/DtoDefinition.js";
import { distinct } from "./distinct.js";
import { parseProperties } from "./parseProperties.js";
import { parseType } from "./parseType.js";
import { resolveRef } from "./resolveRef.js";

export const parseDto = (
  doc: OpenAPIV3_1.Document,
  name: string,
  schema: OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.SchemaObject
): DtoDefinition => {
  if ("$ref" in schema) {
    return parseDto(doc, name, resolveRef(doc, schema.$ref));
  }

  if (schema.type == null || schema.type === "object") {
    const [properties, imports] = parseProperties(doc, schema);

    return {
      name,
      isObject: true,
      type: "object",
      imports: distinct(imports).sort(),
      properties,
    };
  } else if (schema.type === "array") {
    let type = "unknown";
    let isArrayOfObjects = false;
    let imports: string[] = [];
    if (schema.items != null) {
      const [itemsType, itemsImports] = parseType(schema.items);
      type = itemsType;
      imports = itemsImports;
      isArrayOfObjects = true;
    }

    return {
      name,
      isArray: true,
      isArrayOfObjects,
      type,
      imports: distinct(imports).sort(),
      properties: [],
    };
  } else {
    return {
      name,
      type: schema.type as string,
      imports: [],
      properties: [],
    };
  }
};
