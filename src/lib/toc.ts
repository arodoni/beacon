import { unified } from "unified";
import remarkParse from "remark-parse";
import { visit } from "unist-util-visit";
import { toString } from "mdast-util-to-string";
import GithubSlugger from "github-slugger";
import type { Heading } from "mdast";

export type TocItem = {
  id: string;
  text: string;
  depth: number;
};

const parser = unified().use(remarkParse);

export function getHeadings(source: string): TocItem[] {
  const tree = parser.parse(source);
  const slugger = new GithubSlugger();
  const headings: TocItem[] = [];

  visit(tree, "heading", (node: Heading) => {
    if (node.depth < 2 || node.depth > 3) return;
    const text = toString(node);
    headings.push({ id: slugger.slug(text), text, depth: node.depth });
  });

  return headings;
}
