export default async function QuxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log("<------> QuxLayout component rendering <---------->");

  return (
    <div style={{ border: "5px solid purple", padding: "10px" }}>
      <h2>Qux Layout</h2>
      {children}
    </div>
  );
}
