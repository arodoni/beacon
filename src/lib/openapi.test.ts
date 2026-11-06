import { test } from "node:test";
import assert from "node:assert/strict";
import { fencedCode, operationToMarkdown, parseOperations } from "./openapi.ts";

const SPEC = `
openapi: 3.1.0
info: { title: Pets, version: 1.0.0 }
servers:
  - url: https://{region}.example.com/v1/
    variables:
      region: { default: eu }
security:
  - bearer: []
tags:
  - name: Pets
  - name: Admin
paths:
  /admin/stats:
    get:
      tags: [Admin]
      summary: Get stats
      security: []
      responses:
        "200": { description: OK }
  /pets/{petId}:
    parameters:
      - { name: petId, in: path, required: true, description: Old text, schema: { type: string } }
    get:
      operationId: getPet
      tags: [Pets]
      summary: Get a pet
      parameters:
        - { name: petId, in: path, required: true, description: New text, schema: { type: string }, example: p1 }
        - { name: limit, in: query, schema: { type: integer, default: 10 } }
      responses:
        "200":
          description: The pet
          content:
            application/json:
              schema: { $ref: "#/components/schemas/Pet" }
    post:
      operationId: updatePet
      tags: [Pets]
      summary: Update a pet
      deprecated: true
      requestBody:
        required: true
        content:
          application/json:
            schema:
              allOf:
                - $ref: "#/components/schemas/Named"
                - type: object
                  required: [age]
                  properties:
                    age: { type: integer }
      responses:
        "204": { description: Updated }
  /owner:
    get:
      operationId: getOwner
      tags: [Pets]
      summary: Get the owner
      responses:
        "200":
          description: The owner
          content:
            application/json:
              schema:
                type: object
                properties:
                  address:
                    $ref: "#/components/schemas/Address"
                    description: Where the owner lives
components:
  securitySchemes:
    bearer: { type: http, scheme: bearer, description: Use a token }
  schemas:
    Address:
      type: object
      required: [city]
      properties:
        city: { type: string }
    Named:
      type: object
      required: [name]
      properties:
        name: { type: string, example: O'Malley }
    Pet:
      type: object
      required: [id]
      properties:
        id: { type: string, example: p1 }
        status: { type: string, enum: [good, great] }
        tags:
          type: array
          items: { type: string }
        parent: { $ref: "#/components/schemas/Pet" }
`;

const operations = () => parseOperations(SPEC, "test.yaml");
const find = (slug: string) => {
  const operation = operations().find((item) => item.slug === slug);
  assert.ok(operation, `missing ${slug}`);
  return operation;
};
const sample = (slug: string, label: string) => find(slug).samples.find((item) => item.label === label)?.code ?? "";

test("orders operations by the spec's tags and builds slugs and hrefs", () => {
  assert.deepEqual(operations().map((item) => item.slug), ["get-pet", "update-pet", "get-owner", "get-admin-stats"]);
  assert.equal(find("get-pet").href, "/api-reference/get-pet");
});

test("resolves the server URL from its variables", () => {
  assert.equal(find("get-pet").serverUrl, "https://eu.example.com/v1");
});

test("operation parameters override path-level ones", () => {
  const parameters = find("get-pet").parameters.filter((item) => item.location === "path");
  assert.equal(parameters.length, 1);
  assert.equal(parameters[0].description, "New text");
});

test("inlines references and marks a schema that refers to itself", () => {
  const [response] = find("get-pet").responses;
  const parent = response.fields.find((field) => field.name === "parent");
  assert.equal(parent?.type, "Pet");
  assert.deepEqual(parent?.children, []);
  assert.equal(response.fields.find((field) => field.name === "tags")?.type, "array<string>");
  assert.deepEqual(response.fields.find((field) => field.name === "status")?.enumValues, ["good", "great"]);
});

test("a description next to a reference overrides the target's", () => {
  const address = find("get-owner").responses[0].fields[0];
  assert.equal(address.description, "Where the owner lives");
});

test("merges allOf properties and required lists", () => {
  const fields = find("update-pet").requestBody?.fields ?? [];
  assert.deepEqual(fields.map((field) => [field.name, field.required]), [["name", true], ["age", true]]);
});

test("applies the global security unless an operation overrides it", () => {
  assert.equal(find("get-pet").security[0].description, "Use a token");
  assert.deepEqual(find("get-admin-stats").security, []);
  assert.ok(!sample("get-admin-stats", "cURL").includes("Authorization"));
});

test("code samples substitute examples and quote safely", () => {
  const curl = sample("update-pet", "cURL");
  assert.ok(curl.startsWith("curl --request POST \\\n  --url 'https://eu.example.com/v1/pets/YOUR_PET_ID'"));
  assert.ok(curl.includes("--header 'Authorization: Bearer YOUR_TOKEN'"));
  assert.ok(curl.includes("O'\\''Malley"));
  assert.ok(sample("get-pet", "cURL").includes("/pets/p1"));
  assert.ok(sample("update-pet", "JavaScript").includes("JSON.stringify({"));
  assert.ok(sample("update-pet", "Python").includes('json={\n        "name": "O\'Malley"'));
});

test("Markdown output lists nested fields with dotted names", () => {
  const markdown = operationToMarkdown(find("get-pet"));
  assert.ok(operationToMarkdown(find("get-owner")).includes("| address.city | string | Yes |"));
  assert.ok(markdown.startsWith("# Get a pet\n\n`GET /pets/{petId}`"));
  assert.ok(markdown.includes("| parent | Pet | No |"));
  assert.ok(markdown.includes("Allowed values: good, great."));
});

test("a fence stays longer than backticks inside the code", () => {
  assert.equal(fencedCode("text", "a ```` b"), "`````text\na ```` b\n`````");
});

for (const [name, raw, message] of [
  ["Swagger 2.0", "swagger: '2.0'\npaths: {}", /Swagger 2\.0 isn't supported/],
  ["a missing version", "paths: {}", /expected an "openapi" version/],
  ["missing paths", "openapi: 3.0.0", /expected a "paths" object/],
  ["invalid YAML", "openapi: [", /test\.yaml/],
  ["a broken reference", 'openapi: 3.0.0\npaths:\n  /a:\n    get:\n      responses:\n        "200": { $ref: "#/nope" }', /doesn't resolve/],
  ["an external reference", 'openapi: 3.0.0\npaths:\n  /a:\n    $ref: "./a.yaml"', /external reference/],
  ["an undefined security scheme", "openapi: 3.0.0\npaths:\n  /a:\n    get:\n      security: [{ nope: [] }]", /undefined security scheme/],
  ["duplicate page slugs", "openapi: 3.0.0\npaths:\n  /a:\n    get: { operationId: same }\n  /b:\n    get: { operationId: same }", /both produce the page/],
] as const) {
  test(`rejects ${name}`, () => {
    assert.throws(() => parseOperations(raw, "test.yaml"), message);
  });
}
