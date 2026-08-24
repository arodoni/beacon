export type NavItem = {
  title: string;
  href: string;
};

export type NavGroup = {
  title: string;
  href: string;
  items: NavItem[];
};

export const nav: NavGroup[] = [
  {
    title: "Get Started",
    href: "/",
    items: [
      { title: "Overview", href: "/" },
      { title: "Quickstart", href: "/quickstart" },
    ],
  },
  {
    title: "User Guide",
    href: "/configure",
    items: [
      { title: "Configure", href: "/configure" },
      { title: "Deploy", href: "/deploy" },
      { title: "Automate Updates", href: "/doc-updates" },
      { title: "Troubleshoot", href: "/troubleshoot" },
    ],
  },
  {
    title: "Reference",
    href: "/code-blocks",
    items: [{ title: "Code and Content", href: "/code-blocks" }],
  },
  {
    title: "Release Notes",
    href: "/release-notes",
    items: [],
  },
  {
    title: "Tools",
    href: "/dashboard",
    items: [
      { title: "Monitor", href: "/dashboard" },
      { title: "Editor", href: "/dashboard/editor" },
    ],
  },
];
