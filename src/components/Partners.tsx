const PARTNERS = [
  { name: "Colosseum", href: "https://www.colosseum.com/", logo: "/colosseum.png" },
  { name: "Press Start", href: "https://pressstart.capital/", logo: "/press-start.png" },
  { name: "Sanctor", href: "https://www.sanctor.com/", logo: "/sanctor.png" },
  { name: "MagicBlock", href: "https://www.magicblock.xyz/", logo: "/magicblock.avif" },
];

export default function Partners() {
  return (
    <section className="partners">
      <div className="section-inner">
        <h2>Partners &amp; Investors</h2>
        <div className="partners-grid">
          {PARTNERS.map((partner) => (
            <a key={partner.name} href={partner.href} target="_blank" rel="noopener noreferrer">
              <img src={partner.logo} alt={partner.name} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
