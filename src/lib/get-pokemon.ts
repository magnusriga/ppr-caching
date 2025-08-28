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

export async function fetchCachedPokemon(type: string): Promise<Pokemon> {
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
        tags: ["fetch-pokemon-lib", `pokemon-${type}`],
        revalidate: 600,
      },
    });
  }

  return response.json();
}
