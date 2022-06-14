import {OpenAPIV3_1} from "openapi-types";
import {DtoDefinition} from "../domain/DtoDefinition";
import {distinct} from "./distinct.js";
import {parseProperties} from "./parseProperties.js";

export const parseDto = (name: string, schema: OpenAPIV3_1.SchemaObject): DtoDefinition => {
  const [properties, imports] = parseProperties(schema);

  return {
    name,
    imports: distinct(imports).sort(),
    properties,
  }
}
