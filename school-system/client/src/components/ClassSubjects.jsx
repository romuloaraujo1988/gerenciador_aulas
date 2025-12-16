import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Plus } from 'lucide-react';
import SubjectView from './SubjectView';

const API_URL = 'http://localhost:3001/api';

export default function ClassSubjects({ turmaId }) {
  const [disciplinas, setDisciplinas] = useState([]);
  const [novaDisciplina, setNovaDisciplina] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  useEffect(() => {
    carregarDisciplinas();
  }, [turmaId]);

  const carregarDisciplinas = async () => {
    // Note: The API endpoint structure I created earlier was /api/turmas/:id which includes disciplines
    // OR create a specific one. Let's rely on turmas/:id for now as implemented in backend.
    const res = await axios.get(`${API_URL}/turmas/${turmaId}`);
    setDisciplinas(res.data.disciplinas || []);
  };

  const criarDisciplina = async (e) => {
    e.preventDefault();
    if (!novaDisciplina) return;
    await axios.post(`${API_URL}/disciplinas`, { nome: novaDisciplina, turmaId });
    setNovaDisciplina('');
    carregarDisciplinas();
  };

  if (selectedSubjectId) {
    return (
        <div>
            <button onClick={() => setSelectedSubjectId(null)} className="mb-4 text-blue-500 hover:underline">← Voltar para Lista de Disciplinas</button>
            <SubjectView disciplinaId={selectedSubjectId} />
        </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {disciplinas.map(disc => (
            <div key={disc.id}
                 onClick={() => setSelectedSubjectId(disc.id)}
                 className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-teal-500 cursor-pointer">
              <div className="flex items-center mb-4">
                <BookOpen className="text-teal-500 mr-2" size={24} />
                <h3 className="text-xl font-semibold text-gray-800">{disc.nome}</h3>
              </div>
              <p className="text-gray-600 text-sm">Clique para gerenciar notas e chamadas</p>
            </div>
        ))}

        <div className="bg-white p-6 rounded-lg shadow-md border-2 border-dashed border-gray-300 flex flex-col justify-center items-center">
          <form onSubmit={criarDisciplina} className="w-full">
            <h3 className="text-lg font-medium text-gray-700 mb-2 text-center">Adicionar Nova Disciplina</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome (ex: Matemática)"
                className="flex-grow p-2 border rounded"
                value={novaDisciplina}
                onChange={e => setNovaDisciplina(e.target.value)}
              />
              <button type="submit" className="bg-green-500 text-white p-2 rounded hover:bg-green-600">
                <Plus size={24} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
