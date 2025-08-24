import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Get the tag to revalidate from the request body
    const body = await request.json();
    const { tag } = body;

    if (!tag) {
      return NextResponse.json({ error: "Tag is required" }, { status: 400 });
    }

    console.log(`[REVALIDATE API] Revalidating tag: ${tag}`);

    // Revalidate the specified tag
    revalidateTag(tag);

    return NextResponse.json({
      message: `Successfully revalidated tag: ${tag}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[REVALIDATE API] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to revalidate cache",
      },
      { status: 500 },
    );
  }
}

// GET route for easy testing
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tag = url.searchParams.get("tag");

  if (!tag) {
    return NextResponse.json(
      {
        error: "Tag is required. Use: /api/revalidate?tag=pokemon",
        examples: [
          "/api/revalidate?tag=pokemon",
          "/api/revalidate?tag=pokemon-ditto",
          "/api/revalidate?tag=pokemon-unstable",
          "/api/revalidate?tag=pokemon-pikachu",
        ],
      },
      { status: 400 },
    );
  }

  console.log(`[REVALIDATE API] GET - Revalidating tag: ${tag}`);

  try {
    revalidateTag(tag);

    return NextResponse.json({
      message: `Successfully revalidated tag: ${tag}`,
      timestamp: new Date().toISOString(),
      availableTags: [
        "pokemon", // General pokemon tag (foo route)
        "pokemon-ditto", // Specific ditto tag (foo route)
        "pokemon-unstable", // General unstable_cache tag (baz route)
        "pokemon-pikachu", // Specific pikachu tag (baz route)
      ],
      usage: {
        GET: "Use ?tag=tagname in URL",
        POST: 'Send {"tag": "tagname"} in request body',
      },
    });
  } catch (error) {
    console.error("[REVALIDATE API] GET Error:", error);
    return NextResponse.json(
      {
        error: "Failed to revalidate cache",
      },
      { status: 500 },
    );
  }
}
