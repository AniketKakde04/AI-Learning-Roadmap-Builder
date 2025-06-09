import { useState } from 'react';

export default function App() {
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('beginner');

  const handleSubmit = async () => {
    const response = await fetch('http://localhost:5000/generate-roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal, level }),
    });
    const data = await response.json();
    console.log('Roadmap:', data);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md space-y-6">
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
          className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700"
        >
          Generate Roadmap
        </button>
      </div>
    </div>
  );
}
