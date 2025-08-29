import Image from "next/image";
import { Suspense } from "react";
import { actionRevalidateTag } from "@/app/actions";
import { LoadingSpinner } from "@/app/loading-spinner";
import { fetchCachedPokemon } from "@/lib/get-pokemon";
import { slowFetch, slowFetchCached } from "@/lib/slow-fetch";
import { ButtonRevalidateRh, ButtonRevalidateSa } from "../client-component";
import DynamicComponent from "../dynamic-component";

const useCache = false;

/**
 * NOTE:
 * Even if `slowFetch` is not cached, the cached page is shown immediately,
 * then the full route is updated later when server rendering entire tree is
 * done.
 */

export default async function Qux() {
  console.log("<------> Qux component rendering <---------->");

  const pokemon = await fetchCachedPokemon("charizard");

  if (pokemon?.name) {
    console.log("Fetched pokemon:", pokemon.name);
  }

  /**
   * - REQUIREMENT: `Math.random()` | `Date.now()` AFTER uncached data | Dynamic API call.
   * - Otherwise, page caching breaks.
   * - Next.js considers `slowFetch` "uncached data".
   * - ERROR: `Date.now()` | `Math.random()` before `slowFetch` line.
   * - ERROR: `slowFetchCached` here, and no other Dynamic API below.
   * - Get early error on build, with `cacheComponents: true`. <-- Gives heads up.
   * - OK with `Date.now()` | `Math.random()` AFTER Dynamic API | uncached data.
   */
  // const slowData = await slowFetch();
  // const slowData = "slowData static";
  // const slowData = await slowFetch();
  const slowData = await slowFetchCached();
  // const slowData2 = await slowFetchCached();

  // const date = Date.now();
  // const randomNum = Math.random() * 100;

  return (
    <>
      <h1 className="text-3xl font-bold mb-4">
        In qux subpath{" "}
        {useCache ? (
          <span>(with use cache)</span>
        ) : (
          <span>(without use cache)</span>
        )}
      </h1>
      <Suspense
        fallback={
          <LoadingSpinner className="border-red-300 border-2 p-4 rounded-lg" />
        }
      >
        <DynamicComponent slug="qux" />
      </Suspense>
      <hr className="my-4" />
      {/* <Suspense fallback={<LoadingSpinner className="inline-block ml-2" />}> */}
      <div className="flex gap-4">
        <ButtonRevalidateRh tag="slow-fetch" /> |
        <ButtonRevalidateSa tag="slow-fetch" />
      </div>
      {/* </Suspense> */}
      <hr className="my-4" />
      {/* <div>Random number, generated late in render: {randomNum}</div> */}
      {/* <div>Date, generated late in render: {date}</div> */}
      {/* <hr className="my-4" /> */}
      <div className="text-blue-600">
        Slow data, notes (assuming PPR):
        <ul className="list-disc list-inside">
          <li>
            If data is not cached, then on reload:
            <br />
            Random number below will equal cached page for 4 seconds,
            <br />
            before becoming new data from server render when entire route is
            done re-rendering.
            <br />
            Because, without data caching, entire route becomes dynamic,
            <br />
            only using the cached page as fallback when re-rendering route.
          </li>
          <li>
            If route did not use Dynamic API, then the cached page would not be
            updated until revalidated.
          </li>
          <li>
            If data IS cached, then cached page is always shown and not updated
            until revalidated,
            <br />
            regardless of Dynamic API usage in route.
          </li>
          <li>
            Because, PPR only updates component with Dynamic API,
            <br />
            evend though it re-renders entire route server-side to ready the
            Dynamic API component.
          </li>
        </ul>
        <br />
        {slowData}
      </div>
      <hr className="my-4" />
      <p>Pokemon name: {pokemon.name}</p>
      <p>Weight: {pokemon.weight}</p>
      <p>Height: {pokemon.height}</p>
      {pokemon.sprites?.front_default ? (
        <Image
          src={pokemon.sprites.front_default}
          alt={pokemon.name}
          width={200}
          height={200}
        />
      ) : (
        <div className="w-[200px] h-[200px] bg-gray-200 flex items-center justify-center">
          <p>No image available</p>
        </div>
      )}
      <div>
        <strong>Abilities:</strong>
        <ul className="list-disc list-inside">
          {pokemon.abilities?.map((ability) => (
            <li key={ability.ability.name}>{ability.ability.name}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
