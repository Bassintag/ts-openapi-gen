import {Model} from "./Model.js";
import {Endpoint} from "./Endpoint.js";
import {OpenAPIV3_1} from "openapi-types";
import {Method} from "./Method.js";

export class Api {

  readonly endpoints: Endpoint[];

  readonly models: Model[];

  constructor(
    private readonly doc: OpenAPIV3_1.Document
  ) {
    this.endpoints = [];
    this.models = [];
    this.parse();
  }

  private parse() {
    for (const tag of this.doc.tags ?? []) {
      this.endpoints.push(new Endpoint(tag));
    }
    for (const path of Object.keys(this.doc.paths ?? {})) {
      this.parsePath(path);
    }
    this.parseModels();
  }

  private parsePath(path: string) {
    const pathObject = this.doc.paths?.[path];
    if (pathObject == null) return;
    const {$ref, summary, description, servers, parameters, ...methods} = pathObject;
    for (const [httpMethod, value] of Object.entries(methods)) {
      const method = new Method(this.doc, path, httpMethod);
      for (const tag of value.tags ?? []) {
        const endpoint = this.endpoints.find((e) => e.name === tag);
        if (endpoint != null) {
          endpoint.methods.push(method);
        }
      }
    }
  }

  private parseModels() {
    const allModels = this.endpoints.reduce<Model[]>((p, e) => [...p, ...e.getModels()], []);
    const uniques = allModels
      .filter((model) => model.name != null)
      .filter((model, i, arr) => arr.findIndex((other) => other.name === model.name) === i);
    this.models.push(
      ...uniques.sort((a, b) => {
        if (a.name == null) {
          return b.name == null ? 0 : -1;
        } else if (b.name == null) {
          return 1;
        }
        return a.name.localeCompare(b.name);
      })
    );
  }

}
