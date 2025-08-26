import { headers } from "next/headers";

export default async function DynamicComponent({ slug }: { slug: string }) {
  console.log("Dynamic Component rendering");
  const nextHeaders = await headers();

  return (
    <>
      <h1 className="text-3xl font-bold mb-4">
        Dynamic Component - Slug: {slug}
      </h1>
      <hr />
      <div>
        Dynamic Component - Host header from next: {nextHeaders.get("host")}
      </div>
    </>
  );
}
