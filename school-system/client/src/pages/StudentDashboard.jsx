import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Gamepad2, GraduationCap, LogOut, Settings, User, Trophy, Medal } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

export default function StudentDashboard() {
  const [aluno, setAluno] = useState(null);
  const [atividadesIA, setAtividadesIA] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [activeTab, setActiveTab] = useState('missoes');
  const [showProfile, setShowProfile] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [senhaConfirmacao, setSenhaConfirmacao] = useState('');
  const [senhaStatus, setSenhaStatus] = useState({ error: '', success: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem('alunoData');
    if (!data) {
      navigate('/aluno/login');
      return;
    }

    const parsedAluno = JSON.parse(data);
    const token = localStorage.getItem('alunoToken');

    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    setAluno(parsedAluno);
    carregarAtividades(parsedAluno);
    carregarRanking(parsedAluno.turmaId);
  }, [navigate]);

  const carregarRanking = async (turmaId) => {
    if (!turmaId) return;
    try {
      const res = await axios.get(`${API_URL}/turmas/${turmaId}/ranking`);
      setRanking(res.data);
    } catch (err) {
      console.error("Erro ao carregar ranking", err);
    }
  };

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
    localStorage.removeItem('alunoToken');
    delete axios.defaults.headers.common['Authorization'];
    navigate('/aluno/login');
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setSenhaStatus({ error: '', success: '' });

    if (novaSenha !== senhaConfirmacao) {
      return setSenhaStatus({ error: 'A nova senha e a confirmação não coincidem.', success: '' });
    }
    if (novaSenha.length < 6) {
      return setSenhaStatus({ error: 'A nova senha deve ter no mínimo 6 caracteres.', success: '' });
    }

    try {
      await axios.put(`${API_URL}/alunos/senha`, { senhaAtual, novaSenha });
      setSenhaStatus({ error: '', success: 'Senha atualizada com sucesso!' });
      setSenhaAtual('');
      setNovaSenha('');
      setSenhaConfirmacao('');
      setTimeout(() => setShowProfile(false), 2000);
    } catch (err) {
      setSenhaStatus({ error: err.response?.data?.error || 'Erro ao atualizar senha', success: '' });
    }
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
        <div className="flex gap-2">
          <button onClick={() => setShowProfile(true)} className="text-gray-600 hover:text-blue-600 flex items-center bg-white px-4 py-2 rounded shadow transition">
            <User size={18} className="mr-2" /> Meu Perfil
          </button>
          <button onClick={handleLogout} className="text-red-500 hover:text-red-700 flex items-center bg-white px-4 py-2 rounded shadow transition">
            <LogOut size={18} className="mr-2" /> Sair
          </button>
        </div>
      </div>

      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold flex items-center"><Settings className="mr-2"/> Meu Perfil</h3>
              <button onClick={() => setShowProfile(false)} className="text-gray-500 hover:text-gray-800">✕</button>
            </div>

            <div className="mb-4">
              <p><strong>Nome:</strong> {aluno.nome}</p>
              <p><strong>Login:</strong> {aluno.login}</p>
              <p><strong>Turma:</strong> {aluno.turma?.nome}</p>
            </div>

            <hr className="my-4" />
            <h4 className="font-bold mb-3 text-gray-700">Alterar Senha</h4>

            {senhaStatus.error && <p className="text-red-500 text-sm mb-2">{senhaStatus.error}</p>}
            {senhaStatus.success && <p className="text-green-500 text-sm mb-2">{senhaStatus.success}</p>}

            <form onSubmit={handleUpdatePassword}>
              <div className="mb-3">
                <input
                  type="password" placeholder="Senha Atual" required
                  className="w-full p-2 border rounded"
                  value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <input
                  type="password" placeholder="Nova Senha" required
                  className="w-full p-2 border rounded"
                  value={novaSenha} onChange={e => setNovaSenha(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <input
                  type="password" placeholder="Confirmar Nova Senha" required
                  className="w-full p-2 border rounded"
                  value={senhaConfirmacao} onChange={e => setSenhaConfirmacao(e.target.value)}
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 font-bold">
                Salvar Nova Senha
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="flex border-b-2 mb-6">
        <button
          className={`py-3 px-6 font-bold text-lg ${activeTab === 'missoes' ? 'border-b-4 border-purple-600 text-purple-700' : 'text-gray-500 hover:text-purple-500'}`}
          onClick={() => setActiveTab('missoes')}
        >
          🎮 Suas Missões
        </button>
        <button
          className={`py-3 px-6 font-bold text-lg flex items-center ${activeTab === 'ranking' ? 'border-b-4 border-yellow-500 text-yellow-600' : 'text-gray-500 hover:text-yellow-500'}`}
          onClick={() => setActiveTab('ranking')}
        >
          <Trophy className="mr-2" size={20} /> Ranking da Turma
        </button>
      </div>

      {activeTab === 'missoes' && (
        <>
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 mb-8 text-white">
            <h3 className="text-2xl font-bold flex items-center mb-2">
              <Gamepad2 className="mr-2" /> Zona de Jogos e Atividades
            </h3>
            <p>Aprenda jogando! Escolha uma atividade abaixo para começar e ganhar pontos de XP.</p>
          </div>

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
                      {ativ.tipo === 'QUIZ' ? 'Quiz Interativo' : (ativ.tipo === 'FLASHCARD' ? 'Flashcards' : 'Preencher Lacunas')}
                    </span>
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded mb-2 ml-2">
                      {ativ.disciplinaNome}
                    </span>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{ativ.nome}</h3>
                    <p className="text-sm text-gray-500">Vale até {ativ.valorMaximo * 100} XP!</p>
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
        </>
      )}

      {activeTab === 'ranking' && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-6 text-white text-center">
            <Trophy size={48} className="mx-auto mb-2 opacity-90" />
            <h3 className="text-2xl font-bold">Hall da Fama</h3>
            <p className="opacity-90">Os melhores pontuadores da sua turma</p>
          </div>

          <div className="p-0">
            {ranking.map((alunoRank, index) => (
              <div key={alunoRank.alunoId} className={`flex items-center p-4 border-b ${alunoRank.alunoId === aluno.id ? 'bg-yellow-50 font-bold border-l-4 border-l-yellow-500' : 'hover:bg-gray-50'}`}>
                <div className="w-12 text-center font-bold text-xl text-gray-500">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                </div>
                <div className="flex-grow pl-4">
                  <div className="text-lg text-gray-800">{alunoRank.nome} {alunoRank.alunoId === aluno.id && '(Você)'}</div>
                  <div className="text-xs text-gray-500 flex items-center">
                    <Medal size={12} className="mr-1 text-blue-500" /> Nível {alunoRank.nivel} • {alunoRank.jogosCompletos} jogos completados
                  </div>
                </div>
                <div className="text-right pr-4">
                  <div className="text-xl font-black text-orange-500">{Math.round(alunoRank.pontosXP)} <span className="text-sm font-normal text-gray-500">XP</span></div>
                </div>
              </div>
            ))}

            {ranking.length === 0 && (
              <div className="p-8 text-center text-gray-500">Ninguém jogou ainda. Seja o primeiro!</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
