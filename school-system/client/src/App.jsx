import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import SchoolDetails from './pages/SchoolDetails';
import ClassDetails from './pages/ClassDetails';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 flex flex-col">
        <header className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">Sistema de Gestão Escolar</Link>
          <nav>
            <Link to="/" className="hover:text-blue-200">Início</Link>
          </nav>
        </header>
        <main className="p-4 flex-grow container mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/escola/:id" element={<SchoolDetails />} />
            <Route path="/turma/:id" element={<ClassDetails />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
