import type { ReactNode } from "react";
import { resolveMediaSrc } from "../../lib/media";

// Rendered on the server at build time, so resolveMediaSrc can check that
// each file exists. Plain <img> and <video> because the site is a static
// export with unoptimized images, where next/image adds nothing.
/* eslint-disable @next/next/no-img-element */

function Figure({ caption, children }: { caption?: string; children: ReactNode }) {
  return (
    <figure className="my-8">
      {children}
      {caption && (
        <figcaption className="mt-3 text-center text-sm text-slate-500 dark:text-slate-400">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

const frameClassName =
  "mx-auto my-0 rounded-lg border border-slate-900/10 dark:border-white/10";

export function Image({
  src,
  alt,
  caption,
  width,
}: {
  src: string;
  alt: string;
  caption?: string;
  width?: number | string;
}) {
  return (
    <Figure caption={caption}>
      <img src={resolveMediaSrc(src)} alt={alt} width={width} loading="lazy" className={frameClassName} />
    </Figure>
  );
}

export function Video({
  src,
  title,
  caption,
  poster,
  autoPlay = false,
}: {
  src: string;
  title: string;
  caption?: string;
  poster?: string;
  autoPlay?: boolean;
}) {
  return (
    <Figure caption={caption}>
      <video
        src={resolveMediaSrc(src)}
        poster={poster && resolveMediaSrc(poster)}
        title={title}
        aria-label={title}
        controls
        playsInline
        preload="metadata"
        // Browsers only allow autoplay for muted videos, so loop it silently
        // like a GIF.
        autoPlay={autoPlay}
        muted={autoPlay}
        loop={autoPlay}
        className={`w-full ${frameClassName}`}
      />
    </Figure>
  );
}

/** Markdown image syntax, ![alt](diagram.png), resolved the same way as <Image>. */
export function MarkdownImage({ src, alt }: { src?: string; alt?: string }) {
  if (!src) return null;
  return <img src={resolveMediaSrc(src)} alt={alt ?? ""} loading="lazy" className={frameClassName} />;
}
