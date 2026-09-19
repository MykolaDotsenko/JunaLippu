import { readFileSync } from "node:fs";

export const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (character === "," && !quoted) {
      values.push(value);
      value = "";
      continue;
    }

    value += character;
  }

  if (quoted) {
    throw new Error("Invalid CSV row: unterminated quoted value.");
  }

  values.push(value);
  return values;
};

export const readCsvRows = (file: URL): string[][] =>
  readFileSync(file, "utf8")
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map(parseCsvLine);
