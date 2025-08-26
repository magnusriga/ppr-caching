import Image from "next/image";
import { Suspense } from "react";
import DynamicComponent from "./dynamic-component";

export default async function Home({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <main className="flex flex-col gap-8">
      <Suspense fallback={<div>Loading...</div>}>
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
