export const distinct = <T>(arr: T[]): T[] => {
  return arr.filter((e, i) => arr.indexOf(e) === i);
}
