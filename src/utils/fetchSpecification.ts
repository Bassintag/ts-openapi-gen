import fetch from 'node-fetch';
import {OpenAPIV3_1} from "openapi-types";
import * as yaml from 'yaml';
import fs from "fs";

const fetchSpecificationFromRemote = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Invalid response from server');
  }

  return await response.text();
}

export const fetchSpecification = async (urlOrPath: string) => {
  let body: string;
  if (urlOrPath.match(/^https?:\/\//i)) {
    body = await fetchSpecificationFromRemote(urlOrPath);
  } else {
    body = await fs.promises.readFile(urlOrPath, 'utf-8');
  }

  let document: OpenAPIV3_1.Document;

  try {
    document = JSON.parse(body);
  } catch (e) {
    document = yaml.parse(body);
  }

  if (!document.openapi.startsWith('3.')) {
    throw new Error('Incompatible open API version: ' + document.openapi)
  }

  return document;
}
