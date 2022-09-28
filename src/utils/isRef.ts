import {OpenAPIV3_1} from "openapi-types";

export const isRef = (refOrObject: OpenAPIV3_1.ReferenceObject | unknown): refOrObject is OpenAPIV3_1.ReferenceObject => {
  return refOrObject != null && '$ref' in refOrObject;
}
