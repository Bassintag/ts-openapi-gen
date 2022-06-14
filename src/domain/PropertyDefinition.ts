export interface PropertyDefinition {
  name: string;
  type: string;
  isRequired: boolean;
  isArray: boolean;
  serializer?: string;
}
