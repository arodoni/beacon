export type NavItem = {
  title: string;
  href: string;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const nav: NavGroup[] = [
  {
    title: "Get Started",
    items: [
      { title: "Overview", href: "/" },
      { title: "Quickstart", href: "/quickstart" },
    ],
  },
  {
    title: "User Guide",
    items: [
      { title: "Configure", href: "/configure" },
      { title: "Deploy", href: "/deploy" },
      { title: "Doc Updates", href: "/doc-updates" },
      { title: "Troubleshoot", href: "/troubleshoot" },
      { title: "Release Notes", href: "/release-notes" },
    ],
  },
  {
    title: "Reference",
    items: [
      { title: "Code and Content", href: "/code-blocks" },
    ],
  },
  {
    title: "Tools",
    items: [{ title: "Editor", href: "/editor" }],
  },
];
