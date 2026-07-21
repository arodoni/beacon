import Link from "next/link";

export default function NotFound() {
  return (
    <div className="not-prose py-20 text-center">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
        Page not found
      </h1>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        <Link href="/" className="text-blue-800 hover:underline dark:text-blue-400">
          Back to the docs home
        </Link>
      </p>
    </div>
  );
}
