import express from 'express';
import cors from 'cors';
import { VertexAI } from '@google-cloud/vertexai';
import { readFileSync } from 'fs';
import { join } from 'path';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Cache for Vertex AI instances
let vertexAIInstance: VertexAI | null = null;
let cachedConfig: { projectId: string; location: string; credentialsPath?: string } | null = null;

// Initialize Vertex AI client
async function getVertexAI(projectId: string, location: string, credentialsPath?: string): Promise<VertexAI> {
    // Check if we can reuse the cached instance
    if (vertexAIInstance && cachedConfig && 
        cachedConfig.projectId === projectId && 
        cachedConfig.location === location &&
        cachedConfig.credentialsPath === credentialsPath) {
        return vertexAIInstance;
    }

    let credentials: any = undefined;
    
    // If credentialsPath is provided, load from file
    if (credentialsPath) {
        try {
            const credentialsFile = readFileSync(credentialsPath, 'utf8');
            credentials = JSON.parse(credentialsFile);
        } catch (error) {
            console.error('Error loading credentials file:', error);
            throw new Error('Failed to load credentials file');
        }
    }

    // Initialize Vertex AI
    vertexAIInstance = new VertexAI({
        project: projectId,
        location: location,
        googleAuthOptions: credentials ? { credentials } : undefined,
    });

    cachedConfig = { projectId, location, credentialsPath };
    return vertexAIInstance;
}

// Helper to get config from request
async function getConfigFromRequest(req: express.Request): Promise<{ projectId: string; location: string; credentialsPath?: string }> {
    // Try to get from request body first
    if (req.body.projectId && req.body.location) {
        return {
            projectId: req.body.projectId,
            location: req.body.location,
            credentialsPath: req.body.credentialsPath,
        };
    }

    // Fallback to environment variables
    const projectId = process.env.VERTEX_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.VERTEX_LOCATION || 'us-central1';
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (!projectId) {
        throw new Error('Vertex AI project ID not configured. Set VERTEX_PROJECT_ID or provide in request.');
    }

    return { projectId, location, credentialsPath };
}

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'vertex-api' });
});

// Generate content endpoint
app.post('/api/vertex/generate-content', async (req, res) => {
    try {
        const { projectId, location, credentialsPath } = await getConfigFromRequest(req);
        const { model, prompt, systemInstruction, responseMimeType, responseSchema } = req.body;

        const vertexAI = await getVertexAI(projectId, location, credentialsPath);
        const generativeModel = vertexAI.getGenerativeModel({
            model: model || 'gemini-1.5-flash',
            systemInstruction: systemInstruction,
        });

        const request = {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        };

        const result = await generativeModel.generateContent(request);
        const response = result.response;
        const text = response.text();

        res.json({ text });
    } catch (error: any) {
        console.error('Error generating content:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to generate content',
            details: error.toString()
        });
    }
});

// Generate content with images endpoint
app.post('/api/vertex/generate-content-with-images', async (req, res) => {
    try {
        const { projectId, location, credentialsPath } = await getConfigFromRequest(req);
        const { model, prompt, images, systemInstruction } = req.body;

        const vertexAI = await getVertexAI(projectId, location, credentialsPath);
        const generativeModel = vertexAI.getGenerativeModel({
            model: model || 'gemini-1.5-flash',
            systemInstruction: systemInstruction,
        });

        // Process images - expect array of { mimeType, data } objects
        const parts: any[] = [];
        
        // Add images first
        if (images && Array.isArray(images)) {
            for (const img of images) {
                parts.push({
                    inlineData: {
                        mimeType: img.mimeType,
                        data: img.data, // base64 string
                    },
                });
            }
        }

        // Add text prompt
        if (prompt) {
            parts.push({ text: prompt });
        }

        const request = {
            contents: [{ role: 'user', parts }],
        };

        const result = await generativeModel.generateContent(request);
        const response = result.response;
        const text = response.text();

        res.json({ text });
    } catch (error: any) {
        console.error('Error generating content with images:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to generate content',
            details: error.toString()
        });
    }
});

// Generate images endpoint (using Imagen)
app.post('/api/vertex/generate-images', async (req, res) => {
    try {
        const { projectId, location, credentialsPath } = await getConfigFromRequest(req);
        const { prompt, aspectRatio, numberOfImages } = req.body;

        const vertexAI = await getVertexAI(projectId, location, credentialsPath);
        
        // Note: Imagen API might have different structure in Vertex AI
        // This is a placeholder - adjust based on actual Vertex AI Imagen API
        const imagenModel = vertexAI.getGenerativeModel({
            model: 'imagegeneration@006', // Adjust model name as needed
        });

        // Vertex AI Imagen API structure may differ
        // This needs to be adjusted based on actual API documentation
        const request = {
            prompt: prompt,
            aspectRatio: aspectRatio || '1:1',
            numberOfImages: numberOfImages || 1,
        };

        const result = await imagenModel.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        // Process response - adjust based on actual API response structure
        const response = result.response;
        const images: string[] = [];

        // Extract images from response (structure may vary)
        // This is a placeholder - adjust based on actual response
        res.json({ 
            images: images,
            message: 'Image generation endpoint - structure needs to be adjusted based on Vertex AI Imagen API'
        });
    } catch (error: any) {
        console.error('Error generating images:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to generate images',
            details: error.toString()
        });
    }
});

// Generate video endpoint (Veo)
app.post('/api/vertex/generate-video', async (req, res) => {
    try {
        const { projectId, location, credentialsPath } = await getConfigFromRequest(req);
        const { prompt, aspectRatio, resolution, sourceImage } = req.body;

        const vertexAI = await getVertexAI(projectId, location, credentialsPath);
        
        // Veo API structure in Vertex AI
        // This needs to be adjusted based on actual Vertex AI Veo API
        res.json({ 
            message: 'Video generation endpoint - needs implementation based on Vertex AI Veo API',
            operation: { name: 'placeholder-operation-name' }
        });
    } catch (error: any) {
        console.error('Error generating video:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to generate video',
            details: error.toString()
        });
    }
});

// Get video operation status
app.post('/api/vertex/video-operation-status', async (req, res) => {
    try {
        const { projectId, location, credentialsPath } = await getConfigFromRequest(req);
        const { operationName } = req.body;

        // Implement operation status check
        res.json({ 
            message: 'Video operation status endpoint - needs implementation',
            operation: { name: operationName, done: false }
        });
    } catch (error: any) {
        console.error('Error getting video operation status:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to get operation status',
            details: error.toString()
        });
    }
});

const PORT = process.env.PORT || 3001;

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Vertex AI API server running on http://localhost:${PORT}`);
    console.log(`📝 Make sure to set VERTEX_PROJECT_ID and VERTEX_LOCATION environment variables`);
});

export default app;
