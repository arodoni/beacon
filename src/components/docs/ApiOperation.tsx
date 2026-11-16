import type { ReactNode } from "react";
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
import { CodeSamples } from "./CodeSamples";
import { articleClassName } from "./DocArticle";
import { Mdx } from "./Mdx";
import { MethodBadge } from "./MethodBadge";

/** Spec descriptions are CommonMark, so they skip the MDX pipeline: braces and angle brackets in them are plain text. */
function Description({ text }: { text: string }) {
  return text ? <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown> : null;
}

type FieldRow = { field: SchemaField; depth: number; key: string };

/** Flattens nested fields into table rows, keeping each child under its parent. */
function fieldRows(fields: SchemaField[], depth = 0, prefix = ""): FieldRow[] {
  return fields.flatMap((field) => {
    const key = `${prefix}${field.name}`;
    return [{ field, depth, key }, ...fieldRows(field.children, depth + 1, `${key}.`)];
  });
}

/**
 * A two-column table: the name and type on the left, the description on the right.
 * Child fields follow their parent, indented one step per level.
 * Response fields hide the Required label, since the reader doesn't send them.
 */
function FieldTable({
  fields,
  heading,
  showRequired = true,
}: {
  fields: SchemaField[];
  heading: string;
  showRequired?: boolean;
}) {
  if (fields.length === 0) return null;
  return (
    <table className="text-sm">
      <thead>
        <tr>
          <th className="w-2/5">{heading}</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {fieldRows(fields).map(({ field, depth, key }) => (
          <tr key={key}>
            <td className="align-top" style={{ paddingLeft: `${depth * 1.25}rem` }}>
              <div className="not-prose flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <code className="font-mono font-semibold text-slate-900 dark:text-white">{field.name}</code>
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{field.type}</span>
              </div>
              {showRequired && field.required && (
                <span className="not-prose mt-1 inline-block text-xs font-medium text-red-700 dark:text-red-300">
                  Required
                </span>
              )}
            </td>
            <td className="align-top [&_p]:my-0 [&_p+p]:mt-1">
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
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Example({ value }: { value: unknown }) {
  const { language, code } = exampleCode(value);
  return <Mdx source={fencedCode(language, code)} />;
}

/** The content type, plus the payload's type when it has no fields to list. */
function ContentType({ payload }: { payload: ApiPayload }) {
  if (!payload.mediaType) return null;
  return (
    <>
      Content type: <code>{payload.mediaType}</code>
      {payload.fields.length === 0 && payload.type && payload.type !== "any" && (
        <>
          {" "}
          (<code>{payload.type}</code>)
        </>
      )}
    </>
  );
}

/** A titled card in the right-hand pane, holding tabbed code panels. */
function SamplePanel({ title, labels, children }: { title: string; labels: string[]; children: ReactNode[] }) {
  return (
    <section
      aria-label={title}
      className="overflow-hidden rounded-xl border border-slate-900/10 bg-slate-50/60 dark:border-white/10 dark:bg-white/[0.03]"
    >
      <p className="px-4 pt-3 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
        {title}
      </p>
      <div className="px-2 pb-1 prose prose-slate max-w-none dark:prose-invert prose-pre:my-2 prose-pre:max-h-[22rem] prose-pre:text-xs">
        <CodeSamples labels={labels}>{children}</CodeSamples>
      </div>
    </section>
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

  const responseExamples = operation.responses.filter((response) => response.example !== undefined);

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-8 xl:flex-row">
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
            <FieldTable fields={section.parameters} heading="Parameter" />
          </section>
        ))}

        {operation.requestBody && (
          <>
            <h2 id="request-body">Request body</h2>
            <Description text={operation.requestBody.description} />
            {operation.requestBody.mediaType && (
              <p className="text-sm">
                <ContentType payload={operation.requestBody} />
              </p>
            )}
            <FieldTable fields={operation.requestBody.fields} heading="Field" />
            {operation.requestBody.example !== undefined && <Example value={operation.requestBody.example} />}
          </>
        )}

        {operation.responses.length > 0 && (
          <>
            <h2 id="responses">Responses</h2>
            <table className="text-sm">
              <thead>
                <tr>
                  <th className="w-1/5">Code</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {operation.responses.map((response) => (
                  <tr key={response.status}>
                    <td className="align-top">
                      {response.fields.length > 0 ? (
                        <a href={`#${statusId(response.status)}`}>
                          <code>{response.status}</code>
                        </a>
                      ) : (
                        <code>{response.status}</code>
                      )}
                    </td>
                    <td className="align-top [&_p]:my-0 [&_p+p]:mt-1">
                      <Description text={response.description} />
                      {response.mediaType && (
                        <p>
                          <ContentType payload={response} />
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {operation.responses
          .filter((response) => response.fields.length > 0)
          .map((response) => (
            <section key={response.status}>
              <h3 id={statusId(response.status)}>{response.status} response body schema</h3>
              <FieldTable fields={response.fields} heading="Field" showRequired={false} />
            </section>
          ))}
      </article>

      {/* Right-hand pane: request samples and response examples stay in view while the fields scroll. */}
      <aside
        aria-label="Code samples"
        className="w-full min-w-0 shrink-0 space-y-4 self-start xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:w-[30rem] xl:overflow-y-auto"
      >
        <SamplePanel title="Request Example" labels={operation.samples.map((sample) => sample.label)}>
          {operation.samples.map((sample) => (
            <Mdx key={sample.label} source={fencedCode(sample.language, sample.code)} />
          ))}
        </SamplePanel>
        {responseExamples.length > 0 && (
          <SamplePanel title="Response Example" labels={responseExamples.map((response) => response.status)}>
            {responseExamples.map((response) => (
              <Example key={response.status} value={response.example} />
            ))}
          </SamplePanel>
        )}
      </aside>
    </div>
  );
}
