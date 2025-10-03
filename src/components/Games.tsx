import GameCard from "./GameCard";

const GAMES = [
  {
    title: "Slimecoin.io",
    description: "Real-money io games. Fully onchain, non-custodial, with instant payouts.",
    image: "/slimecoin.png",
    video: "/slimecoin_preview.mp4",
    links: [
      { label: "Play Now", href: "https://slimecoin.io" },
      { label: "Twitter", href: "https://x.com/slimecoinio" },
    ],
  },
];

export default function Games() {
  return (
    <section className="games">
      <div className="section-inner">
        <h2>Our Games</h2>
        <div className="games-grid">
          {GAMES.map((game) => (
            <GameCard key={game.title} {...game} />
          ))}
        </div>
      </div>
    </section>
  );
}
