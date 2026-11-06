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
    href: "/prepare",
    items: [
      { title: "Prepare", href: "/prepare" },
      { title: "Install Beacon", href: "/install" },
      { title: "Write Content", href: "/create-content" },
      { title: "Deploy Site", href: "/deploy" },
      { title: "Check for Drift", href: "/doc-updates" },
      { title: "Troubleshoot", href: "/troubleshoot" },
    ],
  },
  {
    title: "Reference",
    href: "/format",
    items: [
      { title: "Authoring Reference", href: "/format" },
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
