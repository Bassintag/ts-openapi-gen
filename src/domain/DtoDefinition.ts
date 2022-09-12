import {Definition} from "./Definition.js";
import {PropertyDefinition} from "./PropertyDefinition.js";

export interface DtoDefinition extends Definition {
  isObject?: boolean;

  isArray?: boolean;

  isArrayOfObjects?: boolean;

  type: string;

  properties: PropertyDefinition[];
}
