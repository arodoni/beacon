import { Mdx } from "./Mdx";
import { TableOfContents } from "./TableOfContents";
import { getHeadings } from "../../lib/toc";

export async function DocArticle({ content }: { content: string }) {
  const headings = getHeadings(content);

  return (
    <div className="flex flex-1 gap-8">
      <article className="prose prose-slate max-w-3xl flex-1 dark:prose-invert prose-a:font-normal prose-a:no-underline prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-p:my-3 prose-p:leading-7 prose-h1:mb-4 prose-h2:mt-8 prose-h2:mb-3 prose-h3:mt-6 prose-h3:mb-2 prose-ul:my-3 prose-ol:my-3 prose-li:my-1 prose-pre:my-4">
        <Mdx source={content} />
      </article>
      <TableOfContents items={headings} />
    </div>
  );
}
