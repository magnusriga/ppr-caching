import { headers } from "next/headers";
import Link from "next/link";

export default async function Nav() {
  const nextHeaders = await headers();
  // const nextHeaders = null;

  return (
    <nav className="border-red-300 border-2 p-4 flex gap-4">
      <div>Dynamic Component - Navigation: </div>
      <Link href="/" className="text-blue-600 hover:text-blue-800 underline">
        Home with headers: {nextHeaders ? "true" : "false"}
      </Link>
      <span className="mx-2">-</span>
      <Link
        href="/foo"
        className="text-green-600 hover:text-green-800 underline"
      >
        Foo (fetch with tags)
      </Link>
      <span className="mx-2">-</span>
      <Link
        href="/bar"
        className="text-orange-600 hover:text-orange-800 underline"
      >
        Bar (static)
      </Link>
      <span className="mx-2">-</span>
      <Link
        href="/baz"
        className="text-purple-600 hover:text-purple-800 underline"
      >
        Baz (unstable_cache)
      </Link>
      <span className="mx-2">-</span>
      <Link href="/qux" className="text-red-600 hover:text-red-800 underline">
        Qux (use cache)
      </Link>
    </nav>
  );
}
