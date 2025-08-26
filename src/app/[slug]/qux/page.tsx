// import {
//   unstable_cacheLife as cacheLife,
//   unstable_cacheTag as cacheTag,
// } from "next/cache";

import { unstable_cache } from "next/cache";
import Image from "next/image";
import { Suspense } from "react";
import DynamicComponent from "../dynamic-component";
import Nav from "../nav";

interface PokemonAbility {
  ability: {
    name: string;
  };
}

interface PokemonSprites {
  front_default: string | null;
}

interface Pokemon {
  name: string;
  weight: number;
  height: number;
  sprites: PokemonSprites;
  abilities: PokemonAbility[];
}

const useCache = false;

const slowFetchCached = unstable_cache(slowFetch, [], {
  tags: ["slow-fetch"],
  revalidate: 600, // seconds
});

async function slowFetch() {
  const promise = new Promise((resolve) =>
    setTimeout(() => resolve(true), 4000),
  ).then(() => {
    console.log("<-----> Slow fetch finished <----->");

    const randomNum = Math.random() * 100;
    const date = new Date().toISOString();

    return `<----> SLOOOW DATA <----> ${randomNum} at ${date}`;
  });

  const data = await promise;

  return data;
}

/**
 * NOTE:
 * Even if `slowFetch` is not cached, the cached page is shown immediately,
 * then the full route is updated later when server rendering entire tree is
 * done.
 */

async function fetchCachedPokemon(type: string): Promise<Pokemon> {
  // "use cache: custom";
  // cacheTag("pokemon-use-cache", "pokemon-charizard");
  // cacheLife("frequent"); // 10 minutes.

  console.log("Fetching pokemon data for type:", type);
  let response: Response;

  if (useCache) {
    console.log("<-----> FETCHING using fetch cache with 'use cache' <----->");
    response = await fetch(`https://pokeapi.co/api/v2/pokemon/${type}`);
  } else {
    console.log(
      `<----> FETCHING using regular fetch cache, as third-party Redis cacheHandler does not yet support "use cache" <----->`,
    );
    response = await fetch(`https://pokeapi.co/api/v2/pokemon/${type}`, {
      next: {
        tags: ["pokemon-use-cache", "pokemon-charizard"],
        revalidate: 600,
      },
    });
  }

  return response.json();
}

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
  const slowData = await slowFetch();

  const date = Date.now();
  const randomNum = Math.random() * 100;

  return (
    <>
      <h1 className="text-3xl font-bold mb-4">
        <span>In qux subpath</span>
        {useCache ? (
          <span>
            (not using use cache, due to limited support from 3rd-party Redis
            cacheHandler)
          </span>
        ) : (
          <span>(using use cache)</span>
        )}
      </h1>
      <Suspense fallback={<div>Loading child component...</div>}>
        {/* <Nav /> */}
        <DynamicComponent slug="qux" />
      </Suspense>
      <div>
        Random number, generated late in render: {Math.random() * 10}
        Random number, generated first in component: {randomNum}
      </div>
      <div>
        Date, generated late in render: {new Date().toISOString()}
        Date, generated first in component: {date}
      </div>
      <div>Slow data (4s delay): {slowData}</div>
      <hr />
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
