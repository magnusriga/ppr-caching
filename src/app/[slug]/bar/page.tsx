"use cache";

// export default async function Page({ params }: PageProps<"/[slug]/bar">) {
export default async function Page() {
  // const { slug } = await params;
  return (
    <>
      <h1>Bar Page</h1>
      {/* <p>Slug: {slug}</p> */}
    </>
  );
}
