export const parseDescription = (description: string | undefined) => {
  if (!description) {
    return [];
  }
  return description.split(/\n+/g).filter((s) => !s.match(/^\s*$/));
};
