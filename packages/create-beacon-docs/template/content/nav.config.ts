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
      { title: "Get Started", href: "/get-started" },
    ],
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
