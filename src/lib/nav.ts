import type { NavGroup } from "../../content/nav.config";

// next.config.mjs sets trailingSlash: true, so usePathname() returns paths
// like "/configure/" while nav hrefs are written without the trailing slash.
// Normalize both sides before comparing so active-link highlighting works.
function normalize(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

export function isNavActive(pathname: string, href: string): boolean {
  return normalize(pathname) === normalize(href);
}

export function getActiveGroup(pathname: string, groups: NavGroup[]): NavGroup | undefined {
  return groups.find(
    (group) =>
      isNavActive(pathname, group.href) ||
      group.items.some((item) => isNavActive(pathname, item.href))
  );
}
