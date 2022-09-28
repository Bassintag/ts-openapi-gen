import {capitalize} from "./capitalize.js";

export const mediaTypeToName = (mediaType: string) => {
  return mediaType.split(/[-\/]/g)
    .reduce((p, part) => `${p}${capitalize(part)}`, '');
}
