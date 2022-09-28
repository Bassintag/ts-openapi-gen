import {OpenAPIV3_1} from "openapi-types";
import {resolveRef, resolveRefName, resolveRefObject} from "../utils/resolveRefObject.js";
import {isRef} from "../utils/isRef.js";
import {ModelsHolder} from "./interfaces/ModelsHolder.js";
import {distinct} from "../utils/distinct.js";

export class Property implements ModelsHolder {

  readonly model: Model;

  get type() {
    return this.model.type;
  }

  constructor(
    private readonly doc: OpenAPIV3_1.Document,
    private readonly schema: OpenAPIV3_1.SchemaObject,
    readonly name: string,
    readonly isRequired: boolean,
    modelName?: string,
  ) {
    this.model = new Model(doc, schema, modelName);
  }

  getModels(): Model[] {
    return [this.model];
  }
}

export class Model implements ModelsHolder {

  readonly dependsOn: Model[];

  readonly properties: Property[];

  arrayModel?: Model;

  literalType?: string;

  get type(): string {
    return this.name ?? this.literalType ?? 'unknown';
  }

  get dependencies(): string[] {
    return distinct([
      ...this.dependsOn.filter((m) => m.name != null).map((d) => d.name as string),
      ...this.properties.filter((p) => p.model.name != null).map((p) => p.model.name as string)
    ]);
  }

  constructor(
    private readonly doc: OpenAPIV3_1.Document,
    private readonly schema: OpenAPIV3_1.SchemaObject,
    readonly name?: string,
  ) {
    this.dependsOn = [];
    this.properties = [];
    this.parse();
  }

  parse() {
    if (this.schema.oneOf != null) {
      this.dependsOn.push(
        ...this.schema.oneOf.map((schemaOrRef, i) => {
          return Model.fromSchemaOrRef(this.doc, schemaOrRef, `${this.name}Option${i + 1}`);
        })
      );
      this.literalType = this.dependsOn.map((m) => m.name).join(' | ');
    } else if (this.schema.allOf != null) {
      this.dependsOn.push(
        ...this.schema.allOf.map((schemaOrRef, i) => {
          return Model.fromSchemaOrRef(this.doc, schemaOrRef, `${this.name}Part${i + 1}`);
        })
      );
      this.literalType = this.dependsOn.map((m) => m.name).join(' & ');
    } else if (this.schema.type != null && !Array.isArray(this.schema.type)) {
      switch (this.schema.type) {
        case 'object':
          this.parseObject();
          break;
        case 'array':
          const model = Model.fromSchemaOrRef(this.doc, this.schema.items, `${this.name}Item`);
          this.dependsOn.push(model);
          this.literalType = `${model.name}[]`;
          this.arrayModel = model;
          break;
        case 'integer':
          this.literalType = 'number';
          break;
        case "string":
          if (this.schema.format === 'binary') {
            this.literalType = 'Blob';
          } else {
            this.literalType = 'string';
          }
          break;
        default:
          this.literalType = this.schema.type;
      }
    }
  }

  private parseObject() {
    for (const [name, schemaOrReference] of Object.entries(this.schema.properties ?? {})) {
      const schema = resolveRefObject(this.doc, schemaOrReference);
      let modelName: string | undefined;
      if (isRef(schemaOrReference)) {
        modelName = resolveRefName(schemaOrReference);
      }
      const isRequired = this.schema.required?.includes(name) ?? false;
      const property = new Property(this.doc, schema, name, isRequired, modelName);
      this.properties.push(property);
    }
  }

  getModels(): Model[] {
    const models: Model[] = [this];
    for (const dependency of this.dependsOn) {
      models.push(...dependency.getModels())
    }
    for (const property of this.properties) {
      models.push(...property.getModels())
    }
    return models;
  }

  static fromRef(doc: OpenAPIV3_1.Document, ref: OpenAPIV3_1.ReferenceObject): Model {
    return new Model(doc, resolveRef(doc, ref), resolveRefName(ref));
  }

  static fromSchemaOrRef(
    doc: OpenAPIV3_1.Document,
    schemaOrRef: OpenAPIV3_1.ReferenceObject | OpenAPIV3_1.SchemaObject,
    nonRefName?: string,
  ): Model {
    if (isRef(schemaOrRef)) {
      return Model.fromRef(doc, schemaOrRef);
    } else {
      return new Model(doc, schemaOrRef, nonRefName);
    }
  }

}
