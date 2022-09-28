import {Model} from "../document/Model.js";

export const distinctModels = (models: Model[]): Model[] => {
  return models.filter((model, i, arr) => arr.findIndex((other) => other.type === model.type) === i);
}
