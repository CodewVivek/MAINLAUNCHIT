// CategoryOptions.jsx

const categoryOptions = [
  {
    label: "💸 Finance & Fintech",
    options: [
      { value: "fintech", label: "💸 Fintech" },
      { value: "accounting", label: "📊 Accounting Software" },
      { value: "budgeting", label: "📉 Budgeting Apps" },
      { value: "credit", label: "💳 Credit Score Tools" },
      { value: "financial-planning", label: "📅 Financial Planning" },
      { value: "fundraising", label: "🤝 Fundraising Resources" },
      { value: "investing", label: "📈 Investing Platforms" },
      { value: "invoicing", label: "🧾 Invoicing Tools" },
      { value: "money-transfer", label: "💱 Money Transfer" },
      { value: "neobanks", label: "🏦 Neobanks" },
      { value: "online-banking", label: "🌐 Online Banking" },
      { value: "payroll", label: "💼 Payroll Software" },
      { value: "retirement", label: "👵 Retirement Planning" },
      { value: "savings", label: "💰 Savings Apps" },
      { value: "startup-finance", label: "🚀 Startup Financial Planning" },
      { value: "startup-incorporation", label: "📜 Startup Incorporation" },
      { value: "stock-trading", label: "📊 Stock Trading Platforms" },
      { value: "tax-prep", label: "🧮 Tax Preparation" },
      { value: "treasury", label: "🏛️ Treasury Management" },
    ],
  },
  {
    label: "☁️ SaaS & Platforms",
    options: [
      { value: "saas", label: "☁️ SaaS" },
      { value: "platform-addons", label: "🧩 Product Add-ons" },
      { value: "launch-platform", label: "🚀 Launch Platforms" },
    ],
  },
  {
    label: "📈 Marketing & Sales",
    options: [
      { value: "adtech", label: "📈 AdTech" },
      { value: "crm", label: "🧠 CRM Platforms" },
      { value: "email-marketing", label: "📬 Email Marketing" },
      { value: "ads", label: "📢 Ad Management" },
      { value: "social-media-scheduling", label: "🗓️ Social Media Scheduling" },
      { value: "seo", label: "🔍 SEO & Analytics" },
      { value: "affiliate", label: "🔗 Affiliate Marketing" },
    ],
  },
  {
    label: "👥 Social & Community",
    options: [
      { value: "social", label: "👥 Social Media" },
      { value: "community", label: "🌐 Online Communities" },
      { value: "creatoreconomy", label: "🎨 Creator Economy Tools" },
      { value: "community-management", label: "👩‍💻 Community Management" },
    ],
  },
  {
    label: "🧠 Artificial Intelligence",
    options: [
      { value: "ai", label: "🤖 AI" },
      { value: "gen-ai", label: "🧠 Generative AI Tools" },
      { value: "ai-coding", label: "💻 AI Coding Assistants" },
      { value: "ai-writing", label: "✍️ AI Writing Tools" },
      { value: "computer-vision", label: "👁️ Computer Vision" },
      { value: "ai-platforms", label: "🧪 AI APIs & Hosting" },
    ],
  },
  {
    label: "🩺 Health & Fitness",
    options: [
      { value: "healthtech", label: "🏥 HealthTech" },
      { value: "medtech", label: "💊 MedTech" },
      { value: "biotech", label: "🧬 BioTech" },
      { value: "fitness", label: "🏋️ Fitness Apps" },
      { value: "mental-health", label: "🧘 Wellness & Mental Health" },
      { value: "health-trackers", label: "📟 Health Data Trackers" },
      { value: "femtech", label: "👩 FemTech" },
      { value: "eldertech", label: "👵 ElderTech" },
    ],
  },
  {
    label: "🎨 Design & Creative",
    options: [
      { value: "design", label: "🎨 UI/UX Design Tools" },
      { value: "graphic", label: "🖌️ Graphic Design Software" },
      { value: "animation", label: "🎞️ Animation Tools" },
      { value: "video-editing", label: "🎥 Video Editing" },
      { value: "asset-management", label: "🗂️ Digital Asset Management" },
    ],
  },
  {
    label: "⚙️ Engineering & Development",
    options: [
      { value: "devtools", label: "⚙️ Dev Tools" },
      { value: "code-collab", label: "👨‍💻 Code Collaboration" },
      { value: "devops", label: "🔁 DevOps Platforms" },
      { value: "ci-cd", label: "🧪 CI/CD Tools" },
      { value: "api", label: "🔌 API Testing & Management" },
      { value: "containers", label: "📦 Container Orchestration" },
      { value: "cloud", label: "☁️ Cloud Platforms" },
      { value: "iot", label: "📡 IoT" },
    ],
  },
  {
    label: "💼 Work & Productivity",
    options: [
      { value: "productivity", label: "✅ Productivity Tools" },
      { value: "project-mgmt", label: "📋 Project Management" },
      { value: "remote-workforce", label: "🧑‍💻 Remote Workforce Tools" },
      { value: "team-collab", label: "👥 Team Collaboration" },
      { value: "time-tracking", label: "⏱️ Time Tracking Tools" },
      { value: "calendar", label: "📆 Scheduling & Calendar Apps" },
    ],
  },
  {
    label: "🌱 Sustainability & Climate",
    options: [
      { value: "greentech", label: "🌱 GreenTech" },
      { value: "climatetech", label: "🌎 ClimateTech" },
    ],
  },
  {
    label: "🚚 Logistics & Mobility",
    options: [
      { value: "logistics", label: "🚚 Logistics" },
      { value: "mobility", label: "🛴 Mobility" },
      { value: "traveltech", label: "✈️ TravelTech" },
    ],
  },
  {
    label: "🛍️ Ecommerce & Retail",
    options: [
      { value: "ecommerce", label: "🛍️ E-commerce" },
      { value: "store-builders", label: "🧱 Store Builders" },
      { value: "checkout", label: "💳 Checkout & Payments" },
      { value: "dropshipping", label: "📦 Dropshipping Tools" },
      { value: "product-sourcing", label: "🔍 Product Sourcing" },
      { value: "inventory", label: "📦 Inventory Management" },
    ],
  },
  {
    label: "🔒 Security & Infrastructure",
    options: [
      { value: "cybersecurity", label: "🔒 Cybersecurity" },
      { value: "hardware", label: "🛠️ Hardware Startups" },
      { value: "security", label: "🛡️ Security Tools" },
    ],
  },
  {
    label: "🎮 Entertainment & Media",
    options: [
      { value: "gaming", label: "🎮 Gaming" },
      { value: "entertainment", label: "🎬 Entertainment" },
      { value: "edutainment", label: "📚🎮 Edutainment" },
    ],
  },
  {
    label: "📚 Education",
    options: [{ value: "edtech", label: "🎓 EdTech" }],
  },
  {
    label: "🏛️ Legal & Professional Services",
    options: [
      { value: "legaltech", label: "⚖️ LegalTech" },
      { value: "hrtech", label: "👔 HRTech" },
    ],
  },
  {
    label: "⛓️ Blockchain & Web3",
    options: [
      { value: "blockchain", label: "⛓️ Blockchain" },
      { value: "web3", label: "🌐 Web3" },
      { value: "decentralized", label: "🌀 Decentralized Tech" },
      { value: "crypto-wallets", label: "💼 Crypto Wallets" },
      { value: "nft", label: "🖼️ NFT Platforms" },
      { value: "dao", label: "🗳️ DAO Tools" },
      { value: "defi", label: "💹 DeFi Platforms" },
    ],
  },
  {
    label: "🌾 Agri & Industrial Tech",
    options: [
      { value: "agritech", label: "🌾 AgriTech" },
      { value: "constructiontech", label: "🚧 ConstructionTech" },
      { value: "spacetech", label: "🚀 SpaceTech" },
      { value: "marinetech", label: "⚓ MarineTech" },
    ],
  },
  {
    label: "👗 Lifestyle & Consumer",
    options: [
      { value: "fashiontech", label: "👗 FashionTech" },
      { value: "pettech", label: "🐶 PetTech" },
      { value: "kids", label: "🧸 KidsTech" },
      { value: "wellness", label: "🧘 WellnessTech" },
    ],
  },
  {
    label: "🧪 Emerging Technologies",
    options: [
      { value: "nanotech", label: "🔬 NanoTech" },
      { value: "quantum", label: "⚛️ QuantumTech" },
      { value: "regtech", label: "📜 RegTech" },
      { value: "veterantech", label: "🎖️ VeteranTech" },
      { value: "civictech", label: "🏛️ CivicTech" },
      { value: "creatortech", label: "🎨 CreatorTech" },
    ],
  },
];

export default categoryOptions;
