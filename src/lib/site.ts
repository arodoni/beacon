export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

/**
 * Name of the product these docs describe, shown in the top bar and page
 * titles. Set it with NEXT_PUBLIC_PRODUCT_NAME. Docs reference it as
 * {{productName}}.
 */
export const productName = process.env.NEXT_PUBLIC_PRODUCT_NAME || "MyProduct";

/** Name of the docs tool itself, for text that describes Beacon on any site. */
export const beaconName = "Beacon";

/** Project name (repo and package name). Docs reference it as {{projectName}}. */
export const projectName = "beacon";
