"use server";

import { revalidateTag } from "next/cache";

export async function actionRevalidateTag(tag: string) {
  console.log("Revalidating tag:", tag);
  revalidateTag(tag);
}
