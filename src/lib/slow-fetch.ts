import { unstable_cache } from "next/cache";

export const slowFetchCached = unstable_cache(slowFetch, [], {
  tags: ["slow-fetch"],
  revalidate: 600,
});

export async function slowFetch() {
  const promise = new Promise((resolve) =>
    setTimeout(() => resolve(true), 4000),
  ).then(() => {
    console.log("<-----> Slow fetch finished <----->");

    const randomNum = Math.random() * 100;
    const date = new Date().toISOString();

    return `${randomNum} | ${date}`;
  });

  const data = await promise;

  return data;
}
