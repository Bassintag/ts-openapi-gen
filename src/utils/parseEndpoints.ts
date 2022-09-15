import {OpenAPIV3_1} from "openapi-types";
import {
  BodyDefinition,
  EndpointDefinition,
  MethodDefinition,
  ParamDefinition,
  PathPartDefinition
} from "../domain/EndpointDefinition.js";
import {parseType} from "./parseType.js";
import {capitalize, uncapitalize} from "./capitalize.js";
import {distinct} from "./distinct.js";
import {formatName} from "./formatName.js";
import {resolveRef} from "./resolveRef.js";
import {parseDescription} from "./parseDescription.js";

const parseResponseType = (doc: OpenAPIV3_1.Document, status: OpenAPIV3_1.ResponseObject | OpenAPIV3_1.ReferenceObject): [string, string[], boolean] => {
  if ('$ref' in status) {
    const [, , isBinary] = parseResponseType(doc, resolveRef(doc, status.$ref));
    const [type, imports] = parseType(status);
    return [type, imports, isBinary];
  } else if ('content' in status && status.content != null) {
    if (status.content['application/json']?.schema != null) {
      return [...parseType(status.content['application/json']?.schema), false];
    } else if (status.content['application/octet-stream']) {
      if (status.content['application/octet-stream']?.schema) {
        return [...parseType(status.content['application/octet-stream'].schema), true];
      } else {
        return ['ArrayBuffer', [], true]
      }
    }
  }
  return ['void', [], false];
}

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
        let responseIsBinary: boolean = false;
        let responseType: string = 'unknown';
        let response: OpenAPIV3_1.ResponseObject | undefined
        for (let i = 0; i < 4; i += 1) {
          const response = operation.responses[`20${i}`];
          if (response != null) {
            const [type, imports, isBinary] = parseResponseType(doc, response);
            responseType = type;
            endpointImports.push(...imports);
            responseIsBinary = isBinary;
            break;
          }
        }
        const queryParams: ParamDefinition[] = [];
        const params: ParamDefinition[] = [];
        for (let parameter of operation.parameters ?? []) {
          if ("$ref" in parameter) {
            parameter = resolveRef(doc, parameter.$ref)
          }
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
            } else {
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
          const content = operation.requestBody?.content;
          if ((content['application/json']?.schema) != null) {
            const [type, imports] = parseType(content['application/json']?.schema);
            let serializer: string | undefined;
            if (imports.length > 0) {
              serializer = `serialize${imports[0]}`;
              endpointImports.push(serializer);
            }
            endpointImports.push(...imports);
            body = {
              type,
              serializer,
              isArray: type.endsWith('[]')
            };
          } else if (content['application/octet-stream'] != null) {
            body = {
              type: 'ArrayBuffer',
              isArrayBuffer: true,
            };
          }
        }

        methodDefinitions.push({
          name: uncapitalize(operation.operationId),
          capitalizedName: capitalize(operation.operationId),
          description: parseDescription(operation.description ?? operation.summary),
          path: pathParts,
          isBinary: responseIsBinary,
          body,
          method,
          responseType,
          params,
          queryParams,
        });
      }
    }

    const name = formatName(tag.name);

    endpoints.push({
      name: `${name}Endpoint`,
      description: parseDescription(tag.description),
      methods: methodDefinitions,
      imports: distinct(endpointImports).sort(),
    });
  }

  return endpoints;
}
