import mustache from "mustache";
import fs from "fs";
import path from "path";

const templatesCache: Record<string, string> = {};
const initDir: string[] = [];

export const renderTemplate = (
  templatesDirPath: string,
  templateName: string,
  params: unknown,
  to: string
) => {
  if (!(templateName in templatesCache)) {
    templatesCache[templateName] = fs.readFileSync(
      path.join(templatesDirPath, `${templateName}.mustache`),
      "utf-8"
    );
  }
  const rendered = mustache.render(templatesCache[templateName], params).trim();
  const dir = path.dirname(to);
  if (!initDir.includes(dir)) {
    fs.mkdirSync(dir, {
      recursive: true,
    });
    initDir.push(dir);
  }
  fs.writeFileSync(to, rendered);
};
