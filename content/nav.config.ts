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
      { title: "Introduction", href: "/" },
      { title: "Quickstart", href: "/quickstart" },
    ],
  },
  {
    title: "Reference",
    items: [
      { title: "Configuration", href: "/configuration" },
      { title: "Code & Content", href: "/code-blocks" },
    ],
  },
  {
    title: "Tools",
    items: [{ title: "Playground", href: "/playground" }],
  },
];
