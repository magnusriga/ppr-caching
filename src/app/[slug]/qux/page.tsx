// import {
//   unstable_cacheLife as cacheLife,
//   unstable_cacheTag as cacheTag,
// } from "next/cache";
import Image from "next/image";

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

// Test `use cache`.
// Tags: ["pokemon-use-cache", "pokemon-charizard"],
// Lifetime: 600 seconds (10 minutes).
async function fetchCachedPokemon(type: string): Promise<Pokemon> {
  // "use cache: custom";
  // cacheTag("pokemon-use-cache", "pokemon-charizard");
  // cacheLife("frequent"); // 10 minutes.

  console.log("Fetching pokemon data for type:", type);
  console.log(
    `Using regular fetch cache, as third-party Redis cacheHandler does not yet support "use cache"`,
  );
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${type}`, {
    next: { tags: ["pokemon-use-cache", "pokemon-charizard"], revalidate: 600 },
  });
  return response.json();
}

export default async function Qux() {
  console.log("Qux component rendering");

  const pokemon = await fetchCachedPokemon("charizard");

  if (pokemon?.name) {
    console.log("Fetched pokemon:", pokemon.name);
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-4">
        In qux subpath (not using use cache, due to limited support from
        3rd-party Redis cacheHandler)
      </h1>
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
