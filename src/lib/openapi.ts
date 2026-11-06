import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";
import type { NavGroup } from "../../content/nav.config";
import type { Doc } from "./content";

/**
 * Turns an optional OpenAPI 3.x file in content/ into API reference pages.
 * Everything here is synchronous because navigation, search, and the Markdown
 * mirrors read content synchronously. A bad spec fails the build.
 */

type Obj = Record<string, unknown>;

export const API_REFERENCE_ROOT = "/api-reference";
const CONTENT_DIR = path.join(process.cwd(), "content");
const SPEC_FILE_NAMES = ["openapi.yaml", "openapi.yml", "openapi.json"];
const HTTP_METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];
const DEFAULT_TAG = "General";
const PLACEHOLDER_ORIGIN = "https://api.example.com";

export type SchemaField = {
  name: string;
  type: string;
  required: boolean;
  description: string;
  enumValues: string[];
  defaultValue?: string;
  children: SchemaField[];
};

export type ApiParameter = SchemaField & { location: string; example?: unknown };

export type ApiPayload = {
  description: string;
  mediaType?: string;
  type?: string;
  fields: SchemaField[];
  example?: unknown;
};

export type ApiResponse = ApiPayload & { status: string };

export type ApiSecurity = { name: string; label: string; description: string };

export type CodeSample = { label: string; language: string; code: string };

export type ApiOperation = {
  slug: string;
  href: string;
  method: string;
  path: string;
  title: string;
  description: string;
  summaryText: string;
  deprecated: boolean;
  tag: string;
  serverUrl?: string;
  security: ApiSecurity[];
  parameters: ApiParameter[];
  requestBody?: ApiPayload & { required: boolean };
  responses: ApiResponse[];
  samples: CodeSample[];
};

/** A nav item with the extras generated API reference links use. */
export type ApiNavGroup = Omit<NavGroup, "items"> & {
  items: (NavGroup["items"][number] & { section: string; method: string })[];
};

function isObj(value: unknown): value is Obj {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const obj = (value: unknown): Obj => (isObj(value) ? value : {});
const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const str = (value: unknown): string => (typeof value === "string" ? value : "");

/** Inlines internal $ref values. A reference to itself becomes an `x-circular` marker. */
function dereference(node: unknown, root: Obj, fileName: string, stack: string[] = []): unknown {
  if (Array.isArray(node)) return node.map((item) => dereference(item, root, fileName, stack));
  if (!isObj(node)) return node;

  if (typeof node.$ref === "string") {
    const { $ref: ref, ...siblings } = node as Obj & { $ref: string };
    const overrides = dereference(siblings, root, fileName, stack) as Obj;
    if (!ref.startsWith("#/")) {
      throw new Error(`${fileName}: external reference "${ref}" isn't supported. Bundle the spec into one file.`);
    }
    const name = ref.split("/").pop() as string;
    if (stack.includes(ref)) return { ...overrides, "x-circular": name };
    const target = ref
      .slice(2)
      .split("/")
      .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"))
      .reduce<unknown>((current, key) => (isObj(current) || Array.isArray(current) ? (current as Obj)[key] : undefined), root);
    if (target === undefined) throw new Error(`${fileName}: reference "${ref}" doesn't resolve.`);
    return { ...obj(dereference(target, root, fileName, [...stack, ref])), ...overrides };
  }

  return Object.fromEntries(
    Object.entries(node).map(([key, value]) => [key, dereference(value, root, fileName, stack)])
  );
}

/** Flattens allOf into one schema, so its properties and required lists read as a single object. */
function mergeAllOf(schema: Obj): Obj {
  if (!Array.isArray(schema.allOf)) return schema;
  const { allOf, ...rest } = schema;
  return [...allOf.map((part) => mergeAllOf(obj(part))), rest].reduce<Obj>(
    (merged, part) => ({
      ...merged,
      ...part,
      properties: { ...obj(merged.properties), ...obj(part.properties) },
      required: [...arr(merged.required), ...arr(part.required)],
    }),
    {}
  );
}

function variantsOf(schema: Obj): { keyword: string; variants: Obj[] } | null {
  for (const keyword of ["oneOf", "anyOf"]) {
    if (Array.isArray(schema[keyword])) return { keyword, variants: schema[keyword].map(obj) };
  }
  return null;
}

function typeLabel(rawSchema: Obj): string {
  const schema = mergeAllOf(rawSchema);
  if (schema["x-circular"]) return str(schema["x-circular"]);

  const variants = variantsOf(schema);
  if (variants) return variants.variants.map(typeLabel).join(" | ");

  const types = (Array.isArray(schema.type) ? schema.type : [schema.type]).filter(Boolean).map(String);
  const labels = types.map((type) => {
    if (type === "array") return `array<${typeLabel(obj(schema.items))}>`;
    return schema.format ? `${type} (${str(schema.format)})` : type;
  });
  if (labels.length === 0) labels.push(schema.properties ? "object" : schema.enum ? "enum" : "any");
  if (schema.nullable === true) labels.push("null");
  return labels.join(" | ");
}

function fieldsOf(rawSchema: Obj): SchemaField[] {
  const schema = mergeAllOf(rawSchema);
  if (isObj(schema.items)) return fieldsOf(schema.items);

  const variants = variantsOf(schema);
  if (variants) {
    return variants.variants.map((variant, i) =>
      toField(str(variant.title) || `Option ${i + 1}`, variant, false)
    );
  }

  const required = new Set(arr(schema.required).map(String));
  return Object.entries(obj(schema.properties)).map(([name, property]) =>
    toField(name, obj(property), required.has(name))
  );
}

function toField(name: string, rawSchema: Obj, required: boolean, description?: unknown): SchemaField {
  const schema = mergeAllOf(rawSchema);
  return {
    name,
    type: typeLabel(schema),
    required,
    description: str(description) || str(schema.description),
    enumValues: arr(schema.enum).map(String),
    defaultValue: schema.default === undefined ? undefined : JSON.stringify(schema.default),
    children: fieldsOf(schema),
  };
}

function exampleFromSchema(rawSchema: Obj): unknown {
  const schema = mergeAllOf(rawSchema);
  if (schema["x-circular"]) return {};
  if (schema.example !== undefined) return schema.example;
  if (Array.isArray(schema.examples) && schema.examples.length > 0) return schema.examples[0];
  if (schema.default !== undefined) return schema.default;
  if (Array.isArray(schema.enum) && schema.enum.length > 0) return schema.enum[0];

  const variants = variantsOf(schema);
  if (variants) return variants.variants.length > 0 ? exampleFromSchema(variants.variants[0]) : null;

  const type = Array.isArray(schema.type) ? schema.type.find((item) => item !== "null") : schema.type;
  if (type === "array") return [exampleFromSchema(obj(schema.items))];
  if (type === "object" || schema.properties) {
    return Object.fromEntries(
      Object.entries(obj(schema.properties)).map(([name, property]) => [name, exampleFromSchema(obj(property))])
    );
  }
  if (type === "integer" || type === "number") return 0;
  if (type === "boolean") return true;
  if (type === "string") return "string";
  return null;
}

/** Reads a request or response `content` map, preferring JSON when several types exist. */
function readPayload(source: Obj): ApiPayload {
  const content = obj(source.content);
  const mediaType = Object.keys(content).find((type) => type.includes("json")) ?? Object.keys(content)[0];
  const description = str(source.description);
  if (!mediaType) return { description, fields: [] };

  const media = obj(content[mediaType]);
  const schema = obj(media.schema);
  const firstNamedExample = Object.values(obj(media.examples))[0];
  const example =
    media.example ?? (isObj(firstNamedExample) ? firstNamedExample.value : undefined) ?? (media.schema ? exampleFromSchema(schema) : undefined);
  return { description, mediaType, type: typeLabel(schema), fields: fieldsOf(schema), example };
}

function readParameter(source: Obj): ApiParameter {
  const schema = obj(source.schema ?? obj(Object.values(obj(source.content))[0]).schema);
  const example = source.example ?? Object.values(obj(source.examples)).map((item) => obj(item).value)[0];
  return {
    ...toField(str(source.name), schema, source.required === true, source.description),
    location: str(source.in),
    example: example ?? schema.example ?? schema.default ?? arr(schema.enum)[0],
  };
}

function kebabCase(text: string): string {
  return text
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function describeSecurity(name: string, scheme: Obj): ApiSecurity {
  const description = str(scheme.description);
  const httpScheme = str(scheme.scheme).toLowerCase();
  let label: string;
  if (scheme.type === "http") label = `HTTP ${httpScheme} authentication`;
  else if (scheme.type === "apiKey") label = `API key in the \`${str(scheme.name)}\` ${str(scheme.in)}`;
  else if (scheme.type === "oauth2") label = "OAuth 2.0";
  else if (scheme.type === "openIdConnect") label = "OpenID Connect";
  else label = str(scheme.type) || "Authentication";
  return { name, label, description };
}

function resolveServerUrl(servers: unknown): string | undefined {
  const server = obj(arr(servers)[0]);
  const url = str(server.url);
  if (!url) return undefined;
  const variables = obj(server.variables);
  return url.replace(/\{([^}]+)\}/g, (match, name: string) => str(obj(variables[name]).default) || match).replace(/\/$/, "");
}

function placeholder(name: string): string {
  return `YOUR_${name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase()}`;
}

function parameterValue(parameter: ApiParameter): string {
  return parameter.example === undefined ? placeholder(parameter.name) : String(parameter.example);
}

function toPython(value: unknown, indent = ""): string {
  if (value === null || value === undefined) return "None";
  if (value === true) return "True";
  if (value === false) return "False";
  const inner = `${indent}    `;
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return `[\n${value.map((item) => `${inner}${toPython(item, inner)}`).join(",\n")}\n${indent}]`;
  }
  if (isObj(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) return "{}";
    return `{\n${entries.map(([key, item]) => `${inner}${JSON.stringify(key)}: ${toPython(item, inner)}`).join(",\n")}\n${indent}}`;
  }
  return JSON.stringify(value);
}

function buildSamples(
  operation: Pick<ApiOperation, "method" | "path" | "serverUrl" | "parameters" | "requestBody">,
  securitySchemes: Obj[]
): CodeSample[] {
  const { method, parameters, requestBody } = operation;
  const headers: [string, string][] = [];
  const query: [string, string][] = [];

  for (const scheme of securitySchemes) {
    const httpScheme = str(scheme.scheme).toLowerCase();
    if (scheme.type === "apiKey") {
      const name = str(scheme.name);
      if (scheme.in === "query") query.push([name, "YOUR_API_KEY"]);
      else if (scheme.in === "cookie") headers.push(["Cookie", `${name}=YOUR_API_KEY`]);
      else headers.push([name, "YOUR_API_KEY"]);
    } else if (scheme.type === "http" && httpScheme === "basic") {
      headers.push(["Authorization", "Basic YOUR_CREDENTIALS"]);
    } else {
      headers.push(["Authorization", "Bearer YOUR_TOKEN"]);
    }
  }

  let urlPath = operation.path;
  for (const parameter of parameters) {
    if (parameter.location === "path") {
      urlPath = urlPath.replace(`{${parameter.name}}`, encodeURIComponent(parameterValue(parameter)));
    } else if (parameter.required && parameter.location === "query") {
      query.push([parameter.name, parameterValue(parameter)]);
    } else if (parameter.required && parameter.location === "header") {
      headers.push([parameter.name, parameterValue(parameter)]);
    }
  }

  const server = operation.serverUrl ?? PLACEHOLDER_ORIGIN;
  const base = server.startsWith("/") ? `${PLACEHOLDER_ORIGIN}${server}` : server;
  const queryString = query.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
  const url = `${base}${urlPath}${queryString ? `?${queryString}` : ""}`;

  const hasBody = requestBody?.mediaType !== undefined && requestBody.example !== undefined;
  const isJson = hasBody && str(requestBody.mediaType).includes("json");
  if (hasBody) headers.push(["Content-Type", str(requestBody.mediaType)]);
  const body = hasBody ? requestBody.example : undefined;
  const bodyText = !hasBody ? "" : typeof body === "string" ? body : JSON.stringify(body, null, 2);

  const shellQuote = (text: string) => `'${text.replace(/'/g, `'\\''`)}'`;
  const curl = [
    `curl --request ${method}`,
    `  --url ${shellQuote(url)}`,
    ...headers.map(([key, value]) => `  --header ${shellQuote(`${key}: ${value}`)}`),
    ...(hasBody ? [`  --data ${shellQuote(bodyText)}`] : []),
  ].join(" \\\n");

  const reindent = (text: string, indent: string) => text.split("\n").join(`\n${indent}`);
  const jsBody = isJson ? `JSON.stringify(${reindent(bodyText, "  ")})` : JSON.stringify(bodyText);
  const javascript = [
    `const response = await fetch(${JSON.stringify(url)}, {`,
    `  method: ${JSON.stringify(method)},`,
    ...(headers.length > 0
      ? ["  headers: {", ...headers.map(([key, value]) => `    ${JSON.stringify(key)}: ${JSON.stringify(value)},`), "  },"]
      : []),
    ...(hasBody ? [`  body: ${jsBody},`] : []),
    "});",
    "",
    "console.log(await response.json());",
  ].join("\n");

  const python = [
    "import requests",
    "",
    "response = requests.request(",
    `    ${JSON.stringify(method)},`,
    `    ${JSON.stringify(url)},`,
    ...(headers.length > 0
      ? ["    headers={", ...headers.map(([key, value]) => `        ${JSON.stringify(key)}: ${JSON.stringify(value)},`), "    },"]
      : []),
    ...(hasBody ? [isJson ? `    json=${toPython(body, "    ")},` : `    data=${JSON.stringify(bodyText)},`] : []),
    ")",
    "",
    "print(response.json())",
  ].join("\n");

  return [
    { label: "cURL", language: "bash", code: curl },
    { label: "JavaScript", language: "javascript", code: javascript },
    { label: "Python", language: "python", code: python },
  ];
}

/** Parses a spec's text into operations, in the order the spec defines tags and paths. */
export function parseOperations(raw: string, fileName = "openapi spec"): ApiOperation[] {
  let parsed: unknown;
  try {
    parsed = parseYaml(raw);
  } catch (err) {
    throw new Error(`${fileName}: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!isObj(parsed)) throw new Error(`${fileName}: expected an OpenAPI object.`);
  if (parsed.swagger !== undefined) {
    throw new Error(`${fileName}: Swagger 2.0 isn't supported. Convert the spec to OpenAPI 3 first, such as with swagger2openapi.`);
  }
  if (!str(parsed.openapi).startsWith("3.")) {
    throw new Error(`${fileName}: expected an "openapi" version of 3.x, got "${String(parsed.openapi)}".`);
  }
  if (!isObj(parsed.paths)) throw new Error(`${fileName}: expected a "paths" object.`);

  const spec = parsed;
  const schemes = obj(dereference(obj(spec.components).securitySchemes, spec, fileName));
  const slugs = new Map<string, string>();
  const operations: ApiOperation[] = [];

  for (const [apiPath, rawPathItem] of Object.entries(spec.paths as Obj)) {
    const pathItem = obj(dereference(rawPathItem, spec, fileName));

    for (const lowerMethod of HTTP_METHODS) {
      if (!isObj(pathItem[lowerMethod])) continue;
      const source = pathItem[lowerMethod];
      const method = lowerMethod.toUpperCase();
      const identifier = `${method} ${apiPath}`;

      const slug = kebabCase(str(source.operationId) || `${lowerMethod}-${apiPath}`);
      const duplicate = slugs.get(slug);
      if (duplicate) throw new Error(`${fileName}: ${identifier} and ${duplicate} both produce the page "${slug}".`);
      slugs.set(slug, identifier);

      // Operation parameters override path-level ones with the same name and location.
      const parameterMap = new Map<string, Obj>();
      for (const parameter of [...arr(pathItem.parameters), ...arr(source.parameters)].map(obj)) {
        parameterMap.set(`${str(parameter.in)}:${str(parameter.name)}`, parameter);
      }
      const parameters = [...parameterMap.values()].map(readParameter);

      const requirements = (source.security ?? spec.security) as unknown;
      const requirementNames = Object.keys(obj(arr(requirements)[0]));
      const allNames = [...new Set(arr(requirements).flatMap((item) => Object.keys(obj(item))))];
      for (const name of allNames) {
        if (!isObj(schemes[name])) throw new Error(`${fileName}: ${identifier} uses undefined security scheme "${name}".`);
      }

      const requestBody = isObj(source.requestBody)
        ? { ...readPayload(source.requestBody), required: source.requestBody.required === true }
        : undefined;

      const description = str(source.description);
      const summaryText = (description.split(/\n\s*\n/)[0] || str(source.summary) || identifier).replace(/\s+/g, " ").trim();
      const serverUrl = resolveServerUrl(source.servers ?? pathItem.servers ?? spec.servers);

      const operation = { method, path: apiPath, serverUrl, parameters, requestBody };
      operations.push({
        ...operation,
        slug,
        href: `${API_REFERENCE_ROOT}/${slug}`,
        title: str(source.summary) || identifier,
        description,
        summaryText,
        deprecated: source.deprecated === true,
        tag: str(arr(source.tags)[0]) || DEFAULT_TAG,
        security: allNames.map((name) => describeSecurity(name, obj(schemes[name]))),
        responses: Object.entries(obj(source.responses)).map(([status, response]) => ({
          status,
          ...readPayload(obj(response)),
        })),
        samples: buildSamples(operation, requirementNames.map((name) => obj(schemes[name]))),
      });
    }
  }

  // Sort by tag only, keeping path order within each tag. Tags the spec lists come first.
  const tagOrder = arr(spec.tags).map((tag) => str(obj(tag).name));
  const rank = (tag: string) => {
    const index = tagOrder.indexOf(tag);
    return index === -1 ? tagOrder.length : index;
  };
  return operations
    .map((operation, index) => ({ operation, index }))
    .sort((a, b) => rank(a.operation.tag) - rank(b.operation.tag) || a.index - b.index)
    .map(({ operation }) => operation);
}

const inlineCell = (text: string) => text.replace(/\s+/g, " ").replace(/\|/g, "\\|").trim();

function flattenFields(fields: SchemaField[], prefix = ""): SchemaField[] {
  return fields.flatMap((field) => {
    const name = `${prefix}${field.name}`;
    return [{ ...field, name }, ...flattenFields(field.children, `${name}.`)];
  });
}

function fieldTable(fields: SchemaField[]): string[] {
  return [
    "| Name | Type | Required | Description |",
    "| --- | --- | --- | --- |",
    ...flattenFields(fields).map((field) => {
      const extras = [
        field.enumValues.length > 0 ? `Allowed values: ${field.enumValues.join(", ")}.` : "",
        field.defaultValue ? `Default: ${field.defaultValue}.` : "",
      ];
      const description = [field.description, ...extras].filter(Boolean).join(" ");
      return `| ${inlineCell(field.name)} | ${inlineCell(field.type)} | ${field.required ? "Yes" : "No"} | ${inlineCell(description)} |`;
    }),
  ];
}

/** Wraps code in a fence longer than any backtick run inside it, so spec text can't break out. */
export function fencedCode(language: string, code: string): string {
  const longest = Math.max(2, ...(code.match(/`+/g) ?? []).map((run) => run.length));
  const fence = "`".repeat(longest + 1);
  return `${fence}${language}\n${code}\n${fence}`;
}

export function exampleCode(example: unknown): { language: string; code: string } {
  return typeof example === "string"
    ? { language: "text", code: example }
    : { language: "json", code: JSON.stringify(example, null, 2) };
}

function payloadMarkdown(payload: ApiPayload): string[] {
  const lines: string[] = [];
  if (payload.description) lines.push(payload.description, "");
  if (payload.mediaType) lines.push(`Content type: \`${payload.mediaType}\``, "");
  if (payload.fields.length > 0) lines.push(...fieldTable(payload.fields), "");
  if (payload.example !== undefined) {
    const { language, code } = exampleCode(payload.example);
    lines.push(fencedCode(language, code), "");
  }
  return lines;
}

export const PARAMETER_SECTIONS = [
  { location: "path", heading: "Path parameters" },
  { location: "query", heading: "Query parameters" },
  { location: "header", heading: "Header parameters" },
  { location: "cookie", heading: "Cookie parameters" },
];

/** Plain Markdown for one operation, used for search, mirrors, and /llms-full.txt. */
export function operationToMarkdown(operation: ApiOperation): string {
  const lines = [`# ${operation.title}`, "", `\`${operation.method} ${operation.path}\``, ""];
  if (operation.serverUrl) lines.push(`Base URL: \`${operation.serverUrl}\``, "");
  if (operation.deprecated) lines.push("**Deprecated.**", "");
  if (operation.description) lines.push(operation.description, "");

  if (operation.security.length > 0) {
    lines.push("## Authentication", "");
    for (const scheme of operation.security) {
      lines.push(`- ${[scheme.label, scheme.description].filter(Boolean).join(": ")}`, "");
    }
  }
  for (const { location, heading } of PARAMETER_SECTIONS) {
    const parameters = operation.parameters.filter((parameter) => parameter.location === location);
    if (parameters.length > 0) lines.push(`## ${heading}`, "", ...fieldTable(parameters), "");
  }
  if (operation.requestBody) {
    lines.push("## Request body", "", ...payloadMarkdown(operation.requestBody));
  }
  if (operation.responses.length > 0) {
    lines.push("## Responses", "");
    for (const response of operation.responses) {
      lines.push(`### ${response.status}`, "", ...payloadMarkdown(response));
    }
  }
  lines.push("## Code samples", "");
  for (const sample of operation.samples) {
    lines.push(`### ${sample.label}`, "", fencedCode(sample.language, sample.code), "");
  }
  return lines.join("\n");
}

function findSpecFile(): string | null {
  const found = SPEC_FILE_NAMES.filter((name) => fs.existsSync(path.join(CONTENT_DIR, name)));
  if (found.length > 1) {
    throw new Error(`content/ has more than one OpenAPI file: ${found.join(", ")}. Keep only one.`);
  }
  return found[0] ?? null;
}

let cache: { raw: string; operations: ApiOperation[] } | null = null;

/** Every operation in content/openapi.*, or an empty list when the site has no spec. */
export function getApiOperations(): ApiOperation[] {
  const fileName = findSpecFile();
  if (!fileName) return [];
  const raw = fs.readFileSync(path.join(CONTENT_DIR, fileName), "utf8");
  if (cache?.raw !== raw) cache = { raw, operations: parseOperations(raw, `content/${fileName}`) };
  return cache.operations;
}

export function getApiOperation(slug: string): ApiOperation | undefined {
  return getApiOperations().find((operation) => operation.slug === slug);
}

export function operationToDoc(operation: ApiOperation): Doc {
  return {
    slug: operation.href.slice(1),
    href: operation.href,
    frontmatter: { title: operation.title, description: operation.summaryText },
    content: operationToMarkdown(operation),
  };
}

/** Generated pages in the same shape as docs, for search, the sitemap, and AI indexes. */
export function getApiReferenceDocs(): Doc[] {
  return getApiOperations().map(operationToDoc);
}

export function getApiReferenceNavGroup(): ApiNavGroup | null {
  const operations = getApiOperations();
  if (operations.length === 0) return null;
  return {
    title: "API Reference",
    href: operations[0].href,
    items: operations.map((operation) => ({
      title: operation.title,
      href: operation.href,
      section: operation.tag,
      method: operation.method,
    })),
  };
}
