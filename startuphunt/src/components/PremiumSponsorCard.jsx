import Image from "next/image";
import { Crown } from "lucide-react";

export default function PremiumSponsorCard({ project, onClick }) {
    if (!project) return null;

    // Build UTM-tagged URL
    const getUtmUrl = (url) => {
        if (!url) return "";
        try {
            const baseUrl = new URL(url);
            baseUrl.searchParams.set("utm_source", "spotlight");
            baseUrl.searchParams.set("utm_medium", "spotlight");
            baseUrl.searchParams.set("utm_campaign", "featured_grid");
            return baseUrl.toString();
        } catch {
            return url;
        }
    };

    const utmUrl = getUtmUrl(project.website_url);

    const handleCardClick = () => {
        if (utmUrl) {
            window.open(utmUrl, "_blank", "noopener,noreferrer");
        } else {
            onClick(project);
        }
    };

    return (
        <div
            onClick={handleCardClick}
            className="
        group relative rounded-3xl cursor-pointer overflow-hidden
        bg-gradient-to-br from-white via-blue-50/20 to-indigo-50/30
        dark:from-slate-950 dark:via-slate-900/50 dark:to-blue-900/20
        border border-blue-100/60 dark:border-blue-800/40
        p-6 transition-all duration-500
        hover:border-blue-400/50 hover:shadow-[0_20px_60px_-15px_rgba(59,130,246,0.15)]
        hover:-translate-y-2
      "
        >
            {/* Ambient Background Glow (Static) */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/30 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Soft Aurora Glow Background (Hover) */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-100 dark:bg-blue-900/40 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-100 dark:bg-purple-900/40 rounded-full blur-[100px]" />
            </div>

            {/* Premium badge */}
            <div className="absolute top-4 right-4 z-20">
                <span
                    className="
      inline-flex items-center gap-1.5
      px-2 py-1 rounded-full
      bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400
      text-black
      text-[10px] font-black uppercase tracking-wider
      shadow-lg shadow-yellow-500/30
      rotate-12 hover:rotate-0
      transition-transform duration-300
    "
                >
                    <Crown className="w-3 h-3 fill-black" />
                    Spotlight
                </span>
            </div>



            <div className="relative z-10 flex flex-col gap-6">

                {/* Screenshot */}
                <div
                    className="relative aspect-video rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5 bg-slate-50 shadow-sm transition-all duration-500 group-hover:shadow-xl group-hover:scale-[1.02]"
                >
                    <Image
                        src={project.thumbnail_url}
                        alt={project.name}
                        fill
                        priority
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Category Tag */}
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase tracking-wider z-20">
                        {project.category_type}
                    </div>
                </div>

                {/* Content */}
                <div className="flex flex-col justify-between flex-1">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            {project.logo_url && (
                                <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-100 dark:border-white/10 shadow-sm bg-white p-1">
                                    <img src={project.logo_url} alt="" className="w-full h-full object-contain" />
                                </div>
                            )}
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight">
                                {project.name}
                            </h2>
                        </div>

                        <p className="text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed font-medium text-sm">
                            {project.tagline}
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
