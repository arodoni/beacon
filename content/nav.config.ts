export type NavItem = {
  title: string;
  href: string;
  children?: NavItem[];
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
    href: "/prepare",
    items: [
      { title: "Prepare", href: "/prepare" },
      { title: "Install Beacon", href: "/install" },
      {
        title: "Write Content",
        href: "/create-content",
        children: [
          { title: "Authoring Components", href: "/format" },
          { title: "Generate API Reference", href: "/openapi" },
        ],
      },
      { title: "Deploy Site", href: "/deploy" },
      { title: "Check for Drift", href: "/doc-updates" },
      { title: "Troubleshoot", href: "/troubleshoot" },
    ],
  },
  {
    title: "API Reference",
    href: "/rest-api",
    items: [
      { title: "REST API", href: "/rest-api" },
    ],
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
      { title: "Drift Check", href: "/dashboard" },
      { title: "Editor", href: "/dashboard/editor" },
    ],
  },
];
