import {OpenAPIV3_1} from "openapi-types";
import get from 'lodash.get';

export const resolveRef = <T>(doc: OpenAPIV3_1.Document, ref: string) => {
  const sanitized = ref.replace(/^#\//, "").replace(/\//g, '.');
  const value = get(doc, sanitized);

  if (value == null) {
    throw new Error('Unresolved ref: ' + ref);
  }

  return value as T;
}
