export default async function Page({ params }: PageProps<"/[slug]/bar">) {
  const { slug } = await params;
  return (
    <>
      <h1>Bar Page</h1>
      <p>Slug: {slug}</p>
    </>
  );
}
