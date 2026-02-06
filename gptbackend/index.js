import express from "express";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import { createClient } from "@supabase/supabase-js";
// fetch is built-in to Node.js 18+
import cors from "cors";
import cron from "node-cron";
import { sendTemplateEmail, EMAIL_TEMPLATES } from "./utils/emailService.js";
import { semanticSearch, generateEmbedding } from "./utils/aiUtils.js";

dotenv.config();

const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'OPENAI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error("Missing environment variables:", missingEnvVars);
  process.exit(1);
}
console.log("Environment variables verified.");

const app = express();
app.use(express.json({ limit: '10mb' }));

// Request Logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(cors({
  origin: [
    'https://launchit.site',
    'https://launchitsite.netlify.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Simple in-memory rate limiting
const requestCounts = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 50; // 50 requests per 15 minutes

const rateLimitMiddleware = (req, res, next) => {
  const clientId = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!requestCounts.has(clientId)) {
    requestCounts.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  } else {
    const clientData = requestCounts.get(clientId);
    if (now > clientData.resetTime) {
      clientData.count = 1;
      clientData.resetTime = now + RATE_LIMIT_WINDOW;
    } else if (clientData.count >= MAX_REQUESTS_PER_WINDOW) {
      return res.status(429).json({
        error: true,
        message: 'Rate limit exceeded. Please try again later.'
      });
    } else {
      clientData.count++;
    }
  }
  next();
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// --- SECURITY MIDDLEWARE START ---

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized: No token provided' });

  // Extract token (remove 'Bearer ' if present)
  const token = authHeader.replace('Bearer ', '');

  // Verify token with Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  // Attach user to request for downstream use
  req.user = user;
  next();
};

const verifyAdmin = async (req) => {
  // Rely on requireAuth having run first
  if (!req.user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', req.user.id)
    .single();

  return profile?.role === 'admin';
};

// --- SECURITY MIDDLEWARE END ---

// Fast HTML logo extraction (no API calls, instant)
function extractLogoFromHTML(html, microlinkData) {
  // Try Microlink metadata first (if available)
  if (microlinkData?.logo_url) return microlinkData.logo_url;
  if (microlinkData?.og_image) return microlinkData.og_image;

  // Extract from HTML meta tags (instant, no API)
  const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1];
  if (ogImage) return ogImage;

  const twitterImage = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i)?.[1];
  if (twitterImage) return twitterImage;

  // Try apple-touch-icon
  const appleTouchIcon = html.match(/<link\s+rel=["']apple-touch-icon["']\s+href=["']([^"']+)["']/i)?.[1];
  if (appleTouchIcon) return appleTouchIcon;

  return null;
}

// Fast metadata-only function (no screenshot - saves 3-5s)
async function generateMicrolinkMetadata(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const metadataResponse = await fetch(
      `https://api.microlink.io?url=${encodeURIComponent(url)}&meta=true`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);
    const metadataData = await metadataResponse.json();

    return {
      logo_url: metadataData.data?.logo?.url || metadataData.data?.image?.url || null,
      og_image: metadataData.data?.image?.url || null
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Microlink metadata timeout');
    }
    return { logo_url: null, og_image: null };
  }
}

// Background screenshot generation (optional, non-blocking)
async function generateScreenshotInBackground(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for background

    const response = await fetch(
      `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true&width=1200&height=675&format=png&meta=false`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);
    const data = await response.json();
    return data.data?.screenshot?.url || null;
  } catch (error) {
    // Silent fail - screenshot is optional
    return null;
  }
}

app.post("/generatelaunchdata", rateLimitMiddleware, async (req, res) => {
  const { url } = req.body;
  console.log(`Generating launch data for URL: ${url}`);

  if (!url || !url.startsWith("http")) {
    console.error("Invalid URL provided:", url);
    return res.status(400).json({ error: "Invalid or missing URL" });
  }

  try {
    // STEP 1: Fetch HTML and Microlink metadata in parallel (0-4s)
    console.log("Step 1: Fetching HTML and Microlink metadata...");
    const htmlController = new AbortController();
    const htmlTimeoutId = setTimeout(() => htmlController.abort(), 4000);

    const [htmlResponse, microlinkMetadata] = await Promise.all([
      fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: htmlController.signal
      }).then(r => {
        clearTimeout(htmlTimeoutId);
        return r.text();
      }).catch((err) => {
        console.warn(`HTML fetch failed or timed out: ${err.message}`);
        clearTimeout(htmlTimeoutId);
        return "";
      }),
      generateMicrolinkMetadata(url) // Fast, metadata only (no screenshot)
    ]);

    console.log("Step 1 complete. Metadata found:", !!microlinkMetadata);

    const html = htmlResponse;

    // STEP 2: Extract logo from HTML (instant, no API)
    const logoUrl = extractLogoFromHTML(html, microlinkMetadata);

    // Extract Open Graph image for thumbnail
    const ogImage = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1] || microlinkMetadata.og_image;

    // STEP 2.5: Clean HTML for OpenAI (Reduced tokens = Faster processing)
    const cleanHTML = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "")
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "")
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "")
      .replace(/\s+/g, " ")
      .slice(0, 3500);

    // STEP 3: Optimized OpenAI prompt (shorter = faster)
    const prompt = `Extract JSON from this website. Be accurate:
{
  "name": "product name",
  "tagline": "short tagline",
  "description": "2-3 sentences description",
  "category": "most relevant category slug (e.g. 'saas', 'ai', 'fintech', 'devtools', 'marketing', 'productivity', 'ecommerce', 'healthtech', 'design', 'social', 'edtech', 'web3')",
  "features": ["3-5 key features"],
  "built_with": ["tech stack"],
  "tags": ["3-5 tags"],
  "social_links": ["urls"],
  "other_links": ["urls"]
}
HTML: ${cleanHTML}`;

    // Call OpenAI
    console.log(`Calling OpenAI gpt-4o-mini...`);
    let gptresponse;
    try {
      gptresponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 500,
        response_format: { "type": "json_object" }
      }, { timeout: 20000 }); // Bumped to 20s to prevent unnecessary retries
      console.log("OpenAI response received.");
    } catch (openaiError) {
      console.error("OpenAI Error:", openaiError);
      return res.status(500).json({
        err: true,
        message: "OpenAI API failed: " + openaiError.message
      });
    }

    // Parse result
    let result;
    try {
      const rawContent = gptresponse.choices[0].message.content.trim();
      const jsonContent = rawContent.replace(/```json\s*|\s*```/g, '').trim();
      result = JSON.parse(jsonContent);
    } catch (e) {
      // Fallback: create basic data from URL
      result = {
        name: url.replace(/https?:\/\/(www\.)?/, '').split('/')[0].replace(/\./g, ' ').toUpperCase(),
        tagline: "Innovative solution for modern needs",
        description: "This product offers cutting-edge features designed to solve real-world problems.",
        category: "startup ecosystem",
        features: ["User-friendly", "Scalable", "Secure"],
        social_links: [],
        other_links: []
      };
    }

    // Return FAST (2-3s total)
    const responseData = {
      name: result.name || "",
      website_url: url,
      tagline: result.tagline || "",
      description: result.description || "",
      category: result.category || "",
      links: [...(result.social_links || []), ...(result.other_links || [])],
      features: result.features || [],
      built_with: result.built_with || [],
      tags: result.tags || [],
      logo_url: logoUrl,
      thumbnail_url: ogImage, // Use OG image, generate screenshot in background
      success: true
    };

    res.json(responseData);

    // Generate screenshot in background (optional, don't block)
    generateScreenshotInBackground(url).then(screenshotUrl => {
      // Could store in cache/DB and update via WebSocket if needed
      // Or just use OG image which is usually good enough
    }).catch(() => { });

  } catch (err) {
    console.error("Generate launch data error:", err);
    res.status(500).json({ error: true, message: err.message });
  }
});

// ==================== AI FEATURES ENDPOINTS ====================

// 2. SEMANTIC SEARCH ENDPOINT
app.post('/api/search/semantic', rateLimitMiddleware, async (req, res) => {
  try {
    const { query, limit = 10, filters = {} } = req.body;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: true,
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Get all projects from database
    let { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'active');

    if (fetchError) {
      throw new Error('Failed to fetch projects: ' + fetchError.message);
    }

    if (!projects || projects.length === 0) {
      return res.json({
        success: true,
        results: [],
        total: 0,
        query: query
      });
    }

    // Generate embeddings for projects that don't have them
    const projectsWithEmbeddings = await Promise.all(
      projects.map(async (project) => {
        if (!project.embedding) {
          try {
            const projectText = [
              project.title || '',
              project.description || '',
              project.category || '',
              project.tags ? project.tags.join(' ') : ''
            ].join(' ').trim();

            if (projectText) {
              const embedding = await generateEmbedding(projectText);

              // Store embedding in database
              await supabase
                .from('projects')
                .update({ embedding: embedding })
                .eq('id', project.id);

              return { ...project, embedding };
            }
          } catch (error) {
            // Silently continue if embedding generation fails
          }
        }
        return project;
      })
    );

    // Perform semantic search
    const searchResults = await semanticSearch(query, projectsWithEmbeddings, limit);

    // Apply additional filters if provided
    let filteredResults = searchResults;

    if (filters.category) {
      filteredResults = filteredResults.filter(project =>
        project.category === filters.category
      );
    }

    if (filters.tags && filters.tags.length > 0) {
      filteredResults = filteredResults.filter(project =>
        project.tags && filters.tags.some(tag => project.tags.includes(tag))
      );
    }

    res.json({
      success: true,
      results: filteredResults,
      total: filteredResults.length,
      query: query,
      searchTime: new Date().toISOString()
    });

  } catch (error) {
    // Semantic search error occurred
    res.status(500).json({
      error: true,
      message: 'Semantic search failed: ' + error.message
    });
  }
});

// 3. GENERATE EMBEDDINGS FOR EXISTING PROJECTS
app.post('/api/embeddings/generate', rateLimitMiddleware, async (req, res) => {
  try {
    const { projectId, projectText } = req.body;

    if (!projectId) {
      return res.status(400).json({
        error: true,
        message: 'Project ID is required'
      });
    }

    // Get project data
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (fetchError || !project) {
      return res.status(404).json({
        error: true,
        message: 'Project not found'
      });
    }

    // Use provided projectText or generate from project data
    let textForEmbedding = projectText;
    if (!textForEmbedding) {
      textForEmbedding = [
        project.name || '',
        project.description || '',
        project.tagline || '',
        project.category_type || '',
        project.tags ? project.tags.join(' ') : ''
      ].filter(text => text.trim()).join(' ').trim();
    }

    if (!textForEmbedding) {
      return res.status(400).json({
        error: true,
        message: 'Project has no text content for embedding'
      });
    }

    const embedding = await generateEmbedding(textForEmbedding);

    // Update project with embedding
    const { error: updateError } = await supabase
      .from('projects')
      .update({ embedding: embedding })
      .eq('id', projectId);

    if (updateError) {
      throw new Error('Failed to update project: ' + updateError.message);
    }

    res.json({
      success: true,
      message: 'Embedding generated successfully',
      projectId: projectId,
      projectName: project.name
    });

  } catch (error) {
    // Embedding generation error occurred
    res.status(500).json({
      error: true,
      message: 'Embedding generation failed: ' + error.message
    });
  }
});

// 4. GET MODERATION QUEUE (Admin only)
app.get('/api/moderation/queue', rateLimitMiddleware, requireAuth, async (req, res) => {
  try {
    if (!(await verifyAdmin(req))) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status = 'pending_review', limit = 50 } = req.query;

    const { data: records, error } = await supabase
      .from('moderation')
      .select(`
        *,
        profiles:user_id (id, full_name, username, email),
        projects:project_id (id, name, slug)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Fetch unread count for pending reviews
    const { count: unreadCount } = await supabase
      .from('moderation')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending_review');

    res.json({
      success: true,
      records: records || [],
      unreadCount: unreadCount || 0
    });
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

// 5. UPDATE MODERATION STATUS (Admin only)
app.post('/api/moderation/status', rateLimitMiddleware, requireAuth, async (req, res) => {
  try {
    if (!(await verifyAdmin(req))) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { projectId, status, notes = '' } = req.body;

    if (!projectId || !status) {
      return res.status(400).json({ error: true, message: 'Project ID and status are required' });
    }

    // Get the moderation record
    const { data: record, error: fetchError } = await supabase
      .from('moderation')
      .select(`
        *,
        profiles:user_id (id, full_name, username, email),
        projects:project_id (id, name, slug)
      `)
      .eq('id', projectId) // recordId passed as projectId in frontend
      .single();

    if (fetchError || !record) {
      return res.status(404).json({ error: true, message: 'Moderation record not found' });
    }

    // Handle relaunch request special logic
    if (status === 'approved' && record.content_type === 'relaunch_request') {
      const { project_id, moderation_result } = record;

      if (project_id && moderation_result?.current_data) {
        // Update the project with its relaunch data
        const updateData = {
          ...moderation_result.current_data,
          last_relaunched_at: new Date().toISOString(),
          created_at: new Date().toISOString(), // Boost visibility by moving to top
          updated_at: new Date().toISOString()
        };

        const { error: projectUpdateError } = await supabase
          .from('projects')
          .update(updateData)
          .eq('id', project_id);

        if (projectUpdateError) {
          console.error('Error updating project for relaunch:', projectUpdateError);
          throw new Error('Failed to update project data');
        }

        // Send Launch Success Email (for relaunch)
        if (record.profiles?.email) {
          await sendTemplateEmail(record.profiles.email, EMAIL_TEMPLATES.LAUNCH_SUCCESS, {
            user_name: record.profiles.full_name || record.profiles.username || 'Builder',
            project_name: record.projects?.name || 'your project',
            project_url: `https://launchit.site/launches/${record.projects?.slug}`,
            current_year: new Date().getFullYear()
          });
        }

        // Create notification for the user
        await supabase.from('notifications').insert([{
          user_id: record.user_id,
          type: 'relaunch_approved',
          title: '🚀 Relaunch Approved!',
          message: `Your project has been successfully relaunched with your ${moderation_result.relaunch_type || 'recent'} updates.`,
          read: false,
          created_at: new Date().toISOString()
        }]);
      }
    } else if (status === 'rejected' && record.content_type === 'relaunch_request') {
      // Notify user of rejection
      await supabase.from('notifications').insert([{
        user_id: record.user_id,
        type: 'relaunch_rejected',
        title: '❌ Relaunch Request Rejected',
        message: `Your relaunch request was rejected. Admin notes: ${notes || 'No reason provided.'}`,
        read: false,
        created_at: new Date().toISOString()
      }]);
    } else if (status === 'feedback' && record.content_type === 'relaunch_request') {
      // Notify user of feedback
      await supabase.from('notifications').insert([{
        user_id: record.user_id,
        type: 'relaunch_feedback',
        title: '💬 Feedback on your Relaunch Request',
        message: `An admin has left feedback on your major update request: "${notes}"`,
        read: false,
        created_at: new Date().toISOString()
      }]);
    }

    // Update moderation record
    const { error: updateError } = await supabase
      .from('moderation')
      .update({
        status,
        admin_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: `Content ${status} successfully`
    });
  } catch (error) {
    console.error('Error updating moderation status:', error);
    res.status(500).json({ error: true, message: error.message });
  }
});

// 6. GET USER NOTIFICATIONS (User only)
app.get('/api/notifications/:userId', rateLimitMiddleware, requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Strict ID check
    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json({ success: true, notifications: notifications || [] });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// 7. MARK NOTIFICATION AS READ
app.put('/api/notifications/:notificationId/read', rateLimitMiddleware, requireAuth, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message });
  }
});

// 8. GET ADMIN NOTIFICATIONS (Admin only) - REMOVED FOR MERGE
// app.get('/api/admin/notifications', rateLimitMiddleware, async (req, res) => { ... });

// 9. GET MODERATION QUEUE WITH NOTIFICATIONS (Admin only) - REMOVED FOR MERGE
// app.get('/api/admin/moderation/queue', rateLimitMiddleware, async (req, res) => { ... });

// 8. VERIFY BADGE EMBED
app.post('/api/verify-badge', rateLimitMiddleware, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: true, message: "Website URL is required for verification." });
    }

    // Add https:// if missing
    let targetUrl = url;
    if (!targetUrl.startsWith('http')) {
      targetUrl = `https://${targetUrl}`;
    }

    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 6000);

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'LaunchitBot/1.0 (Verification Service)',
        'Accept': 'text/html'
      },
      signal: abortController.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(400).json({ error: true, message: `Could not access site: ${response.statusText}` });
    }

    const html = await response.text();
    const lcHtml = html.toLowerCase();

    // Check for badge indicators
    const hasBadge = lcHtml.includes('launchit.site') ||
      lcHtml.includes('launched on launchit') ||
      lcHtml.includes('launchit-badge');

    if (hasBadge) {
      res.json({ success: true, message: "Badge verified! You're ready to launch." });
    } else {
      res.json({
        success: false,
        message: "Badge not found. Please ensure the code is added to your homepage and is publicly visible."
      });
    }

  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({
      error: true,
      message: error.name === 'AbortError' ? "Request timed out. Please try again." : error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'launchit-ai-backend'
  });
});

// ==================== EMAIL WEBHOOKS ====================

// Supabase Webhook: Triggered on INSERT to 'profiles'
app.post('/api/webhooks/signup', async (req, res) => {
  const { record } = req.body;
  console.log('WEBHOOK: New user signed up:', record?.email);

  if (!record?.email) {
    return res.status(400).json({ error: 'No email found in webhook payload' });
  }

  try {
    const result = await sendTemplateEmail(record.email, EMAIL_TEMPLATES.WELCOME, {
      user_name: record.full_name || record.username || 'Builder',
      submit_url: 'https://launchit.site/submit',
      current_year: new Date().getFullYear()
    });

    if (!result.success) {
      return res.status(500).json({ error: true, message: result.error });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('WEBHOOK ERROR (Signup):', error);
    res.status(500).json({ error: error.message });
  }
});

// Supabase Webhook: Triggered on INSERT to 'project_likes'
app.post('/api/webhooks/upvote', async (req, res) => {
  const { record } = req.body;
  const { project_id } = record;

  if (!project_id) return res.status(400).json({ error: 'No project_id found' });

  try {
    // 1. Get current count
    const { count, error: countError } = await supabase
      .from('project_likes')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', project_id);

    if (countError) throw countError;

    // 2. Check for milestones (10, 50, 100)
    const milestones = [10, 50, 100];
    if (milestones.includes(count)) {
      // Get project and owner info
      const { data: project, error: projError } = await supabase
        .from('projects')
        .select(`
          name,
          profiles:user_id (email, full_name, username, milestone_emails)
        `)
        .eq('id', project_id)
        .single();

      if (projError) throw projError;

      const profile = project.profiles;
      if (profile?.email && profile.milestone_emails !== false) {
        // Calculate next milestone (for the template)
        const nextMilestone = count < 50 ? 50 : 100;

        const result = await sendTemplateEmail(profile.email, EMAIL_TEMPLATES.MILESTONE, {
          project_name: project.name,
          like_count: count,
          project_url: `https://launchit.site/launches/${project.slug}`,
          next_milestone: nextMilestone,
          dashboard_url: 'https://launchit.site/profile',
          current_year: new Date().getFullYear()
        });

        if (!result.success) {
          console.error(`MILESTONE ERROR: Failed to send to ${profile.email}:`, result.error);
        } else {
          console.log(`MILESTONE: Sent email for ${count} upvotes to ${profile.email}`);
        }
      }
    }
    res.json({ success: true, count });
  } catch (error) {
    console.error('WEBHOOK ERROR (Upvote):', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);
  // Ensure CORS headers are present even on errors
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");

  res.status(500).json({
    error: true,
    message: 'Internal server error: ' + (err.message || 'Unknown error')
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: 'Endpoint not found'
  });
});

// ==================== SCHEDULED TASKS (CRON) ====================

// 1. DAILY DRAFT REMINDER (Run at 9:00 AM every day)
cron.schedule('0 9 * * *', async () => {
  console.log('CRON: Running Daily Draft Reminder scanner...');

  try {
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    const windowStart = new Date(fortyEightHoursAgo);
    windowStart.setMinutes(0);
    const windowEnd = new Date(fortyEightHoursAgo);
    windowEnd.setMinutes(59);

    const { data: drafts, error } = await supabase
      .from('projects')
      .select(`
        id, name, created_at,
        profiles:user_id (id, email, full_name, username)
      `)
      .eq('status', 'draft')
      .gte('created_at', windowStart.toISOString())
      .lte('created_at', windowEnd.toISOString());

    if (error) throw error;

    if (drafts && drafts.length > 0) {
      // Group drafts by user email
      const draftsByUser = drafts.reduce((acc, draft) => {
        const email = draft.profiles?.email;
        if (!email) return acc;
        if (!acc[email]) {
          acc[email] = {
            user_name: draft.profiles.full_name || draft.profiles.username || 'Builder',
            drafts: []
          };
        }
        acc[email].drafts.push(draft);
        return acc;
      }, {});

      for (const [email, data] of Object.entries(draftsByUser)) {
        // Generate HTML list for the template
        const draftsHtml = data.drafts.map(d => `
          <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
            <span style="font-size: 18px; font-weight: 700; color: #1F2937; display: block; margin-bottom: 4px;">${d.name || 'Untitled Project'}</span>
            <span style="font-size: 13px; color: #6B7280; display: block; margin-bottom: 12px;">Created on ${new Date(d.created_at).toLocaleDateString()}</span>
            <a href="https://launchit.site/submit" style="display: inline-block; background-color: #ffffff; border: 1px solid #d1d5db; color: #374151; padding: 10px 20px; border-radius: 6px; font-size: 14px; font-weight: 600; text-align: center; text-decoration: none;">Resume Draft</a>
          </div>
        `).join('');

        await sendTemplateEmail(email, EMAIL_TEMPLATES.DRAFT_REMINDER, {
          user_name: data.user_name,
          drafts_count: data.drafts.length,
          drafts_html: draftsHtml,
          dashboard_url: 'https://launchit.site/profile',
          current_year: new Date().getFullYear()
        });
      }
      console.log(`CRON: Sent reminder emails to ${Object.keys(draftsByUser).length} users.`);
    } else {
      console.log('CRON: No 48h-old drafts found today.');
    }
  } catch (error) {
    console.error('CRON ERROR (Draft Reminder):', error);
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`AI Backend is listening on port ${PORT}`);
}); 