import { capitalize } from "./capitalize.js";

export const formatName = (name: string) => {
  const parts = name.split(/\s+/);
  return parts.map(capitalize).join("");
};
