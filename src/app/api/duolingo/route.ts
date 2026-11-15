import { NextResponse } from "next/server";
import { getDuolingoStreak } from "@/lib/duolingo";

export const dynamic = "force-dynamic";

/** Always-live Duolingo streak, fetched by the About page after it loads. */
export async function GET() {
  const streak = await getDuolingoStreak({ fresh: true });
  return NextResponse.json(
    { streak },
    { status: streak ? 200 : 502, headers: { "Cache-Control": "no-store" } },
  );
}
