import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  exampleCode,
  fencedCode,
  PARAMETER_SECTIONS,
  type ApiOperation,
  type ApiPayload,
  type SchemaField,
} from "../../lib/openapi";
import type { TocItem } from "../../lib/toc";
import { CodeSamples } from "./CodeSamples";
import { articleClassName } from "./DocArticle";
import { Mdx } from "./Mdx";
import { MethodBadge } from "./MethodBadge";
import { TableOfContents } from "./TableOfContents";

/** Spec descriptions are CommonMark, so they skip the MDX pipeline: braces and angle brackets in them are plain text. */
function Description({ text }: { text: string }) {
  return text ? <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown> : null;
}

function Field({ field }: { field: SchemaField }) {
  return (
    <li className="border-t border-slate-900/10 py-3 first:border-t-0 dark:border-white/10">
      <div className="not-prose flex flex-wrap items-center gap-2 text-sm">
        <code className="font-mono font-semibold text-slate-900 dark:text-white">{field.name}</code>
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{field.type}</span>
        {field.required && (
          <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-400/15 dark:text-red-300">
            Required
          </span>
        )}
      </div>
      <div className="mt-1 text-sm [&_p]:my-1">
        <Description text={field.description} />
        {field.enumValues.length > 0 && (
          <p>
            Allowed values:{" "}
            {field.enumValues.map((value, i) => (
              <span key={value}>
                {i > 0 && ", "}
                <code>{value}</code>
              </span>
            ))}
          </p>
        )}
        {field.defaultValue && (
          <p>
            Default: <code>{field.defaultValue}</code>
          </p>
        )}
      </div>
      {field.children.length > 0 && (
        <details className="mt-2 rounded-lg border border-slate-900/10 px-3 dark:border-white/10">
          <summary className="cursor-pointer py-2 text-sm text-slate-600 dark:text-slate-300">
            Show Child Attributes
          </summary>
          <FieldList fields={field.children} />
        </details>
      )}
    </li>
  );
}

function FieldList({ fields }: { fields: SchemaField[] }) {
  if (fields.length === 0) return null;
  return (
    <ul className="my-3 list-none p-0 [&>li]:my-0 [&>li]:pl-0">
      {fields.map((field) => (
        <Field key={field.name} field={field} />
      ))}
    </ul>
  );
}

function Example({ value }: { value: unknown }) {
  const { language, code } = exampleCode(value);
  return <Mdx source={fencedCode(language, code)} />;
}

function Payload({ payload }: { payload: ApiPayload }) {
  return (
    <>
      <Description text={payload.description} />
      {payload.mediaType && (
        <p className="text-sm">
          Content type: <code>{payload.mediaType}</code>
          {payload.fields.length === 0 && payload.type && payload.type !== "any" && (
            <>
              {" "}
              (<code>{payload.type}</code>)
            </>
          )}
        </p>
      )}
      <FieldList fields={payload.fields} />
      {payload.example !== undefined && <Example value={payload.example} />}
    </>
  );
}

function statusId(status: string): string {
  return `response-${status.toLowerCase()}`;
}

export function ApiOperationPage({ operation }: { operation: ApiOperation }) {
  const parameterSections = PARAMETER_SECTIONS.map((section) => ({
    ...section,
    id: section.heading.toLowerCase().replace(/\s+/g, "-"),
    parameters: operation.parameters.filter((parameter) => parameter.location === section.location),
  })).filter((section) => section.parameters.length > 0);

  const toc: TocItem[] = [
    ...(operation.security.length > 0 ? [{ id: "authentication", text: "Authentication", depth: 2 }] : []),
    ...parameterSections.map((section) => ({ id: section.id, text: section.heading, depth: 2 })),
    ...(operation.requestBody ? [{ id: "request-body", text: "Request body", depth: 2 }] : []),
    ...(operation.responses.length > 0 ? [{ id: "responses", text: "Responses", depth: 2 }] : []),
    ...operation.responses.map((response) => ({ id: statusId(response.status), text: response.status, depth: 3 })),
    { id: "code-samples", text: "Code samples", depth: 2 },
  ];

  return (
    <div className="flex min-w-0 flex-1 gap-8">
      <article className={`${articleClassName} min-w-0`}>
        <h1>{operation.title}</h1>

        <div className="not-prose my-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-900/10 px-3 py-2 dark:border-white/10">
          <MethodBadge method={operation.method} />
          <code className="min-w-0 break-all font-mono text-sm text-slate-900 dark:text-white">
            {operation.serverUrl && (
              <span className="text-slate-500 dark:text-slate-400">{operation.serverUrl}</span>
            )}
            {operation.path}
          </code>
          {operation.deprecated && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
              Deprecated
            </span>
          )}
        </div>

        <Description text={operation.description} />

        {operation.security.length > 0 && (
          <>
            <h2 id="authentication">Authentication</h2>
            <ul>
              {operation.security.map((scheme) => (
                <li key={scheme.name}>
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {[scheme.label, scheme.description].filter(Boolean).join(": ")}
                  </Markdown>
                </li>
              ))}
            </ul>
          </>
        )}

        {parameterSections.map((section) => (
          <section key={section.id}>
            <h2 id={section.id}>{section.heading}</h2>
            <FieldList fields={section.parameters} />
          </section>
        ))}

        {operation.requestBody && (
          <>
            <h2 id="request-body">Request body</h2>
            <Payload payload={operation.requestBody} />
          </>
        )}

        {operation.responses.length > 0 && <h2 id="responses">Responses</h2>}
        {operation.responses.map((response) => (
          <section key={response.status}>
            <h3 id={statusId(response.status)}>{response.status}</h3>
            <Payload payload={response} />
          </section>
        ))}

        <h2 id="code-samples">Code samples</h2>
        <CodeSamples labels={operation.samples.map((sample) => sample.label)}>
          {operation.samples.map((sample) => (
            <Mdx key={sample.label} source={fencedCode(sample.language, sample.code)} />
          ))}
        </CodeSamples>
      </article>
      <TableOfContents items={toc} />
    </div>
  );
}
