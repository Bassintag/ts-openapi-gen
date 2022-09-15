import {OpenAPIV3_1} from "openapi-types";
import {DtoDefinition} from "../domain/DtoDefinition.js";
import {parseDto} from "./parseDto.js";

export const parseResponse = (
  doc: OpenAPIV3_1.Document,
  name: string,
  schema: OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.ResponseObject
): DtoDefinition => {
  if ('$ref' in schema) {
    return parseDto(doc, name, schema);
  } else {
    const json = schema.content?.['application/json'];
    if (json?.schema) {
      return parseDto(doc, name, json.schema);
    }
    if (schema.content?.['application/octet-stream']) {
      return {
        name,
        type: 'ArrayBuffer',
        imports: [],
        properties: [],
      };
    }
    return {
      name,
      type: 'object',
      imports: [],
      properties: [],
    }
  }
}
