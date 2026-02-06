// Test file for AI endpoints
// Run with: node test-ai.js

const BASE_URL = 'https://launchit-ai-backend.onrender.com';

// Test data
const testProject = {
  name: "Launchit - Startup Discovery Platform",
  description: "A platform for discovering and connecting with amazing new startups. Users can browse projects, get insights, and connect with founders.",
  category_type: "Platform",
  tagline: "Discover the next big thing in startups"
};

const testProjects = [
  {
    name: "Launchit",
    description: "Startup discovery platform",
    category_type: "Platform",
    tagline: "Discover amazing startups",
    embedding: [0.1, 0.2, 0.3, 0.4, 0.5] // Mock embedding
  },
  {
    name: "TaskMaster",
    description: "AI-powered task management",
    category_type: "Productivity",
    tagline: "Get more done with AI",
    embedding: [0.2, 0.3, 0.4, 0.5, 0.6] // Mock embedding
  }
];

// Test functions
async function testEmbeddings() {
  try {
    const response = await fetch(`${BASE_URL}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: "AI-powered startup platform" })
    });

    const result = await response.json();
    console.log('✅ Embeddings test:', result.success ? 'PASSED' : 'FAILED');
    if (result.embedding) {
      console.log(`   Generated embedding with ${result.embedding.length} dimensions`);
    }
  } catch (error) {
    console.log('❌ Embeddings test FAILED:', error.message);
  }
}

async function testSemanticSearch() {
  try {
    const response = await fetch(`${BASE_URL}/api/semantic-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: "startup platform",
        projects: testProjects,
        limit: 5
      })
    });

    const result = await response.json();
    console.log('✅ Semantic search test:', result.success ? 'PASSED' : 'FAILED');
    if (result.results) {
      console.log(`   Found ${result.results.length} results`);
    }
  } catch (error) {
    console.log('❌ Semantic search test FAILED:', error.message);
  }
}

async function testProjectSuggestions() {
  try {
    const response = await fetch(`${BASE_URL}/api/project-suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectData: testProject })
    });

    const result = await response.json();
    console.log('✅ Project suggestions test:', result.success ? 'PASSED' : 'FAILED');
    if (result.suggestions) {
      console.log('   Generated AI suggestions');
    }
  } catch (error) {
    console.log('❌ Project suggestions test FAILED:', error.message);
  }
}

async function testBatchEmbeddings() {
  try {
    const response = await fetch(`${BASE_URL}/api/batch-embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texts: [
          "AI startup platform",
          "Productivity tools",
          "Innovation hub"
        ]
      })
    });

    const result = await response.json();
    console.log('✅ Batch embeddings test:', result.success ? 'PASSED' : 'FAILED');
    if (result.embeddings) {
      console.log(`   Generated ${result.embeddings.length} embeddings`);
    }
  } catch (error) {
    console.log('❌ Batch embeddings test FAILED:', error.message);
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Testing LaunchIT AI Backend...\n');

  await testEmbeddings();
  await testSemanticSearch();
  await testProjectSuggestions();
  await testBatchEmbeddings();

  console.log('\n✨ Testing complete!');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests }; 