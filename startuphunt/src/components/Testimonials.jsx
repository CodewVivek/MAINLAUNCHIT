import React from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
    {
        id: 10,
        name: "Ajju",
        role: "@AjjuKota",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ajju",
        content: "This is great",
        source: "x",
    },
    {
        id: 1,
        name: "Local Mama",
        role: "@localmama4u",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mama",
        content:
            "Really I thank you mama I got first 100 viewers from you’re site we launched on launchit wishing you all the best ❤️",
        source: "x",
    },
    {
        id: 2,
        name: "Aaroh Bhardwaj",
        role: "Peerlist",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aaroh",
        content:
            "checked out the platform, specifically for AI community, you are definitely nailing this one. Cheers✌️",
        source: "peerlist",
    },
    {
        id: 3,
        name: "Alex Cloudstar",
        role: "@alexcloudstar",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
        content:
            "Yess, Launchit is a gem for getting those early eyeballs on your product. Seen some cool stuff pop up there recently.",
        source: "x",
    },
    {
        id: 4,
        name: "Saranshh",
        role: "@saranshhardaha",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Saranshh",
        content:
            "Solid tools! 'LaunchIt' looks like a great spot to get early feedback ",
        source: "x",
    },
    {
        id: 5,
        name: "Godnon Dsilva",
        role: "@godnondsilva",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Godnon",
        content:
            "Bookmarking this to add my product! 🔥 Looks amazing btw! 🔥🔥",
        source: "x",
    },
    {
        id: 6,
        name: "Sophie",
        role: "@Sophie_991x",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie",
        content:
            "Finally a place where builders can focus on shipping without all the extra noise.",
        source: "x",
    },
    {
        id: 7,
        name: "stefan",
        role: "@thestefanl",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Stefan",
        content: "doing the right things man",
        source: "x",
    },
    {
        id: 8,
        name: "Brandon Szymanski",
        role: "@Brandonszymansk",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Brandon",
        content: "This is a great idea. I’ll have to get on the platform.",
        source: "x",
    },
    {
        id: 9,
        name: "Kelvin Igbodo",
        role: "Peerlist",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kelvin",
        content: "Great stuff with Launchit.",
        source: "peerlist",
    },
    {
        id: 10,
        name: "Masatoshi Koeda",
        role: "@mabikuso_dumppp",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ajju",
        content: "We've launched! What a great product!",
        source: "x",
    },
];

const XLogo = ({ className }) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
        <path
            fill="currentColor"
            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
        />
    </svg>
);

const PeerlistLogo = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
        <path
            d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"
            fill="currentColor"
        />
    </svg>
);

const TestimonialCard = ({ testimonial }) => (
    <div className="flex-shrink-0 w-[260px] md:w-[320px] p-5 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition mx-3 md:mx-5">
        <Quote className="w-5 h-5 text-muted-foreground mb-4 opacity-50" />

        <p className="text-sm leading-relaxed text-muted-foreground mb-5 line-clamp-4">
            {testimonial.content}
        </p>

        <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden border border-border bg-muted">
                    <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-full h-full object-cover"
                    />
                </div>

                <div>
                    <h4 className="text-sm font-medium leading-tight">
                        {testimonial.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                        {testimonial.role}
                    </p>
                </div>
            </div>

            {testimonial.source === "peerlist" ? (
                <PeerlistLogo className="w-4 h-4 text-muted-foreground opacity-50" />
            ) : (
                <XLogo className="w-3 h-3 text-muted-foreground opacity-50" />
            )}
        </div>
    </div>
);

const MarqueeRow = ({ items, direction = "left", speed = 40 }) => {
    const doubled = [...items, ...items, ...items];

    return (
        <div className="flex overflow-hidden py-4 select-none">
            <motion.div
                className="flex"
                animate={{
                    x: direction === "left" ? ["0%", "-33.33%"] : ["-33.33%", "0%"],
                }}
                transition={{
                    duration: speed,
                    repeat: Infinity,
                    ease: "linear",
                }}
            >
                {doubled.map((t, idx) => (
                    <TestimonialCard key={`${t.id}-${idx}`} testimonial={t} />
                ))}
            </motion.div>
        </div>
    );
};

const Testimonials = () => {
    const topRow = testimonials.slice(0, 4);
    const bottomRow = testimonials.slice(4, 8);

    return (
        <section className="pt-20 pb-10 bg-background border-t border-border relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 mb-10 text-center">
                <h2 className="text-xl font-medium mb-2">Loved by builders</h2>

                <p className="text-muted-foreground text-sm max-w-xl mx-auto">
                    Makers using Launchit to ship faster.
                </p>

                <div className="mt-5 flex justify-center items-center gap-2">
                    <span className="text-muted-foreground text-sm">Contact us on</span>

                    <a
                        href="https://x.com/launchit__"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 transition"
                    >
                        <XLogo className="w-3.5 h-3.5" />
                    </a>
                </div>
            </div>

            <div className="relative">
                <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10" />
                <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10" />

                <div className="space-y-4">
                    <MarqueeRow items={topRow} direction="right" speed={40} />
                    <MarqueeRow items={bottomRow} direction="left" speed={45} />
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
