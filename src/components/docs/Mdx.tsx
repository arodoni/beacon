import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";

export async function Mdx({ source }: { source: string }) {
  const { content } = await compileMDX({
    source,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
          [
            rehypePrettyCode,
            {
              // Code blocks stay a fixed navy, like a real code editor pane,
              // regardless of the site's own light/dark toggle.
              theme: "github-dark",
            },
          ],
        ],
      },
    },
  });

  return content;
}
