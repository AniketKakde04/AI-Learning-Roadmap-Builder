import { useState, useCallback } from 'react';
import ReactFlow, { Controls, Background, MiniMap, useNodesState, useEdgesState } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';

const nodeWidth = 172;
const nodeHeight = 36;

const getLayoutedElements = (nodesToLayout: Node[], edgesToLayout: Edge[], direction = 'TB') => {
  if (!nodesToLayout || nodesToLayout.length === 0) {
    return { layoutedNodes: [], edgesToLayout: [] };
  }

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 70 }); // Added nodesep and ranksep for better spacing

  nodesToLayout.forEach((node) => {
    // Ensure node.data.label exists, as it might be used for width calculation by some layout engines
    // or custom nodes, though Dagre primarily uses width/height here.
    // If node.data is undefined, initialize it.
    if (!node.data) {
       node.data = { label: 'Default' }; 
    }
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edgesToLayout.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodesToLayout.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    if (nodeWithPosition) { // Check if node exists in dagreGraph
       node.position = {
           x: nodeWithPosition.x - nodeWidth / 2,
           y: nodeWithPosition.y - nodeHeight / 2,
       };
    } else {
       // Fallback position if node not found in layout (should not happen if logic is correct)
       console.warn(`Node ${node.id} not found in Dagre layout. Using default position.`);
       node.position = { x: 0, y: 0 };
    }
    return node;
  });

  return { layoutedNodes, edgesToLayout };
};

export default function App() {
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('beginner');
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (goal.trim() === '') {
      setError("Please enter a skill you want to learn.");
      setIsLoading(false); // Ensure loading is off
      setNodes([]); // Clear any existing graph
      setEdges([]); // Clear any existing graph
      return; // Stop execution if goal is empty
    }
    setIsLoading(true);
    setError(null);
    setNodes([]);
    setEdges([]);

    try {
      const response = await fetch('http://localhost:3001/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, level }),
      });
      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      if (data.nodes && data.edges) {
        const { layoutedNodes, edgesToLayout: returnedEdges } = getLayoutedElements(data.nodes, data.edges, 'TB');
        setNodes(layoutedNodes);
        setEdges(returnedEdges);
      } else {
        setNodes([]);
        setEdges([]);
      }
    } catch (err) {
      console.error("Failed to generate roadmap:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      setNodes([]); // Clear nodes on error
      setEdges([]); // Clear edges on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-10 bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-6 mb-8">
        <h1 className="text-2xl font-bold text-center">Skill Roadmap Generator</h1>
        <input
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="What do you want to learn?"
          className="w-full p-3 border rounded-xl"
        />
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="w-full p-3 border rounded-xl"
        >
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 disabled:bg-gray-400"
          disabled={isLoading}
        >
          {isLoading ? 'Generating...' : 'Generate Roadmap'}
        </button>
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded-xl">
            <p>Error: {error}</p>
          </div>
        )}
      </div>
      {!isLoading && !error && nodes.length === 0 && (
           <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-3xl text-center text-gray-500 mt-4">
               <p>Your generated roadmap will appear here.</p>
           </div>
      )}
      <div className="bg-white p-4 rounded-2xl shadow-lg w-full max-w-3xl h-[600px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        >
          <Controls />
          <MiniMap />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}
