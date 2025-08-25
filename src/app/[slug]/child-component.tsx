export default async function ChildComponent({ slug }: { slug: string }) {
  console.log("Child Component rendering");
  return (
    <>
      <h1 className="text-3xl font-bold mb-4">
        Child Component - Slug: {slug}
      </h1>
      <hr />
      {/* <div>Child Component - Headers from next: {next_headers}</div> */}
    </>
  );
}
