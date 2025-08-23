// import { headers } from "next/headers";
// import {
//   unstable_cacheLife as cacheLife,
//   unstable_cacheTag as cacheTag,
// } from "next/cache";

import Image from "next/image";

async function fetchPokemon(type: string) {
  console.log("Fetching pokemon data for type:", type);
  return fetch(`https://pokeapi.co/api/v2/pokemon/${type}`, {
    // The following options are needed for `useCache: true` in next.config.ts
    // and to revalidate the data every 10 minutes.
    next: { revalidate: 600 },
    // To forward cookies from the request, if needed:
    // headers: {
    //   cookie: headers().get("cookie") || "",
    // },
  }).then((res) => res.json());
}

export default async function Foo() {
  const pokemon = await fetchPokemon("ditto");

  if (pokemon?.name) {
    console.log("Fetched pokemon:", pokemon.name);
  }

  console.log("Foo component rendering");
  return (
    <>
      <h1>In foo subpath</h1>
      <hr />
      <p>Pokemon name: {pokemon.name}</p>
      <Image
        src={pokemon.sprites.front_default}
        alt={pokemon.name}
        width={200}
        height={200}
      />
    </>
  );
}
