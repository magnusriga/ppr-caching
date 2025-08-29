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

// const pokemon = {
//   name: "charizard",
//   weight: 905,
//   height: 17,
//   sprites: {
//     front_default:
//       "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png",
//   },
//   abilities: [
//     {
//       ability: {
//         name: "blaze",
//         url: "https://pokeapi.co/api/v2/ability/66/",
//       },
//       is_hidden: false,
//       slot: 1,
//     },
//     {
//       ability: {
//         name: "solar-power",
//         url: "https://pokeapi.co/api/v2/ability/94/",
//       },
//       is_hidden: true,
//       slot: 3,
//     },
//   ],
// };
