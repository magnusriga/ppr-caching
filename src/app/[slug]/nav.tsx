import { headers } from "next/headers";
import Link from "next/link";

export default async function Nav() {
  const nextHeaders = await headers();
  // const nextHeaders = null;

  return (
    <nav className="flex gap-4 mb-6 pb-4 border-b">
      <Link href="/" className="text-blue-600 hover:text-blue-800 underline">
        Home (fooz) with headers: {nextHeaders ? "true" : "false"}
      </Link>
      <Link
        href="/foo"
        className="text-green-600 hover:text-green-800 underline"
      >
        Foo (fetch with tags)
      </Link>
      <Link
        href="/bar"
        className="text-orange-600 hover:text-orange-800 underline"
      >
        Bar (static)
      </Link>
      <Link
        href="/baz"
        className="text-purple-600 hover:text-purple-800 underline"
      >
        Baz (unstable_cache)
      </Link>
    </nav>
  );
}
