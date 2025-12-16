import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AttendanceModule from './AttendanceModule';
import GradesModule from './GradesModule';
import ReportsModule from './ReportsModule';

const API_URL = 'http://localhost:3001/api';

export default function SubjectView({ disciplinaId }) {
  const [disciplina, setDisciplina] = useState(null);
  const [activeTab, setActiveTab] = useState('chamada');

  useEffect(() => {
    carregarDisciplina();
  }, [disciplinaId]);

  const carregarDisciplina = async () => {
    const res = await axios.get(`${API_URL}/disciplinas/${disciplinaId}`);
    setDisciplina(res.data);
  };

  if (!disciplina) return <div>Carregando Disciplina...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">{disciplina.nome} - {disciplina.turma?.nome}</h2>

      <div className="flex border-b mb-6 overflow-x-auto">
        <button
          className={`py-2 px-6 whitespace-nowrap ${activeTab === 'chamada' ? 'border-b-2 border-blue-500 text-blue-600 font-bold' : 'text-gray-600'}`}
          onClick={() => setActiveTab('chamada')}
        >
          Chamada (Presença)
        </button>
        <button
          className={`py-2 px-6 whitespace-nowrap ${activeTab === 'notas' ? 'border-b-2 border-blue-500 text-blue-600 font-bold' : 'text-gray-600'}`}
          onClick={() => setActiveTab('notas')}
        >
          Notas e Atividades
        </button>
        <button
          className={`py-2 px-6 whitespace-nowrap ${activeTab === 'boletim' ? 'border-b-2 border-blue-500 text-blue-600 font-bold' : 'text-gray-600'}`}
          onClick={() => setActiveTab('boletim')}
        >
          Relatório / Boletim
        </button>
      </div>

      <div className="p-2">
        {activeTab === 'chamada' && <AttendanceModule disciplina={disciplina} />}
        {activeTab === 'notas' && <GradesModule disciplina={disciplina} />}
        {activeTab === 'boletim' && <ReportsModule disciplina={disciplina} />}
      </div>
    </div>
  );
}
