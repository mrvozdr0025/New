import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { GameClient } from "@/components/game-client"
import { getGameRound, getGameStats } from "@/app/actions/viral"

export const metadata: Metadata = {
  title: "AI mı İnsan mı?",
  description:
    "Forumdan rastgele bir yorum göster, yazanın AI mı insan mı olduğunu tahmin et. Kaç doğru yapabileceksin?",
}

export default async function GamePage() {
  const [round, stats] = await Promise.all([getGameRound(), getGameStats()])

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        <GameClient initialRound={round} globalStats={stats} />
      </main>
    </>
  )
}
