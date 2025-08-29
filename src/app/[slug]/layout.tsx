import { Geist } from "next/font/google";
import { Suspense } from "react";
import Nav from "./nav";
import "../globals.css";
// import { connection } from "next/server";
// import { fetchCachedPokemon } from "../../lib/get-pokemon";
import { LoadingSpinner } from "../loading-spinner";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export async function generateStaticParams() {
  return [{ slug: "fooz" }];
}

// async function RandomComponent() {
//   await connection();
//   return (
//     <div className="border-red-300 border-2 p-4 rounded-lg">
//       Random number: {Math.random() * 10} | Dat: {new Date().toISOString()}
//     </div>
//   );
// }

export default async function SlugLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log("<------> RENDERING LAYOUT <---------->");

  // const fetchedPokemon = await fetchCachedPokemon("mewtwo");

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
          {/* <Suspense */}
          {/*   fallback={ */}
          {/*     <div className="border-red-300 border-2 p-4 rounded-lg"> */}
          {/*       Loading Math.random component... */}
          {/*     </div> */}
          {/*   } */}
          {/* > */}
          {/*   <RandomComponent /> */}
          {/* </Suspense> */}
          <Suspense
            fallback={
              <LoadingSpinner className="border-red-300 border-2 p-4 rounded-lg" />
            }
          >
            <Nav />
            {/* <div>Navigation Placeholder</div> */}
          </Suspense>
          {/* <Suspense */}
          {/*   fallback={ */}
          {/*     <div className="border-yellow-300 border-2 p-4 rounded-lg"> */}
          {/*       Loading layout children... */}
          {/*     </div> */}
          {/*   } */}
          {/* > */}
          {children}
          {/* </Suspense> */}
        </div>
      </body>
    </html>
  );
}
