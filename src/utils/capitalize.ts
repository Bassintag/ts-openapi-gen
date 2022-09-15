export const capitalize = (s: string) => {
  return s[0].toUpperCase() + s.slice(1);
};

export const uncapitalize = (s: string) => {
  return s[0].toLowerCase() + s.slice(1);
};
