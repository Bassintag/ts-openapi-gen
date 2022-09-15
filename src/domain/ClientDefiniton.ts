import { EndpointDefinition } from "./EndpointDefinition.js";

export interface ClientDefinition {
  endpoints: {
    name: string;
    definition: EndpointDefinition;
  }[];
}
