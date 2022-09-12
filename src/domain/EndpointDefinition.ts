import {Definition} from "./Definition";

export interface ParamDefinition {
  name: string;
  isRequired: boolean;
}

export interface BodyDefinition {
  type: string;
  isArrayBuffer?: boolean;
  isArray?: boolean;
  serializer?: string;
}

export interface PathPartDefinition {
  isVariable: boolean;
  value: string;
}

export interface MethodDefinition {
  name: string;

  description?: string[];

  capitalizedName: string;

  path: PathPartDefinition[];

  method: string;

  body?: BodyDefinition;

  responseType: string;

  isBinary: boolean;

  params: ParamDefinition[];

  queryParams: ParamDefinition[];
}

export interface EndpointDefinition extends Definition {
  description?: string[];

  methods: MethodDefinition[];
}
