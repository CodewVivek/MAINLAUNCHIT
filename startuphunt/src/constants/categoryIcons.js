/**
 * Shared category display metadata (name, description, icon) for sidebar, dashboard Explore by Category, etc.
 * Keys are normalized lowercase; DB category_type may be "ai", "AI & Machine Learning", etc.
 */
import {
  Bot,
  Code2,
  Briefcase,
  BarChart3,
  Palette,
  Megaphone,
  Heart,
  Gamepad2,
  UtensilsCrossed,
  Sparkles,
  MessageCircle,
  Shield,
  TrendingUp,
  Plane,
  BookOpen,
  Grid3X3,
  Video,
  Shirt,
  Server,
  Calculator,
  Wallet,
  FileSpreadsheet,
  Rocket,
  Globe,
  Cloud,
  Wrench,
  TestTube,
  Plug,
  Users,
  Mail,
  Link2,
  Target,
  Stethoscope,
  Dna,
  Activity,
  Brain,
  Smile,
  Leaf,
  Flame,
  Film,
  FolderOpen,
  GitBranch,
  Container,
  Eye,
  Pencil,
  Calendar,
  Clock,
  LayoutGrid,
} from "lucide-react";

const CATEGORY_META = {
  "ai": { name: "AI & Machine Learning", desc: "AI-powered tools to automate work, enhance creativity, and build smarter products.", icon: Bot },
  "ai & machine learning": { name: "AI & Machine Learning", desc: "AI-powered tools to automate work, enhance creativity, and build smarter products.", icon: Bot },

  "devtools": { name: "Developer Tools", desc: "Frameworks, APIs, and utilities to ship faster and build reliable software.", icon: Code2 },
  "developer tools": { name: "Developer Tools", desc: "Frameworks, APIs, and utilities to ship faster and build reliable software.", icon: Code2 },

  "productivity": { name: "Productivity", desc: "Apps and tools to manage tasks, stay focused, and get more done every day.", icon: TrendingUp },

  "design": { name: "Design Tools", desc: "Design resources and tools to craft beautiful interfaces and brand experiences.", icon: Palette },
  "design tools": { name: "Design Tools", desc: "Design resources and tools to craft beautiful interfaces and brand experiences.", icon: Palette },

  "marketing": { name: "Marketing", desc: "Grow your audience, optimize campaigns, and turn visitors into customers.", icon: Megaphone },

  "e-commerce": { name: "E-commerce", desc: "Platforms and tools to launch, manage, and scale online businesses.", icon: BarChart3 },

  "education": { name: "Education", desc: "Learning platforms and edtech tools for skill-building and knowledge sharing.", icon: BookOpen },

  "health & fitness": { name: "Health & Fitness", desc: "Wellness, fitness, and health-focused products for better daily living.", icon: Heart },

  "finance": { name: "Finance", desc: "Fintech tools for payments, investing, budgeting, and business finance.", icon: Briefcase },

  "social": { name: "Social Media", desc: "Tools to grow online presence, build communities, and engage audiences.", icon: MessageCircle },
  "social media": { name: "Social Media", desc: "Tools to grow online presence, build communities, and engage audiences.", icon: MessageCircle },

  "entertainment": { name: "Entertainment", desc: "Creative platforms for content, media, gaming, and interactive experiences.", icon: Sparkles },

  "travel": { name: "Travel", desc: "Apps and services for trip planning, exploration, and travel experiences.", icon: Plane },

  "food & drink": { name: "Food & Drink", desc: "Foodtech products and beverage startups shaping how we eat and drink.", icon: UtensilsCrossed },

  "lifestyle": { name: "Lifestyle", desc: "Products that improve everyday life, habits, and personal well-being.", icon: Heart },

  "business": { name: "Business", desc: "Tools for operations, growth, automation, and running modern companies.", icon: Briefcase },

  "communication": { name: "Communication", desc: "Messaging, collaboration, and customer support tools for teams.", icon: MessageCircle },

  "analytics": { name: "Analytics", desc: "Track performance, analyze data, and gain insights to make better decisions.", icon: BarChart3 },

  "security": { name: "Security", desc: "Privacy, cybersecurity, and protection tools for apps and businesses.", icon: Shield },

  "gaming": { name: "Gaming", desc: "Games and platforms delivering immersive and interactive experiences.", icon: Gamepad2 },

  "other": { name: "Other", desc: "Discover unique startups and experimental projects across all categories.", icon: Grid3X3 },

  "seo": { name: "SEO", desc: "Search optimization tools to improve rankings, traffic, and online visibility.", icon: BarChart3 },

  "gen-ai": { name: "Generative AI", desc: "AI tools for creating images, videos, text, and other creative content.", icon: Sparkles },

  "fintech": { name: "Fintech", desc: "Financial tools for payments, investing, analytics, and money management.", icon: Briefcase },

  "saas": { name: "SaaS", desc: "Software products built to help teams automate work and grow faster.", icon: Cloud },

  "video-editing": { name: "Video Editing", desc: "Edit, enhance, and produce video content.", icon: Video },
  "video editing": { name: "Video Editing", desc: "Edit, enhance, and produce video content.", icon: Video },

  "fashiontech": { name: "Fashiontech", desc: "Fashion and retail technology startups.", icon: Shirt },

  "web-proxy": { name: "Web Proxy", desc: "Proxy, VPN, and network privacy tools.", icon: Server },

  "accounting": { name: "Accounting", desc: "Accounting software and bookkeeping tools.", icon: Calculator },

  "financial-planning": { name: "Financial Planning", desc: "Planning, budgeting, and financial strategy tools.", icon: Wallet },
  "financial planning": { name: "Financial Planning", desc: "Planning, budgeting, and financial strategy tools.", icon: Wallet },

  "budgeting": { name: "Budgeting", desc: "Budgeting and expense tracking apps.", icon: Wallet },
  "investing": { name: "Investing", desc: "Investing platforms and portfolio tools.", icon: TrendingUp },
  "invoicing": { name: "Invoicing", desc: "Invoicing and billing tools.", icon: FileSpreadsheet },
  "payroll": { name: "Payroll", desc: "Payroll and compensation software.", icon: Briefcase },
  "tax-prep": { name: "Tax Preparation", desc: "Tax preparation and filing tools.", icon: Calculator },

  "launch-platform": { name: "Launch Platforms", desc: "Platforms to launch and promote products.", icon: Rocket },
  "platform-addons": { name: "Product Add-ons", desc: "Add-ons and extensions for platforms.", icon: LayoutGrid },

  "adtech": { name: "AdTech", desc: "Advertising technology and ad management.", icon: Target },
  "crm": { name: "CRM", desc: "Customer relationship management platforms.", icon: Users },
  "email-marketing": { name: "Email Marketing", desc: "Email campaigns and automation.", icon: Mail },
  "ads": { name: "Ad Management", desc: "Ad creation and campaign management.", icon: Megaphone },
  "affiliate": { name: "Affiliate Marketing", desc: "Affiliate and referral tools.", icon: Link2 },

  "community": { name: "Online Communities", desc: "Community and forum platforms.", icon: Users },
  "creatoreconomy": { name: "Creator Economy", desc: "Tools for creators and influencers.", icon: Sparkles },
  "community-management": { name: "Community Management", desc: "Moderation and community tools.", icon: Users },

  "ai-coding": { name: "AI Coding", desc: "AI-powered coding assistants.", icon: Code2 },
  "ai-writing": { name: "AI Writing", desc: "AI writing and content tools.", icon: Pencil },
  "computer-vision": { name: "Computer Vision", desc: "Image and video recognition AI.", icon: Eye },
  "ai-platforms": { name: "AI APIs & Hosting", desc: "AI APIs and model hosting.", icon: Bot },

  "healthtech": { name: "HealthTech", desc: "Healthcare technology.", icon: Stethoscope },
  "medtech": { name: "MedTech", desc: "Medical devices and diagnostics.", icon: Heart },
  "biotech": { name: "BioTech", desc: "Biotechnology and life sciences.", icon: Dna },
  "fitness": { name: "Fitness", desc: "Fitness and workout apps.", icon: Activity },
  "mental-health": { name: "Wellness & Mental Health", desc: "Mental health and wellness tools.", icon: Brain },
  "health-trackers": { name: "Health Trackers", desc: "Health data and wearables.", icon: Activity },
  "femtech": { name: "FemTech", desc: "Women's health technology.", icon: Heart },
  "eldertech": { name: "ElderTech", desc: "Technology for older adults.", icon: Smile },

  "graphic": { name: "Graphic Design", desc: "Graphic design software.", icon: Palette },
  "animation": { name: "Animation", desc: "Animation and motion tools.", icon: Film },
  "asset-management": { name: "Digital Asset Management", desc: "Assets and media libraries.", icon: FolderOpen },

  "code-collab": { name: "Code Collaboration", desc: "Code review and pair programming.", icon: Users },
  "devops": { name: "DevOps", desc: "DevOps and deployment platforms.", icon: GitBranch },
  "ci-cd": { name: "CI/CD", desc: "Continuous integration and delivery.", icon: TestTube },
  "api": { name: "API", desc: "API testing and management.", icon: Plug },
  "containers": { name: "Containers", desc: "Container orchestration.", icon: Container },
  "cloud": { name: "Cloud", desc: "Cloud infrastructure and platforms.", icon: Cloud },
  "iot": { name: "IoT", desc: "Internet of things and hardware.", icon: Wrench },

  "project-mgmt": { name: "Project Management", desc: "Project and task management.", icon: LayoutGrid },
  "remote-workforce": { name: "Remote Work", desc: "Remote team and workforce tools.", icon: Users },
  "team-collab": { name: "Team Collaboration", desc: "Team chat and collaboration.", icon: Users },
  "time-tracking": { name: "Time Tracking", desc: "Time and productivity tracking.", icon: Clock },
  "calendar": { name: "Scheduling & Calendar", desc: "Calendar and scheduling apps.", icon: Calendar },

  "greentech": { name: "GreenTech", desc: "Sustainability and green technology.", icon: Leaf },
  "climatetech": { name: "ClimateTech", desc: "Climate and environment technology.", icon: Flame },
};

/** Returns the Lucide icon component for a category (for sidebar, etc.). */
export function getCategoryIcon(categoryType) {
  if (!categoryType) return Grid3X3;
  const key = String(categoryType).toLowerCase().trim();
  return CATEGORY_META[key]?.icon ?? Grid3X3;
}

/** Returns { name, desc, icon } for a category (for dashboard cards, etc.). */
export function getCategoryDisplay(categoryType) {
  if (!categoryType) return { name: "Other", desc: "Discover more startups.", icon: Grid3X3 };
  const key = String(categoryType).toLowerCase().trim();
  return CATEGORY_META[key] || { name: categoryType, desc: "Discover startups and tools in this category.", icon: Grid3X3 };
}
