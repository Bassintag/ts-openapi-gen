import {Definition} from "./Definition.js";
import {PropertyDefinition} from "./PropertyDefinition.js";

export interface DtoDefinition extends Definition {
  properties: PropertyDefinition[];
}
