import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Gamepad2, GraduationCap, LogOut } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

export default function StudentDashboard() {
  const [aluno, setAluno] = useState(null);
  const [atividadesIA, setAtividadesIA] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem('alunoData');
    if (!data) {
      navigate('/aluno/login');
      return;
    }

    const parsedAluno = JSON.parse(data);
    setAluno(parsedAluno);
    carregarAtividades(parsedAluno);
  }, [navigate]);

  const carregarAtividades = async (alunoData) => {
    // Buscar atividades de IA de todas as disciplinas da turma
    if (alunoData && alunoData.turma && alunoData.turma.disciplinas) {
      const allActivities = [];

      for (const disc of alunoData.turma.disciplinas) {
        try {
          const res = await axios.get(`${API_URL}/disciplinas/${disc.id}/atividades`);
          // Filtrar apenas atividades do tipo IA (QUIZ ou FLASHCARD)
          const iaAtividades = res.data.filter(a => a.tipo === 'QUIZ' || a.tipo === 'FLASHCARD');

          iaAtividades.forEach(a => {
            allActivities.push({
              ...a,
              disciplinaNome: disc.nome
            });
          });
        } catch (error) {
          console.error(`Erro ao buscar atividades da disciplina ${disc.id}:`, error);
        }
      }

      setAtividadesIA(allActivities);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('alunoData');
    navigate('/aluno/login');
  };

  if (!aluno) return <div>Carregando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 flex items-center">
            <GraduationCap className="mr-2 text-blue-600" size={32} />
            Olá, {aluno.nome}!
          </h2>
          <p className="text-gray-500">Turma: {aluno.turma?.nome}</p>
        </div>
        <button onClick={handleLogout} className="text-red-500 hover:text-red-700 flex items-center bg-white px-4 py-2 rounded shadow">
          <LogOut size={18} className="mr-2" /> Sair
        </button>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 mb-8 text-white">
        <h3 className="text-2xl font-bold flex items-center mb-2">
          <Gamepad2 className="mr-2" /> Zona de Jogos e Atividades
        </h3>
        <p>Aprenda jogando! Escolha uma atividade abaixo para começar e ganhar pontos.</p>
      </div>

      <h4 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">Suas Missões Disponíveis</h4>

      {atividadesIA.length === 0 ? (
        <div className="bg-white p-8 text-center rounded shadow text-gray-500">
          <p>Nenhuma atividade ou jogo disponível no momento.</p>
          <p className="text-sm mt-2">Aguarde seus professores criarem novos desafios!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {atividadesIA.map(ativ => (
            <div key={ativ.id} className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow border-t-4 border-purple-500 flex flex-col">
              <div className="p-5 flex-grow">
                <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded mb-2">
                  {ativ.tipo === 'QUIZ' ? 'Quiz Interativo' : 'Flashcards'}
                </span>
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded mb-2 ml-2">
                  {ativ.disciplinaNome}
                </span>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{ativ.nome}</h3>
                <p className="text-sm text-gray-500">Vale até {ativ.valorMaximo} pontos na nota final!</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-b-lg">
                <Link
                  to={`/aluno/jogar/${ativ.id}`}
                  className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors flex justify-center items-center"
                >
                  <Gamepad2 size={18} className="mr-2" /> Jogar Agora
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
