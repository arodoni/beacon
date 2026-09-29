import { Mdx } from "./Mdx";
import { TableOfContents } from "./TableOfContents";
import { getHeadings } from "../../lib/toc";

export async function DocArticle({ content }: { content: string }) {
  const headings = getHeadings(content);

  return (
    <div className="flex flex-1 gap-10">
      <article className="prose prose-slate max-w-none flex-1 dark:prose-invert prose-a:font-normal prose-a:no-underline prose-a:text-blue-600 dark:prose-a:text-blue-400">
        <Mdx source={content} />
      </article>
      <TableOfContents items={headings} />
    </div>
  );
}
