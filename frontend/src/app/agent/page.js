'use client';
import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Badge from '../../components/Badge';

export default function AgentDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState(null);
  const [report, setReport] = useState({ isSpoiled: 'No', condition: 'Good', notes: '' });

  const fetchAgentClaims = () => {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    fetch(`${API_BASE}/api/agent/claims`)
      .then((res) => res.json())
      .then((data) => {
        setTasks(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch agent claims:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAgentClaims();
  }, []);

  const startVerification = (task) => {
    setActiveTask(task);
  };

  const submitReport = async (e) => {
    e.preventDefault();
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    try {
      const res = await fetch(`${API_BASE}/api/agent/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim_id: activeTask.id,
          storage_condition: report.condition,
          is_spoiled: report.isSpoiled === 'Yes',
          agent_notes: report.notes || 'Inspection completed',
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      setActiveTask(null);
      setReport({ isSpoiled: 'No', condition: 'Good', notes: '' });
      alert('Verification Report Submitted successfully!');
      fetchAgentClaims();
    } catch (err) {
      console.error('Failed to submit verification report:', err);
      alert('Error submitting verification report to backend.');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      <Sidebar role="agent" plan="basic" user={{ name: "Rajan Kumar" }} />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold font-serif text-green-primary">Verification Portal</h1>
            <p className="text-gray-500 mt-1">Review claims and inspect crop quality</p>
          </div>
          
          {activeTask ? (
            <div className="bg-white border border-gray-100 p-6 md:p-8 rounded-2xl shadow-sm animate-in fade-in zoom-in-95 duration-200">
              <button 
                onClick={() => setActiveTask(null)} 
                className="text-emerald-700 font-semibold mb-6 flex items-center gap-2 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors -ml-3"
              >
                <span>←</span> Back to Queue
              </button>
              
              <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 font-serif">Verifying Task #{activeTask.id}</h2>
                  <p className="text-gray-500 mt-1">Farmer: {activeTask.farmer} | Crop: {activeTask.crop}</p>
                </div>
                <Badge status="Evidence Verification" />
              </div>
              
              <form onSubmit={submitReport} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Storage Condition</label>
                  <select 
                    value={report.condition} 
                    onChange={e => setReport({...report, condition: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:border-green-primary focus:ring-1 focus:ring-green-primary outline-none transition-all text-gray-900"
                  >
                    <option>Good</option>
                    <option>Average</option>
                    <option>Poor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Is Crop Spoiled?</label>
                  <select 
                    value={report.isSpoiled} 
                    onChange={e => setReport({...report, isSpoiled: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:border-green-primary focus:ring-1 focus:ring-green-primary outline-none transition-all text-gray-900"
                  >
                    <option>No</option>
                    <option>Yes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Agent Notes (Optional)</label>
                  <textarea 
                    rows="3"
                    value={report.notes}
                    onChange={e => setReport({...report, notes: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:border-green-primary focus:ring-1 focus:ring-green-primary outline-none transition-all text-gray-900 resize-none"
                    placeholder="Any specific observations..."
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-green-primary hover:bg-emerald-800 text-white font-bold text-lg py-4 rounded-xl transition-all shadow-md active:scale-[0.98]"
                >
                  Submit Verification Report
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
                  <p className="text-gray-400 text-5xl mb-4">📋</p>
                  <p className="text-gray-500 text-lg font-medium">No pending tasks in queue!</p>
                </div>
              ) : tasks.map(task => (
                <div key={task.id} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-xs hover:shadow-sm transition-shadow flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Task #{task.id}</p>
                    <h2 className="text-xl font-bold text-gray-900">{task.farmer} - {task.crop}</h2>
                    <p className="text-sm text-gray-500 mt-2 flex items-center gap-1"><span>📍</span> {task.distance} away</p>
                  </div>
                  <div className="w-full sm:w-auto">
                    <button 
                      onClick={() => startVerification(task)} 
                      className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold py-3 px-6 rounded-xl transition-colors text-sm"
                    >
                      Start Verification
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
