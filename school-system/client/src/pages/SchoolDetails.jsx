import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { Users, Plus, BookOpen } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

export default function SchoolDetails() {
  const { id } = useParams();
  const [escola, setEscola] = useState(null);
  const [turmas, setTurmas] = useState([]);
  const [novaTurma, setNovaTurma] = useState('');

  useEffect(() => {
    carregarDados();
  }, [id]);

  const carregarDados = async () => {
    // Usually we would fetch school details separately, but here we can just use the turmas list or fetch again if needed
    // The simplified API setup earlier didn't have a direct "get school by id" but let's assume we can get turmas filtered by school
    // Actually the /api/turmas includes 'escola' object if we look at the backend code.
    const resTurmas = await axios.get(`${API_URL}/turmas?escolaId=${id}`);
    setTurmas(resTurmas.data);

    // Quick hack to get school name since we didn't make a specific endpoint for just school details (or we can assume list includes it)
    if (resTurmas.data.length > 0) {
        setEscola(resTurmas.data[0].escola);
    } else {
        // Fallback or fetch all schools to find this one (simplified for now)
        const resEscolas = await axios.get(`${API_URL}/escolas`);
        const found = resEscolas.data.find(e => e.id === Number(id));
        setEscola(found);
    }
  };

  const criarTurma = async (e) => {
    e.preventDefault();
    if (!novaTurma) return;
    await axios.post(`${API_URL}/turmas`, { nome: novaTurma, escolaId: id });
    setNovaTurma('');
    carregarDados();
  };

  if (!escola) return <div>Carregando...</div>;

  return (
    <div>
      <div className="flex items-center mb-6">
        <Link to="/" className="text-blue-500 hover:underline mr-4">← Voltar</Link>
        <h2 className="text-3xl font-bold text-gray-800">{escola.nome} - Turmas</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {turmas.map(turma => (
          <Link key={turma.id} to={`/turma/${turma.id}`} className="block">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-indigo-500">
              <div className="flex items-center mb-4">
                <Users className="text-indigo-500 mr-2" size={24} />
                <h3 className="text-xl font-semibold text-gray-800">{turma.nome}</h3>
              </div>
              <p className="text-gray-600">{turma.disciplinas ? turma.disciplinas.length : 0} Disciplinas</p>
            </div>
          </Link>
        ))}

        <div className="bg-white p-6 rounded-lg shadow-md border-2 border-dashed border-gray-300 flex flex-col justify-center items-center">
          <form onSubmit={criarTurma} className="w-full">
            <h3 className="text-lg font-medium text-gray-700 mb-2 text-center">Adicionar Nova Turma</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome da Turma (ex: 1º Ano A)"
                className="flex-grow p-2 border rounded"
                value={novaTurma}
                onChange={e => setNovaTurma(e.target.value)}
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
