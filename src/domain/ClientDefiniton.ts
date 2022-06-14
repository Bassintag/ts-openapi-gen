import {EndpointDefinition} from "./EndpointDefinition";

export interface ClientDefinition {
  endpoints: {
    name: string,
    definition: EndpointDefinition
  }[];
}
