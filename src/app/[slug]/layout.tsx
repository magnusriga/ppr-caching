import { Suspense } from "react";
import Nav from "./nav";

export async function generateStaticParams() {
  return [{ slug: "fooz" }];
}

export default async function SlugLayout({ children }: LayoutProps<"/[slug]">) {
  return (
    <div className="p-4">
      <Suspense fallback={<div>Loading navigation...</div>}>
        <Nav />
      </Suspense>
      <Suspense>{children}</Suspense>
    </div>
  );
}
