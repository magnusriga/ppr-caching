// import { Suspense } from "react";
// import { LoadingSpinner } from "@/app/loading-spinner";
// import DynamicComponent from "../dynamic-component";

export default async function Page({ params }: PageProps<"/[slug]/bar">) {
  // export default async function Page() {
  const { slug } = await params;
  return (
    <>
      <h1 className="text-3xl font-bold mb-4">Bar Page, slug: {slug}</h1>
      {/* <h1 className="text-3xl font-bold mb-4">Bar Page</h1> */}
      <hr className="my-4" />
      {/* <Suspense */}
      {/*   fallback={ */}
      {/*     <LoadingSpinner className="border-red-300 border-2 p-4 rounded-lg" /> */}
      {/*   } */}
      {/* > */}
      {/*   <DynamicComponent slug="qux" /> */}
      {/* </Suspense> */}
    </>
  );
}
