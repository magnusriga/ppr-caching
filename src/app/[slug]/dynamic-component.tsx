import { headers } from "next/headers";

export default async function DynamicComponent({ slug }: { slug: string }) {
  console.log("Dynamic Component rendering");
  const nextHeaders = await headers();

  return (
    <div className="border-red-300 border-2 p-4 rounded-lg">
      Dynamic Component - slug: {slug} - Next host header:{" "}
      {nextHeaders.get("host")}
    </div>
  );
}
