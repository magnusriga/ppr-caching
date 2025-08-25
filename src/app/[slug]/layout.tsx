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
  return (
    <html lang="en">
      <body className={`${geist.variable} antialiased`}>
        <div className="p-4">
          <Suspense fallback={<div>Loading navigation...</div>}>
            <Nav />
          </Suspense>
          <Suspense>{children}</Suspense>
        </div>
      </body>
    </html>
  );
}
