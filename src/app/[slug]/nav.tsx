import { headers } from "next/headers";
import Link from "next/link";
import { connection } from "next/server";

async function RandomComponent() {
  await connection();
  return (
    <div className="border-red-300 border-2 p-4 rounded-lg">
      Random number: {Math.random() * 10} | Dat: {new Date().toISOString()}
    </div>
  );
}

export default async function Nav() {
  const nextHeaders = await headers();
  // const nextHeaders = null;

  return (
    <nav className="border-red-300 border-2 p-4 flex gap-4">
      <RandomComponent />
      <div>Dynamic Component - Navigation: </div>
      <Link
        href="/"
        className="text-blue-600 hover:text-blue-800 underline"
        // prefetch={false}
      >
        Home with headers: {nextHeaders ? "true" : "false"}
      </Link>
      <span className="mx-2">-</span>
      <Link
        href="/foo"
        className="text-green-600 hover:text-green-800 underline"
        // prefetch={false}
      >
        Foo (fetch with tags)
      </Link>
      <span className="mx-2">-</span>
      <Link
        href="/bar"
        className="text-orange-600 hover:text-orange-800 underline"
        // prefetch={false}
      >
        Bar (static)
      </Link>
      <span className="mx-2">-</span>
      <Link
        href="/baz"
        className="text-purple-600 hover:text-purple-800 underline"
        // prefetch={false}
      >
        Baz (unstable_cache)
      </Link>
      <span className="mx-2">-</span>
      <Link
        href="/qux"
        className="text-red-600 hover:text-red-800 underline"
        // prefetch={false}
      >
        Qux (use cache)
      </Link>
    </nav>
  );
}
