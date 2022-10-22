import {OpenAPIV3_1} from "openapi-types";
import {resolveRefObject} from "../utils/resolveRefObject.js";
import {Model} from "./Model.js";
import {capitalize, uncapitalize} from "../utils/capitalize.js";
import {ModelsHolder} from "./interfaces/ModelsHolder.js";
import {mediaTypeToName} from "../utils/mediaTypeToName.js";

export class MethodParam {
  constructor(
    readonly name: string,
  ) {
  }
}

export class MediaTypeModel {

  readonly model?: Model;

  readonly name?: string;

  get type(): string {
    return this.model?.type ?? 'unknown';
  }

  deserialize: unknown;
  serialize: unknown;

  get bodyGetter(): string {
    switch (this.contentType) {
      case 'application/octet-stream':
      case 'octet-stream':
        return 'blob';
      case 'application/json':
      default:
        return 'text';
    }
  }

  constructor(
    private readonly doc: OpenAPIV3_1.Document,
    readonly contentType: string,
    modelName: string,
    schemaOrRef: OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.SchemaObject | undefined,
  ) {
    if (schemaOrRef) {
      this.model = Model.fromSchemaOrRef(doc, schemaOrRef, modelName);
    }
    this.name = mediaTypeToName(contentType);
    this.serialize = () => {
      return (content: string, render: (content: string) => string) => {
        switch (contentType) {
          case 'application/json':
            return `JSON.stringify(${render(content)})`
          case 'application/octet-stream':
          case 'octet-stream':
          default:
            return render(content);
        }
      }
    };
    this.deserialize = () => {
      return (content: string, render: (content: string) => string) => {
        switch (contentType) {
          case 'application/json':
            return `JSON.parse(${render(content)})`
          case 'application/octet-stream':
          case 'octet-stream':
          default:
            return render(content);
        }
      }
    };
  }
}

const validResponseCodes = ['200', '201', '202', '203', '204', '205', '206'];

export class Method implements ModelsHolder {

  name?: string;
  capitalizedName?: string;
  readonly uppercaseMethod: string;
  readonly templatedPath: string;
  readonly params: MethodParam[];
  readonly queryParams: MethodParam[];
  readonly bodies: MediaTypeModel[];
  readonly returns: MediaTypeModel[];

  get hasDifferentReturnsOrBodies() {
    return this.hasDifferentBodies || this.hasDifferentReturns;
  }

  get hasDifferentReturns() {
    return this.returns.length > 1;
  }

  get hasOneReturn() {
    return this.returns.length === 1;
  }

  get hasDifferentBodies() {
    return this.bodies.length > 1;
  }

  get hasOneBody() {
    return this.bodies.length === 1;
  }

  get returnContentTypes() {
    return this.returns.map((r) => `"${r.contentType}"`).join(' | ');
  }

  get bodiesContentType() {
    return this.bodies.map((r) => `"${r.contentType}"`).join(' | ');
  }

  get bodyType(): string {
    if (this.bodies.length === 0) {
      return 'unknown';
    }
    return this.bodies.map((r) => r.type).join(' | ');
  }

  get returnType(): string {
    if (this.returns.length === 0) {
      return 'unknown';
    }
    return this.returns.map((r) => r.type).join(' | ');
  }

  get return(): MediaTypeModel {
    if (this.returns.length !== 1) {
      throw new Error(`Method ${this.name} has ${this.returns.length} returns (expected 1)`);
    }
    return this.returns[0];
  }

  get body(): MediaTypeModel {
    if (this.bodies.length !== 1) {
      throw new Error(`Method ${this.name} has ${this.bodies.length} bodies (expected 1)`);
    }
    return this.bodies[0];
  }

  get hasBody(): boolean {
    return this.bodies.length > 0;
  }

  constructor(
    private readonly doc: OpenAPIV3_1.Document,
    readonly path: string,
    readonly method: string,
  ) {
    this.uppercaseMethod = method.toUpperCase();
    this.templatedPath = path.replace(/\{(.*?)}/g, '${$1}');
    this.params = [];
    this.queryParams = [];
    this.bodies = [];
    this.returns = [];
    this.parse();
  }

  private parse() {
    const pathObject = this.doc.paths?.[this.path];
    if (pathObject == null) throw new Error('Invalid path');
    const {$ref, summary, description, servers, parameters, ...methods} = pathObject;
    const methodObject = methods[this.method as keyof typeof methods];
    if (methodObject == null) throw new Error('Invalid method');
    if (methodObject.operationId != null) {
      this.name = uncapitalize(methodObject.operationId);
      this.capitalizedName = capitalize(this.name);
    }

    // Parse params
    for (const param of [...parameters ?? [], ...methodObject.parameters ?? []]) {
      const resolvedParam = resolveRefObject(this.doc, param);
      const methodParam = new MethodParam(resolvedParam.name);
      switch (resolvedParam.in) {
        case 'query':
          this.queryParams.push(methodParam);
          break;
        case 'path':
          this.params.push(methodParam);
          break;
        default:
          console.warn(`Unresolved param in: ${resolvedParam.in}`)
      }
    }

    // Parse returns
    const responseOrRef = validResponseCodes.map((code) => methodObject.responses[code]).filter((r) => r != null)[0];
    if (responseOrRef != null) {
      const response = resolveRefObject(this.doc, responseOrRef);
      const entries = Object.entries(response.content ?? {});
      for (const [contentType, media] of entries) {
        let modelName = this.name!;
        if (entries.length > 1) {
          modelName = `${this.name}${mediaTypeToName(contentType)}`;
        }
        this.returns.push(new MediaTypeModel(this.doc, contentType, modelName, media.schema));
      }
    }

    // Parse body
    if (methodObject.requestBody != null) {
      const bodyObject = resolveRefObject(this.doc, methodObject.requestBody);
      for (const [contentType, {schema}] of Object.entries(bodyObject.content)) {
        let name: string;
        if (this.hasDifferentReturns) {
          name = `${this.capitalizedName}${mediaTypeToName(contentType)}Body`;
        } else {
          name = `${this.capitalizedName}Body`;
        }
        this.bodies.push(
          new MediaTypeModel(this.doc, contentType, name, schema)
        );
      }
    }
  }

  getModels(): Model[] {
    return [...this.returns.reduce<Model[]>((p, r) => {
      if (r.model) {
        p.push(...r.model.getModels());
      }
      return p;
    }, []), ...this.bodies.reduce<Model[]>((p, r) => {
      if (r.model) {
        p.push(...r.model.getModels());
      }
      return p;
    }, [])];
  }
}
