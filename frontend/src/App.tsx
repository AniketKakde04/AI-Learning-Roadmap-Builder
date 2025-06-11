import { useState } from 'react';
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
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 70 });

  nodesToLayout.forEach((node) => {
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
    if (nodeWithPosition) {
       node.position = {
           x: nodeWithPosition.x - nodeWidth / 2,
           y: nodeWithPosition.y - nodeHeight / 2,
       };
    } else {
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
      setIsLoading(false);
      setNodes([]);
      setEdges([]);
      return;
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
      setNodes([]);
      setEdges([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start pt-4 sm:pt-10 bg-gradient-to-br from-blue-50 to-indigo-50 px-4">
      <div className="bg-white p-5 sm:p-7 rounded-2xl shadow-xl w-full max-w-md space-y-5 mb-5 sm:mb-8 border border-indigo-100">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Skill Path Generator
          </h1>
          <p className="text-gray-600 text-sm mt-1">Create your personalized learning roadmap</p>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-indigo-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="What skill do you want to learn?"
            className="w-full pl-10 pr-4 py-3 border border-indigo-200 rounded-xl bg-white text-gray-700 placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all shadow-sm"
          />
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-indigo-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
          </div>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full pl-10 pr-10 py-3 appearance-none border border-indigo-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition-all shadow-sm"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-indigo-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center relative overflow-hidden"
        >
          <span className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
            Generate Learning Path
          </span>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </button>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-red-700 text-sm">{error}</div>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-3xl flex flex-col items-center justify-center h-[400px] sm:h-[500px] border border-indigo-100">
          <div className="mb-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping"></div>
              <div className="absolute inset-2 rounded-full bg-indigo-200 animate-pulse"></div>
              <div className="absolute inset-4 rounded-full bg-indigo-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-indigo-700 mb-2">Building your roadmap</h3>
          <p className="text-gray-600 text-center max-w-md">
            We're creating a personalized learning path for <span className="font-medium text-indigo-600">{goal}</span> at {level} level
          </p>
          <div className="mt-6 w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-progress"></div>
          </div>
        </div>
      ) : (
        <>
          {!error && nodes.length === 0 && (
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-3xl text-center border border-indigo-100">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Your Learning Path Awaits!</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Enter a skill above to generate your personalized learning roadmap. We'll create a step-by-step guide to mastering {goal || 'your chosen skill'}.
              </p>
            </div>
          )}

          {nodes.length > 0 && (
            <div className="bg-white p-2 sm:p-4 rounded-2xl shadow-xl w-full max-w-3xl h-[400px] sm:h-[500px] border border-indigo-100 relative">
              <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
                Learning Path: {goal}
              </div>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
              >
                <Controls className="bg-white shadow-md rounded-lg border border-gray-200" />
                <MiniMap className="bg-white shadow-md rounded-lg" />
                <Background color="#e0e7ff" gap={24} />
              </ReactFlow>
            </div>
          )}
        </>
      )}
      
      <footer className="mt-8 mb-6 text-center text-gray-600 text-sm">
        <p>Skill Path Generator • Empowering students to achieve their learning goals</p>
      </footer>
    </div>
  );
}