import {OpenAPIV3_1} from "openapi-types";
import {Method} from "./Method.js";
import {ModelsHolder} from "./interfaces/ModelsHolder.js";
import {Model} from "./Model.js";
import {capitalize, uncapitalize} from "../utils/capitalize.js";
import {distinctModels} from "../utils/distinctModels.js";
import {formatName} from "../utils/formatName.js";

export class Endpoint implements ModelsHolder {

  readonly name: string;

  readonly uncapitalizedName: string;
  readonly capitalizedName: string;

  readonly methods: Method[];

  get dependsOn(): Model[] {
    return distinctModels(this.getModels()).filter((m) => m.name != null);
  }

  constructor(
    tag: OpenAPIV3_1.TagObject,
  ) {
    this.name = tag.name;
    this.capitalizedName = formatName(this.name);
    this.uncapitalizedName = uncapitalize(this.capitalizedName);
    this.methods = [];
  }

  getModels(): Model[] {
    return this.methods.reduce<Model[]>((p, m) => [...p, ...m.getModels()], []);
  }
}
