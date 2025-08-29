import Image from "next/image";
import { Suspense } from "react";
import { LoadingSpinner } from "../loading-spinner";
import DynamicComponent from "./dynamic-component";

export default async function Home({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <main className="flex flex-col gap-8">
      <Suspense
        fallback={
          <LoadingSpinner className="border-red-300 border-2 p-4 rounded-lg" />
        }
      >
        <DynamicComponent slug={slug} />
      </Suspense>
      <Image
        className="dark:invert"
        src="/icons/next.svg"
        alt="Next.js logo"
        width={180}
        height={38}
        priority
      />
      <p>Testing caching in Next.js 15.</p>
    </main>
  );
}
