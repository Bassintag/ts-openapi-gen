import mustache from "mustache";
import fs from "fs";
import path from "path";

export class Renderer {
  private readonly templatesCache: Record<string, string> = {};
  private readonly initDir: string[] = [];

  private files: string[];

  constructor(
    private templatesDirPath: string,
  ) {
    this.files = [];
  }

  renderTemplate(
    templateName: string,
    params: unknown,
    to: string
  ) {
    if (!(templateName in this.templatesCache)) {
      this.templatesCache[templateName] = fs.readFileSync(
        path.join(this.templatesDirPath, `${templateName}.mustache`),
        "utf-8"
      );
    }
    const rendered = mustache.render(this.templatesCache[templateName], params).trim();
    const dir = path.dirname(to);
    if (!this.initDir.includes(dir)) {
      fs.mkdirSync(dir, {
        recursive: true,
      });
      this.initDir.push(dir);
    }
    fs.writeFileSync(to, rendered);
    this.files.push(path.basename(to, '.ts'));
  };

  renderIndex(to: string) {
    this.renderTemplate('index', {files: this.files}, to);
    this.files.splice(0, this.files.length);
  }
}

