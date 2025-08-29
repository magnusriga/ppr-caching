"use client";

import { actionRevalidateTag } from "../actions";

export function ButtonRevalidateRh({ tag }: { tag: string }) {
  return (
    <button
      className="rounded bg-blue-500 text-white px-4 py-2 hover:bg-blue-600 cursor-pointer"
      type="button"
      onClick={async () => {
        const res = await fetch(`/api/revalidate?tag=${tag}`);
        const data = await res.json();
        console.log("Revalidate response:", data);
        alert(`Revalidate response: ${JSON.stringify(data)}`);
      }}
    >
      Revalidate "slow-fetch" tag with Route Handler
    </button>
  );
}

export function ButtonRevalidateSa({ tag }: { tag: string }) {
  return (
    <button
      className="rounded bg-blue-500 text-white px-4 py-2 hover:bg-blue-600 cursor-pointer"
      type="button"
      onClick={async () => {
        await actionRevalidateTag(tag);
        console.log("Revalidated with SA");
        alert(`Revalidated with SA, navigate back and forth to see new data.`);
      }}
    >
      Revalidate "slow-fetch" tag with Server Action
    </button>
  );
}
