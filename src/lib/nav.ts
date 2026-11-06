import type { NavGroup } from "../../content/nav.config";

// next.config.mjs sets trailingSlash: true, so usePathname() returns paths
// like "/configure/" while nav hrefs are written without the trailing slash.
// Normalize both sides before comparing so active-link highlighting works.
function normalize(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/** A nav item, with the section and method that generated API reference links add. */
export type SiteNavItem = NavGroup["items"][number] & { section?: string; method?: string };
export type SiteNavGroup = Omit<NavGroup, "items"> & { items: SiteNavItem[] };

export function isNavActive(pathname: string, href: string): boolean {
  return normalize(pathname) === normalize(href);
}

export function getActiveGroup(pathname: string, groups: SiteNavGroup[]): SiteNavGroup | undefined {
  return groups.find(
    (group) =>
      isNavActive(pathname, group.href) ||
      group.items.some((item) => isNavActive(pathname, item.href))
  );
}
