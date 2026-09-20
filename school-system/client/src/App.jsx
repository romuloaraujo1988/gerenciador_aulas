import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SchoolDetails from './pages/SchoolDetails';
import ClassDetails from './pages/ClassDetails';
import StudentLogin from './pages/StudentLogin';
import StudentDashboard from './pages/StudentDashboard';
import GamePlayer from './pages/GamePlayer';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <header className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">Sistema de Gestão Escolar</Link>
          <nav className="flex space-x-4">
            <Link to="/" className="hover:text-blue-200">Área do Professor</Link>
            <Link to="/aluno/login" className="bg-white text-blue-600 px-3 py-1 rounded font-bold hover:bg-blue-100">Portal do Aluno</Link>
          </nav>
        </header>
        <main className="p-4 flex-grow container mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/escola/:id" element={<SchoolDetails />} />
            <Route path="/turma/:id" element={<ClassDetails />} />
            <Route path="/aluno/login" element={<StudentLogin />} />
            <Route path="/aluno/dashboard" element={<StudentDashboard />} />
            <Route path="/aluno/jogar/:atividadeId" element={<GamePlayer />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
