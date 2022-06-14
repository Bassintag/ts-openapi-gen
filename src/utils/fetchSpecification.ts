import fetch from 'node-fetch';
import {OpenAPIV3_1} from "openapi-types";
import * as yaml from 'yaml';

export const fetchSpecification = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Invalid response from server');
  }

  let document: OpenAPIV3_1.Document
  const body = await response.text();

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
