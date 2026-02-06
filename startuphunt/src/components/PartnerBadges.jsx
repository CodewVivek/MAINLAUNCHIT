'use client';

const BADGES = [
  { href: 'https://auraplusplus.com/projects/launchit', src: 'https://auraplusplus.com/images/badges/featured-on-light.svg', alt: 'Featured on Aura++' },
  { href: 'https://submitmysaas.com', src: 'https://submitmysaas.com/featured-badge.png', alt: 'Featured on SubmitMySaas' },
  { href: 'https://startupfa.me/s/launchit-1?utm_source=launchit.site', src: 'https://startupfa.me/badges/featured-badge-small.webp', alt: 'Launchit - Featured on Startup Fame' },
  { href: 'https://turbo0.com/item/launchit', src: 'https://img.turbo0.com/badge-listed-light.svg', alt: 'Listed on Turbo0' },
  { href: 'https://twelve.tools', src: 'https://twelve.tools/badge0-dark.svg', alt: 'Featured on Twelve Tools' },
  { href: 'https://wired.business', src: 'https://wired.business/badge0-dark.svg', alt: 'Featured on Wired Business' },
  { href: 'https://shipybara.com/projects/launchit', src: 'https://shipybara.com/images/badges/shipybara-badge-dark.svg', alt: 'Featured on Shipybara' },
  { href: 'https://www.superlaun.ch/products/1237', src: 'https://www.superlaun.ch/badge.png', alt: 'Featured on Super Launch' },
  { href: 'https://startupfa.st', src: 'https://startupfa.st/images/badges/powered-by-light.svg', alt: 'Powered by Startup Fast', title: 'Powered by Startup Fast' },
  { href: 'https://www.proofstories.io/directory/products/launchit/', src: 'https://www.proofstories.io/directory/badges/l/launchit.svg', alt: 'Launchit on ProofStories' },
  { href: 'https://startuptrusted.com?ref=launchit.site', src: 'https://startuptrusted.com/api/badge?type=featured&style=light', alt: 'Launchit on StartupTrusted', width: 240, height: 54 },
  { href: 'https://toolfame.com/item/launchit', src: 'https://toolfame.com/badge-light.svg', alt: 'Featured on toolfame.com', style: { height: '54px', width: 'auto' } },
  { href: 'https://dofollow.tools', src: 'https://dofollow.tools/badge/badge_light.svg', alt: 'Featured on Dofollow.Tools', width: 200, height: 54 },
  { href: 'https://huzzler.so/products/dJ4wBvrCx5/launchit-1?utm_source=huzzler_product_website&utm_medium=badge&utm_campaign=badge', src: 'https://huzzler.so/assets/images/embeddable-badges/featured.png', alt: 'Huzzler Embed Badge' },
];

export default function PartnerBadges() {
  return (
    <section className="py-10 bg-muted/30 border-t border-border">
      <div className="max-w-7xl mx-auto px-4">
        <p className="text-center text-sm text-muted-foreground mb-4">Featured on</p>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-muted/30 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-muted/30 to-transparent z-10 pointer-events-none" />
          <div className="overflow-x-auto no-scrollbar flex items-center gap-6 py-2 scroll-smooth">
            {BADGES.map((b, i) => (
              <a
                key={i}
                href={b.href}
                target="_blank"
                rel="noopener noreferrer"
                title={b.title || b.alt}
                className="flex-shrink-0 opacity-90 hover:opacity-100 transition-opacity"
              >
                <img
                  src={b.src}
                  alt={b.alt}
                  width={b.width || undefined}
                  height={b.height || undefined}
                  style={b.style}
                  className="h-12 w-auto max-h-[54px] object-contain"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
