import { useState } from 'react';
import ReactFlow, { Controls, Background, MiniMap, useNodesState, useEdgesState } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
// import './App.css'; // Removed as per instructions

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

import dagre from 'dagre';

// Adjusted nodeWidth and nodeHeight for new styling
const nodeWidth = 180;
const nodeHeight = 42;

const getLayoutedElements = (nodesToLayout: Node[], edgesToLayout: Edge[], direction = 'TB') => {
  if (!nodesToLayout || nodesToLayout.length === 0) {
    return { layoutedNodes: [], edgesToLayout: [] };
  }

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 70 });

  nodesToLayout.forEach((node) => {
    // Ensure node.data and node.data.label are handled
    if (!node.data) {
       node.data = { label: 'Unnamed Step' };
    } else if (typeof node.data.label !== 'string' || node.data.label.trim() === '') {
       node.data.label = 'Unnamed Step';
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
       node.position = { x: 0, y: 0 }; // Default position if not found
    }
    // Add new styling to nodes
    node.style = {
      ...node.style, // Preserve any existing styles (though unlikely needed here)
      borderRadius: '0.75rem', // rounded-xl
      boxShadow: '0 4px 6px -2px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)', // Softer shadow consistent with theme
      border: '1px solid #e2e8f0', // slate-200
      backgroundColor: '#ffffff',
      padding: '8px 12px', // Adjusted padding
      fontSize: '13px',
      textAlign: 'center',
      width: nodeWidth, // Ensure Dagre layout uses consistent dimensions
      height: nodeHeight,
    };
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
    <div className="min-h-screen flex flex-col items-center justify-start pt-6 sm:pt-12 bg-gradient-to-br from-blue-50 to-slate-100 px-4 font-sans text-slate-800">
      <Card className="w-full max-w-lg mb-6 sm:mb-10 shadow-xl rounded-xl border border-slate-200/75">
        <CardHeader className="text-center pb-4 pt-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-500 bg-clip-text text-transparent pb-1">
            Skill Path Generator
          </CardTitle>
          <CardDescription className="text-slate-500 text-sm">
            Create your personalized learning roadmap
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-2 pb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-indigo-500 opacity-70">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <Input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What skill do you want to learn?"
              className="pl-11 pr-4 py-3 h-11 text-base rounded-xl border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-indigo-500 opacity-70">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
            </div>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="w-full pl-11 pr-4 py-3 h-11 text-base rounded-xl border-slate-300 focus:border-indigo-500 focus:ring-indigo-500">
                <SelectValue placeholder="Select your experience level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full py-3 h-11 text-base font-semibold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-150 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2.5"></div>
                Generating...
              </div>
            ) : (
              "Generate Learning Path"
            )}
          </Button>

          {error && (
            <div className="mt-4 p-3.5 bg-red-50 border border-red-300/70 text-red-700 rounded-xl text-sm flex items-start space-x-2.5 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="flex-grow">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>
      
      {isLoading ? (
        <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-4xl flex flex-col items-center justify-center h-[450px] sm:h-[550px] border border-slate-200/75">
          <div className="mb-6">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-indigo-100/70 animate-ping"></div>
              <div className="absolute inset-2 rounded-full bg-indigo-200/70 animate-pulse"></div>
              <div className="absolute inset-4 rounded-full bg-indigo-500 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-indigo-700 mb-2">Building your roadmap</h3>
          <p className="text-slate-600 text-center max-w-md">
            We're creating a personalized learning path for <span className="font-medium text-indigo-600">{goal}</span> at {level} level
          </p>
          <div className="mt-6 w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-progress"></div>
          </div>
        </div>
      ) : (
        <>
          {!error && nodes.length === 0 && (
            <div className="bg-white p-6 sm:p-10 rounded-xl shadow-xl w-full max-w-4xl text-center border border-slate-200/75 h-[450px] sm:h-[550px] flex flex-col justify-center items-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Your Learning Path Awaits!</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Enter a skill above to generate your personalized learning roadmap. We'll create a step-by-step guide to mastering {goal || 'your chosen skill'}.
              </p>
            </div>
          )}

          {nodes.length > 0 && (
            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-xl w-full max-w-4xl h-[450px] sm:h-[550px] border border-slate-200/75 relative">
              <div className="absolute bg-gradient-to-r from-indigo-600 to-purple-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-md top-4 left-4 sm:top-5 sm:left-5 z-10">
                Learning Path: {goal}
              </div>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
              >
                <Controls className="p-1 bg-slate-50 shadow-md rounded-lg border border-slate-200/75" />
                <MiniMap
                  className="bg-slate-50 shadow-md rounded-lg border border-slate-200/75"
                  nodeColor={(node) => node.style?.backgroundColor || '#fff'}
                  nodeStrokeColor={'#94a3b8'}
                />
                <Background color="#f1f5f9" gap={20} />
              </ReactFlow>
            </div>
          )}
        </>
      )}
      
      <footer className="mt-10 mb-8 text-center text-slate-500 text-sm">
        <p>Skill Path Generator • Empowering students to achieve their learning goals</p>
      </footer>
    </div>
  );
}