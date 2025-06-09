const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/generate-roadmap', (req, res) => {
  const { goal, level } = req.body;
  console.log(`Generating roadmap for ${goal} (${level})`);
  
  // Dummy response for now
  res.json({
    message: `Roadmap for learning ${goal} at ${level} level`,
    nodes: [
      { id: '1', label: 'Start with Basics' },
      { id: '2', label: 'Practice Projects' },
    ],
    edges: [{ source: '1', target: '2' }],
  });
});

app.listen(5000, () => {
  console.log('Backend running on http://localhost:5000');
});
