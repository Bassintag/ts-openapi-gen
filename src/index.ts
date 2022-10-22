#! /usr/bin/env node

import {program} from "commander";
import path from "path";
import fs from "fs";
import ora from "ora";
import {fetchSpecification} from "./utils/fetchSpecification.js";
import {Api} from "./document/Api.js";
import chalk from "chalk";
import {Renderer} from "./utils/Renderer.js";

program
  .name("tsgen")
  .argument("url", "openapi document url (json format)")
  .option("-c, --clear", "clear the output directory beforehand", false)
  .option("-o, --out <out_path>", "output directory path", "./out")
  .option(
    "-t, --templates <template_dir_path>",
    "template directory path",
    path.join(path.dirname(import.meta.url).slice(8), "..", "templates")
  );


const start = async () => {
  program.parse();

  const [openApiUrl] = program.args;

  const {
    clear,
    out: outPath,
    templates: templatesPath,
  } = program.opts();

  if (clear) {
    fs.rmSync(outPath, { recursive: true, force: true });
  }

  const spinner = ora("Fetching OpenAPI document").start();
  const doc = await fetchSpecification(openApiUrl);
  spinner.stop();

  const api = new Api(doc);

  for (const endpoint of api.endpoints) {
    console.log(chalk.yellow(`-> Endpoint: ${endpoint.name}`));
    for (const method of endpoint.methods) {
      console.log(`${chalk.green(method.uppercaseMethod)} ${chalk.gray(method.path)}`);
      if (method.params.length) {
        console.log(chalk.gray(`  Params: ${method.params.map((p) => p.name).join(', ')}`));
      }
      if (method.queryParams.length) {
        console.log(chalk.gray(`  Query params: ${method.queryParams.map((p) => p.name).join(', ')}`));
      }
      for (const methodReturn of method.returns) {
        console.log(chalk.gray(`  -> Can return content of type ${methodReturn.contentType} (${methodReturn.type})`));
      }
    }
  }

  console.log(chalk.yellow(`\nModels:`));
  for (const model of api.models) {
    console.log(chalk.green(model.name), chalk.gray(`(${model.literalType})`))
  }

  const renderer = new Renderer(templatesPath);

  const domainPath = path.join(outPath, 'domain');
  for (const model of api.models) {
    renderer.renderTemplate('dto', model, path.join(domainPath, `${model.name}.ts`));
  }
  renderer.renderIndex(path.join(domainPath, 'index.ts'));

  const serializersPath = path.join(outPath, 'serializers');
  for (const model of api.models) {
    renderer.renderTemplate('serializer', model, path.join(serializersPath, `serialize${model.name}.ts`));
  }
  renderer.renderIndex(path.join(serializersPath, 'index.ts'));

  const endpointsPath = path.join(outPath, 'endpoints');
  for (const endpoint of api.endpoints) {
    renderer.renderTemplate('endpoint', endpoint, path.join(endpointsPath, `${endpoint.capitalizedName}Endpoint.ts`));
  }
  renderer.renderIndex(path.join(endpointsPath, 'index.ts'));

  renderer.renderTemplate('client', api, path.join(outPath, 'Client.ts'));

  renderer.renderTemplate('index', {
    files: ['domain', 'endpoints', 'serializers', 'Client']
  }, path.join(outPath, 'index.ts'));
}

void start();
