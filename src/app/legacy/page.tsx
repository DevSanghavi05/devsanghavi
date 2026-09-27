import type { Metadata } from "next";
import { AnimatedCircle } from "@/components/AnimatedCircle";
import TargetCursor from "@/components/TargetCursor";
import "@/components/TargetCursor.css";
import { SmoothScroll } from "@/components/SmoothScroll";
import { PongGame } from "@/components/PongGame";

export const metadata: Metadata = {
  // Old design kept for reference — must not compete with the live site in search.
  robots: { index: false, follow: false },
};

export default function LegacyPage() {
  return (
    <main className="min-h-screen bg-[#fdfdfd] text-zinc-900 selection:bg-zinc-200 selection:text-zinc-900">
      <SmoothScroll />
      <TargetCursor targetSelector=".cursor-target" spinDuration={3} />
      <PongGame />
      <AnimatedCircle />
    </main>
  );
}
