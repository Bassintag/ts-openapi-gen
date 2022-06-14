import {Definition} from "./Definition";

export interface ParamDefinition {
  name: string;
  isRequired: boolean;
}

export interface BodyDefinition {
  type: string;
  isArray: boolean;
  serializer?: string;
}

export interface PathPartDefinition {
  isVariable: boolean;
  value: string;
}

export interface MethodDefinition {
  name: string;

  path: PathPartDefinition[];

  method: string;

  body?: BodyDefinition;

  responseType: string;

  params: ParamDefinition[];

  queryParams: ParamDefinition[];
}

export interface EndpointDefinition extends Definition {
  methods: MethodDefinition[];
}
