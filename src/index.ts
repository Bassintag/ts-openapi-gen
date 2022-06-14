#!/usr/bin/env node

import {program} from 'commander';
import {fetchSpecification} from "./utils/fetchSpecification.js";
import ora from "ora";
import path from "path";
import {parseDto} from "./utils/parseDto.js";
import {renderTemplate} from "./utils/renderTemplate.js";
import fs from "fs";
import {parseEndpoints} from "./utils/parseEndpoints.js";
import chalk from "chalk";
import {ClientDefinition} from "./domain/ClientDefiniton";

program
  .name('tsgen')
  .argument('url', 'openapi document url (json format)')
  .option('-c, --clear', 'clear the output directory beforehand', false)
  .option('-o, --out <out_path>', 'output directory path', './out')
  .option('-f --features <features...>', 'enabled features')
  .option('-t, --templates <template_dir_path>', 'template directory path',
    path.join(path.dirname(import.meta.url).slice(8), '..', 'templates'));

const start = async () => {
  program.parse();

  const [openApiUrl] = program.args;

  const {
    clear,
    out: outPath,
    templates: templatesPath,
    features = ['domain', 'endpoints', 'utils', 'Client']
  } = program.opts();

  if (clear) {
    fs.rmSync(outPath, {recursive: true, force: true});
  }

  const spinner = ora('Fetching OpenAPI document').start();
  const doc = await fetchSpecification(openApiUrl);
  spinner.text = 'Parsing document';
  const dtos = Object.entries(doc.components?.schemas ?? {})
    .map((args) => parseDto(...args));
  const endpoints = parseEndpoints(doc);
  spinner.stop();

  console.log('Features enabled:', features);

  const generateDirectory = <T>(
    resources: T[],
    templateName: string,
    dirPath: string,
    getFileName: (resource: T) => string,
  ) => {
    if (!features.includes(dirPath)) {
      return;
    }
    const fullPath = path.join(outPath, dirPath);
    console.log(chalk.green('Generating directory:'), fullPath)
    const files: string[] = [];
    for (const resource of resources) {
      const name = getFileName(resource);
      const fileName = `${name}.ts`;
      renderTemplate(templatesPath, templateName, resource, path.join(fullPath, fileName));
      console.log(path.join(fullPath, chalk.yellow(fileName)));
      files.push(name);
    }
    renderTemplate(templatesPath, 'index', {files}, path.join(fullPath, 'index.ts'));
  };

  generateDirectory(dtos, 'dto', 'domain', (dto) => dto.name);
  generateDirectory(dtos, 'serializer', 'utils', (dto) => `serialize${dto.name}`);
  generateDirectory(endpoints, 'endpoint', 'endpoints', (endpoint) => endpoint.name);

  if (features.includes('Client')) {
    const clientDefinition: ClientDefinition = {
      endpoints: endpoints.map((definition) => ({
        name: definition.name.replace(/Endpoint$/, '').toLowerCase(),
        definition,
      }))
    };
    console.log(chalk.green('Generating client'));
    renderTemplate(templatesPath, 'client', clientDefinition, path.join(outPath, 'Client.ts'));
  }

  renderTemplate(templatesPath, 'index', {files: features}, path.join(outPath, 'index.ts'));

  spinner.stop();
};


void start();
