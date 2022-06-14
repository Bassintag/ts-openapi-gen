import {OpenAPIV3_1} from "openapi-types";
import {
  BodyDefinition,
  EndpointDefinition,
  MethodDefinition,
  ParamDefinition,
  PathPartDefinition
} from "../domain/EndpointDefinition";
import {parseType} from "./parseType.js";
import {capitalize} from "./capitalize.js";
import {distinct} from "./distinct.js";

export const parseEndpoints = (doc: OpenAPIV3_1.Document) => {
  const endpoints: EndpointDefinition[] = [];

  for (const tag of doc.tags ?? []) {
    const endpointImports: string[] = [];
    const methodDefinitions: MethodDefinition[] = [];

    for (const [path, methods] of Object.entries(doc.paths ?? {})) {
      for (const [method, operation] of Object.entries(methods ?? {})) {
        if (!(operation != null && typeof operation !== 'string' && 'tags' in operation)) {
          continue;
        }
        if (!operation.tags?.includes(tag.name) || operation.operationId == null) {
          continue;
        }
        let responseType: string = 'unknown';
        if ('200' in operation.responses) {
          const status = operation.responses['200'];
          if ('content' in status && status.content != null) {
            const schema = status.content['application/json']?.schema;
            if (schema != null) {
              const [type, imports] = parseType(schema);
              responseType = type;
              endpointImports.push(...imports);
            }
          }
        } else if ('201' in operation.responses) {
          responseType = 'void';
        }

        const queryParams: ParamDefinition[] = [];
        const params: ParamDefinition[] = [];
        for (const parameter of operation.parameters ?? []) {
          if ('in' in parameter) {
            let array: ParamDefinition[] | undefined;
            switch (parameter.in) {
              case 'path':
                array = params;
                break;
              case 'query':
                array = queryParams;
                break;
            }
            if (array != null) {
              array.push({name: parameter.name, isRequired: parameter.required ?? false});
            }
          }
        }

        const pathParts: PathPartDefinition[] = [];
        let pathCopy = path.replace(/^\//, '');
        do {
          let isVariable = false;
          let end = pathCopy.indexOf('{');
          if (end < 0) {
            end = pathCopy.indexOf('}');
            if (end < 0) {
              end = pathCopy.length;
            } else{
              isVariable = true
            }
          }
          const value = pathCopy.slice(0, end);
          pathParts.push({
            value,
            isVariable,
          });
          pathCopy = pathCopy.slice(end + 1);
        } while (pathCopy.length > 0);

        let body: BodyDefinition | undefined;
        if (operation.requestBody != null && 'content' in operation.requestBody) {
          const bodySchema = operation.requestBody?.content?.['application/json']?.schema;
          if (bodySchema != null) {
            const [type, imports] = parseType(bodySchema);
            let serializer: string | undefined;
            if (imports.length > 0){
              serializer = `serialize${imports[0]}`;
              endpointImports.push(serializer);
            }
            endpointImports.push(...imports);
            body = {
              type,
              serializer,
              isArray: type.endsWith('[]')
            };
          }
        }

        methodDefinitions.push({
          name: operation.operationId,
          path: pathParts,
          body,
          method,
          responseType,
          params,
          queryParams,
        });
      }
    }

    endpoints.push({
      name: `${capitalize(tag.name)}Endpoint`,
      methods: methodDefinitions,
      imports: distinct(endpointImports).sort(),
    });
  }

  return endpoints;
}
