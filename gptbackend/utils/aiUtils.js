// Cachepreventduplicates for embeddings to reduce API calls//
const embeddingsCache = new Map(); 

// OpenAI client setup
let openaiClient = null;

async function getOpenAIClient() {
    if (!openaiClient) {
        const OpenAI = (await import('openai')).default;
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openaiClient;
}

// Generate embeddings for text -caching to preventduplicates
async function generateEmbedding(text) {
    try {
        const cacheKey = text.toLowerCase().trim();
        if (embeddingsCache.has(cacheKey)) {
            return embeddingsCache.get(cacheKey);
        }

        const response = await getOpenAIClient().embeddings.create({
            model: "text-embedding-3-small",
            input: text,
        });

        const embedding = response.data[0].embedding;

        embeddingsCache.set(cacheKey, embedding);
        return embedding;
    } catch (error) {
        // Error generating embedding
        throw new Error('Failed to generate embedding');
    }
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
        throw new Error('Vectors must have same length');
    }
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (normA * normB);
}

// 🔍 Semantic search with embeddings
async function semanticSearch(query, projects, limit = 10) {
    try {
        const queryEmbedding = await generateEmbedding(query);

        const scoredProjects = projects.map(project => {
            let similarity = 0;
            const projectText = [
                project.title || '',
                project.description || '',
                project.category || '',
                project.tags ? project.tags.join(' ') : ''
            ].join(' ').trim();

            if (projectText && project.embedding) {
                similarity = cosineSimilarity(queryEmbedding, project.embedding);
            }

            return { ...project, similarity, searchScore: similarity };
        });

        scoredProjects.sort((a, b) => b.similarity - a.similarity);
        return scoredProjects.slice(0, limit);
//sort(return top n) and slice
    } catch (error) {
        // Error in semantic search
        throw new Error('Semantic search failed');
    }
}

// Content moderation removed for merge

// Content moderation functions removed for merge

// Content moderation functions removed for merge

// Content moderation functions removed for merge

export {
    generateEmbedding,
    cosineSimilarity,
    semanticSearch
}; 