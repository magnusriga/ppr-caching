// import { headers } from "next/headers";

export default async function ChildComponent({ slug }: { slug: string }) {
  // const next_headers = await headers();
  console.log("Child Component rendering");
  return (
    <>
      <h1>Child Component - Slug: {slug}</h1>
      <hr />
      {/* <div>Child Component - Headers from next: {next_headers}</div> */}
    </>
  );
}
