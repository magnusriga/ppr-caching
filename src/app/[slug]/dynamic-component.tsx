import { headers } from "next/headers";
import { connection } from "next/server";

async function RandomComponent() {
  await connection();
  return (
    <div className="border-red-300 border-2 p-4 rounded-lg">
      Random number: {Math.random() * 10} | Dat: {new Date().toISOString()}
    </div>
  );
}

export default async function DynamicComponent({ slug }: { slug: string }) {
  console.log("Dynamic Component rendering");
  const nextHeaders = await headers();

  return (
    <div className="border-red-300 border-2 p-4 rounded-lg">
      <RandomComponent />
      Dynamic Component - slug: {slug} - Next host header:{" "}
      {nextHeaders.get("host")}
    </div>
  );
}
