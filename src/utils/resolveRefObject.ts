import {OpenAPIV3_1} from "openapi-types";
import get from "lodash.get";
import {formatName} from "./formatName.js";

export const resolveRef = <T>(doc: OpenAPIV3_1.Document, refObject: OpenAPIV3_1.ReferenceObject): T => {
  const ref = refObject.$ref;
  const sanitized = ref.replace(/^#\//, "").replace(/\//g, ".");
  const value = get(doc, sanitized);
  if (value == null) {
    throw new Error("Unresolved ref: " + ref);
  }
  return value as T;
}

export const resolveRefObject = <T>(doc: OpenAPIV3_1.Document, refObject: OpenAPIV3_1.ReferenceObject | T): T => {
  if ('$ref' in refObject) {
    return resolveRef(doc, refObject);
  } else {
    return refObject;
  }
};

export const resolveRefName = (ref: OpenAPIV3_1.ReferenceObject): string => {
  const match = ref.$ref.match(/(\w+)$/);
  if (match) {
    return formatName(match[1]);
  } else {
    throw new Error('Invalid ref');
  }
}
