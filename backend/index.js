import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const port = process.env.PORT || 3001;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cors());
app.use(express.json());

app.post('/generate-roadmap', async (req, res) => {
  const { goal, level } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Generate a learning roadmap for the skill: "${goal}" at the "${level}" level.
    Please provide a list of main topics and sub-topics.
    For each topic, suggest what should be learned next or what its prerequisites are.
    Structure the output as a JSON object with two keys: "nodes" and "edges".
    "nodes" should be an array of objects, each with "id" (string, unique name of the topic) and "label" (string, display name of the topic).
    "edges" should be an array of objects, each with "source" (string, id of the source topic) and "target" (string, id of the target topic) representing the learning flow.
    Ensure all node ids used in "edges" are defined in the "nodes" array.
    For example:
    {
      "nodes": [
        { "id": "topic1", "label": "Topic 1: Introduction" },
        { "id": "topic2", "label": "Topic 2: Core Concepts" },
        { "id": "topic3", "label": "Topic 3: Advanced Techniques" }
      ],
      "edges": [
        { "source": "topic1", "target": "topic2" },
        { "source": "topic2", "target": "topic3" }
      ]
    }
    Provide only the JSON object in your response.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    // Clean the text: remove backticks and "json" prefix if present
    text = text.replace(/^\s*```json\s*|\s*```\s*$/g, '');
    const roadmapData = JSON.parse(text);

    if (roadmapData.nodes && Array.isArray(roadmapData.nodes)) {
      roadmapData.nodes.forEach((node, index) => {
        // Ensure label is in node.data.label for React Flow
        if (node.label) { // Check if label exists
          node.data = { ...node.data, label: node.label };
          // delete node.label; // Optional: remove top-level label if it causes issues, but often not needed
        } else if (node.data && node.data.label) {
          // Label is already correctly placed, do nothing for label
        } else {
          // Fallback if no label found anywhere
          node.data = { ...node.data, label: 'Unnamed Step' };
        }

        // Grid-like initial position
        const itemsPerRow = 3; // Adjust as needed
        const spacingX = 250; // Horizontal spacing
        const spacingY = 150; // Vertical spacing
        node.position = { 
          x: (index % itemsPerRow) * spacingX, 
          y: Math.floor(index / itemsPerRow) * spacingY 
        };
      });
    }

    res.json(roadmapData);
  } catch (error) {
    console.error('Error generating roadmap:', error);
    res.status(500).json({ error: 'Failed to generate roadmap from API.', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
