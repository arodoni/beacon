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

/**
 * Adds the generated API reference group to the nav. Its endpoints join a group
 * with the same title, so a site can put its own pages above them.
 */
export function withApiReference(groups: SiteNavGroup[], apiReference: SiteNavGroup | null): SiteNavGroup[] {
  if (!apiReference) return groups;
  if (!groups.some((group) => group.title === apiReference.title)) return [...groups, apiReference];
  return groups.map((group) =>
    group.title === apiReference.title ? { ...group, items: [...group.items, ...apiReference.items] } : group
  );
}

export function isNavActive(pathname: string, href: string): boolean {
  return normalize(pathname) === normalize(href);
}

function isItemOrChildActive(pathname: string, item: SiteNavItem): boolean {
  return (
    isNavActive(pathname, item.href) ||
    (item.children ?? []).some((child) => isItemOrChildActive(pathname, child))
  );
}

export function getActiveGroup(pathname: string, groups: SiteNavGroup[]): SiteNavGroup | undefined {
  return groups.find(
    (group) =>
      isNavActive(pathname, group.href) ||
      group.items.some((item) => isItemOrChildActive(pathname, item))
  );
}
