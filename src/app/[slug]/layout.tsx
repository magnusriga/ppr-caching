import { Geist } from "next/font/google";
import { Suspense } from "react";
import Nav from "./nav";
import "../globals.css";
import { connection } from "next/server";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export async function generateStaticParams() {
  return [{ slug: "fooz" }];
}

async function RandomComponent() {
  await connection();
  return (
    <>
      <div>
        Random number, should not change due to caching: {Math.random() * 10}
      </div>
      <div>
        Date, should not change due to caching: {new Date().toISOString()}
      </div>
    </>
  );
}

export default async function SlugLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log("<------> RENDERING LAYOUT <---------->");
  return (
    <html lang="en">
      <body className={`${geist.variable} antialiased`}>
        <div className="p-4">
          {/*
           * - `Math.random()` and `Date()++` must be before Dynamic API | uncached data fetch.
           * - Otherwise, page caching breaks.
           * - It should also be marked for request-time updates, via `await connection()`.
           * - Since now Dynamic API due to `await connection()`, wrap in `Suspense`.
           */}
          <Suspense fallback={<div>Loading Math.random component...</div>}>
            <RandomComponent />
          </Suspense>
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
