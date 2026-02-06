import { ExternalLink } from "lucide-react";
import Image from "next/image";


// ProjectCard component with VideoCard styling
const ProjectCard = ({ project, onProjectClick, utmSource = "normal" }) => {
    // Build UTM-tagged URL
    const getUtmUrl = (url) => {
        if (!url) return "";
        try {
            const baseUrl = new URL(url);
            baseUrl.searchParams.set("utm_source", utmSource);
            baseUrl.searchParams.set("utm_medium", "referral");
            baseUrl.searchParams.set("utm_campaign", "dashboard_feed");
            return baseUrl.toString();
        } catch {
            return url;
        }
    };

    const utmUrl = getUtmUrl(project.website_url);

    return (
        <div className="
    group cursor-pointer w-full overflow-hidden mb-2 sm:mb-1 border border-border rounded-lg bg-card sm:border-0 sm:bg-transparent"
            onClick={() => onProjectClick(project)}>
            {/* Thumbnail */}
            {/*<div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-3"></div>*/}
            <div className="rounded-2xl bg-background border border-border p-1 mb-3 shadow-sm">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                    {project.thumbnail_url ? (
                        <Image
                            src={project.thumbnail_url}
                            alt={project.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <div className="w-12 h-12 bg-muted-foreground/20 rounded-full"></div>
                        </div>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wider">
                        {project.category_type}
                    </div>
                </div>
            </div>


            <div className="flex gap-3 items-start px-2 sm:px-0">
                <div className="flex-shrink-0">
                    {project.logo_url ? (
                        <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-border shadow-sm">
                            <Image
                                src={project.logo_url}
                                alt={project.name}
                                width={36}
                                height={36}
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center border border-border">
                            <div className="w-5 h-5 bg-muted-foreground/30 rounded-full"></div>
                        </div>
                    )}
                </div>


                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-foreground font-semibold text-md leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            {project.name}
                        </h3>
                        {(project.last_relaunch_date || project.relaunched) && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-black uppercase rounded shrink-0">
                                🚀 Relaunched
                            </span>
                        )}
                        {utmUrl && (
                            <a
                                href={utmUrl}
                                target="_blank"
                                rel={project.is_sponsored ? "noopener noreferrer" : "noopener nofollow"}
                                className="text-muted-foreground hover:text-primary transition-colors"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        )}
                    </div>
                    <div className="text-muted-foreground text-md sm:text-md mb-1 line-clamp-2 leading-relaxed">
                        {project.tagline}
                    </div>
                </div>



            </div>
        </div >
    );
};

export default ProjectCard;
