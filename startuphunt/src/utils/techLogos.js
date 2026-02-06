/**
 * Utility to get logo URLs for common technology names.
 * Uses Simple Icons CDN (https://simpleicons.org/)
 * 
 * @param {string} techName - The name of the technology (e.g., "ReactJS", "Node.js")
 * @returns {string|null} - The URL to the logo or null if not found
 */
export const getTechLogo = (techName) => {
    if (!techName) return null;

    const name = techName.toLowerCase().trim();

    // Mapping for common technology names to Simple Icons slugs
    // If name matches slug, no mapping needed.
    const mapping = {
        'reactjs': 'react',
        'react js': 'react',
        'node.js': 'nodedotjs',
        'nodejs': 'nodedotjs',
        'nextjs': 'nextdotjs',
        'next.js': 'nextdotjs',
        'supabase': 'supabase',
        'tailwindcss': 'tailwindcss',
        'tailwind': 'tailwindcss',
        'typescript': 'typescript',
        'ts': 'typescript',
        'javascript': 'javascript',
        'js': 'javascript',
        'postgresql': 'postgresql',
        'postgres': 'postgresql',
        'mongodb': 'mongodb',
        'express': 'express',
        'firebase': 'firebase',
        'docker': 'docker',
        'aws': 'amazonaws',
        'github': 'github',
        'python': 'python',
        'django': 'django',
        'flask': 'flask',
        'vue': 'vuedotjs',
        'vue.js': 'vuedotjs',
        'angular': 'angular',
        'graphql': 'graphql',
        'redis': 'redis',
        'mysql': 'mysql',
        'php': 'php',
        'laravel': 'laravel',
        'ruby': 'ruby',
        'rails': 'rubyonrails',
        'swift': 'swift',
        'kotlin': 'kotlin',
        'flutter': 'flutter',
        'dart': 'dart',
        'golang': 'go',
        'go': 'go',
        'rust': 'rust',
        'prisma': 'prisma',
        'stripe': 'stripe',
        'dodo': 'dodopayments',
        'dodopayments': 'dodopayments',
        'framer motion': 'framer',
        'framer': 'framer',
        'shadcn/ui': 'shadcnui',
        'shadcn': 'shadcnui',
        'clerk': 'clerk',
        'resend': 'resend',
    };

    const slug = mapping[name] || name.replace(/[^a-z0-9]/g, '');

    // Return Simple Icons CDN URL
    return `https://cdn.simpleicons.org/${slug}`;
};
