# LaunchIT AI Backend

A powerful AI-powered backend service for the LaunchIT startup discovery platform, featuring semantic search, embeddings, and AI-generated project suggestions.

## 🚀 Features

- **Text Embeddings**: Generate vector embeddings for semantic understanding
- **Semantic Search**: Find projects using AI-powered similarity matching
- **Project Suggestions**: Get AI-generated advice for startup projects
- **Batch Processing**: Generate multiple embeddings efficiently
- **Caching**: Intelligent caching to reduce API calls and costs

## 🛠️ Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment variables:**
   Create a `.env` file in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3001
   ```

3. **Start the server:**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📡 API Endpoints

### Health Check
- `GET /health` - Basic health check
- `GET /api/health` - AI service health check

### AI Endpoints

#### Generate Embeddings
```http
POST /api/embeddings
Content-Type: application/json

{
  "text": "AI-powered startup platform"
}
```

**Response:**
```json
{
  "embedding": [0.1, 0.2, 0.3, ...],
  "success": true
}
```

#### Semantic Search
```http
POST /api/semantic-search
Content-Type: application/json

{
  "query": "startup platform",
  "projects": [...],
  "limit": 10
}
```

**Response:**
```json
{
  "results": [
    {
      "id": 1,
      "name": "Launchit",
      "similarity": 0.85,
      "searchScore": 0.85
    }
  ],
  "success": true
}
```

#### Project Suggestions
```http
POST /api/project-suggestions
Content-Type: application/json

{
  "projectData": {
    "name": "Project Name",
    "description": "Project description",
    "category_type": "Category",
    "tagline": "Project tagline"
  }
}
```

**Response:**
```json
{
  "suggestions": "AI-generated suggestions in JSON format",
  "success": true
}
```

#### Batch Embeddings
```http
POST /api/batch-embeddings
Content-Type: application/json

{
  "texts": [
    "Text 1",
    "Text 2",
    "Text 3"
  ]
}
```

**Response:**
```json
{
  "embeddings": [
    [0.1, 0.2, 0.3, ...],
    [0.4, 0.5, 0.6, ...],
    [0.7, 0.8, 0.9, ...]
  ],
  "success": true
}
```

## 🧪 Testing

Run the test suite to verify all endpoints:

```bash
node test-ai.js
```

This will test:
- ✅ Embedding generation
- ✅ Semantic search
- ✅ Project suggestions
- ✅ Batch embeddings

## 🔧 Configuration

### OpenAI Models
- **Embeddings**: `text-embedding-3-small` (default)
- **Chat**: `gpt-3.5-turbo` (default)

### Caching
- Embeddings are cached to reduce API calls
- Cache key: lowercase, trimmed text
- Memory-based caching (Map object)

## 💡 Usage Examples

### Frontend Integration

```javascript
// Generate embeddings for a project
const response = await fetch('/api/embeddings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: project.description })
});

const { embedding } = await response.json();

// Store embedding with project data
const projectWithEmbedding = {
  ...project,
  embedding
};
```

### Semantic Search Implementation

```javascript
// Search projects semantically
const searchResponse = await fetch('/api/semantic-search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: userSearchQuery,
    projects: allProjects,
    limit: 20
  })
});

const { results } = await searchResponse.json();
// results are sorted by similarity score
```

## 🚨 Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message description",
  "success": false
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad request (missing parameters)
- `500` - Internal server error

## 🔒 Security

- CORS enabled for cross-origin requests
- Input validation on all endpoints
- Rate limiting recommended for production
- API key stored securely in environment variables

## 📈 Performance

- Embedding caching reduces API calls
- Batch processing for multiple texts
- Async/await for non-blocking operations
- Efficient cosine similarity calculations

## 🚀 Deployment

### Render
The `render.yaml` file is configured for easy deployment on Render.

### Environment Variables
Ensure these are set in your deployment environment:
- `OPENAI_API_KEY`
- `PORT` (optional, defaults to 3001)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the LaunchIT platform. 