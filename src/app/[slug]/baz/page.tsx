import { unstable_cache } from "next/cache";
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

// Test `unstable_cache`.
const fetchCachedPokemon = unstable_cache(
  async (type: string): Promise<Pokemon> => {
    console.log("Fetching pokemon data for type (unstable_cache):", type);
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${type}`);
    return response.json();
  },
  ["pokemon-unstable"], // Cache key.
  {
    tags: ["pokemon-unstable", "pokemon-pikachu"],
    revalidate: 600, // 10 minutes.
  },
);

export default async function Baz() {
  console.log("Baz component rendering");

  const pokemon = await fetchCachedPokemon("pikachu");

  if (pokemon?.name) {
    console.log("Fetched pokemon (unstable_cache):", pokemon.name);
  }

  return (
    <>
      <h1>In baz subpath (using unstable_cache)</h1>
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
        <ul>
          {pokemon.abilities?.map((ability) => (
            <li key={ability.ability.name}>{ability.ability.name}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
