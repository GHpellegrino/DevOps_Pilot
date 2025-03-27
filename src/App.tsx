import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, Users, BarChart, Settings as SettingsIcon, Rocket } from 'lucide-react';
import Questionnaires from './pages/Questionnaires';
import Accompaniments from './pages/Accompaniments';
import Evaluations from './pages/Evaluations';
import Settings from './pages/Settings';
import Dashboard from './pages/Dashboard';
import { ConnectionTest } from './components/ConnectionTest';

function App() {
  return (
    <Router>
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-gray-900 text-white flex flex-col">
          <div className="h-16 bg-indigo-600 flex items-center justify-center">
            <div className="flex items-center">
              <Rocket className="h-5 w-5 mr-2" />
              <h1 className="text-xl font-bold">DevOps Pilot</h1>
              <Rocket className="h-5 w-5 ml-2" />
            </div>
          </div>
          <nav className="mt-6 flex-1">
            <Link to="/" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800">
              <LayoutDashboard className="h-5 w-5 mr-3" />
              Dashboard
            </Link>
            <Link to="/questionnaires" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800">
              <ClipboardList className="h-5 w-5 mr-3" />
              Questionnaires
            </Link>
            <Link to="/accompaniments" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800">
              <Users className="h-5 w-5 mr-3" />
              Accompagnements
            </Link>
            <Link to="/evaluations" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800">
              <BarChart className="h-5 w-5 mr-3" />
              Évaluations
            </Link>
          </nav>
          <div className="border-t border-gray-800">
            <Link to="/settings" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800">
              <SettingsIcon className="h-5 w-5 mr-3" />
              Paramètres
            </Link>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <div className="h-16 bg-indigo-600 flex items-center justify-end px-6">
            <span className="text-white text-sm">v1.0.0</span>
          </div>
          <div className="flex-1 p-8 bg-gray-100 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/questionnaires" element={<Questionnaires />} />
              <Route path="/accompaniments" element={<Accompaniments />} />
              <Route path="/evaluations" element={<Evaluations />} />
              <Route path="/evaluations/new/:accompanimentId" element={<Evaluations />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </div>
      </div>
      <ConnectionTest />
    </Router>
  );
}

export default App;