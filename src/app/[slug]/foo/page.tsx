import Image from "next/image";

interface PokemonSprites {
  front_default: string | null;
}

interface Pokemon {
  name: string;
  sprites: PokemonSprites;
}

async function fetchPokemon(type: string): Promise<Pokemon> {
  console.log("Fetching pokemon data for type:", type);
  return fetch(`https://pokeapi.co/api/v2/pokemon/${type}`, {
    // Revalidate every 10 minutes.
    next: {
      revalidate: 600,
      tags: ["pokemon", `pokemon-${type}`],
    },
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
    </>
  );
}
