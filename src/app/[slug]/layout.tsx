import { Geist } from "next/font/google";
import { Suspense } from "react";
import Nav from "./nav";
import "../globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export async function generateStaticParams() {
  return [{ slug: "fooz" }];
}

export default function SlugLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log("<------> RENDERING LAYOUT <---------->");
  return (
    <html lang="en">
      <body className={`${geist.variable} antialiased`}>
        <div className="p-4">
          <div>
            Random number, should not change due to caching:{" "}
            {Math.random() * 10}
          </div>
          <div>
            Date, should not change due to caching: {new Date().toISOString()}
          </div>
          <Suspense fallback={<div>Loading navigation...</div>}>
            <Nav />
            {/* <div>Navigation Placeholder</div> */}
          </Suspense>
          <Suspense>{children}</Suspense>
        </div>
      </body>
    </html>
  );
}
