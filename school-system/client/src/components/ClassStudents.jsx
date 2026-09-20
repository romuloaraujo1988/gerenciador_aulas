import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, User } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

export default function ClassStudents({ turmaId }) {
  const [alunos, setAlunos] = useState([]);
  const [novoAluno, setNovoAluno] = useState('');

  useEffect(() => {
    carregarAlunos();
  }, [turmaId]);

  const carregarAlunos = async () => {
    const res = await axios.get(`${API_URL}/turmas/${turmaId}/alunos`);
    setAlunos(res.data);
  };

  const [novoLogin, setNovoLogin] = useState('');
  const [novaSenha, setNovaSenha] = useState('');

  const adicionarAluno = async (e) => {
    e.preventDefault();
    if (!novoAluno) return;
    try {
      await axios.post(`${API_URL}/alunos`, {
        nome: novoAluno,
        login: novoLogin || novoAluno.toLowerCase().replace(/ /g, '.'),
        senha: novaSenha || '123456',
        turmaId
      });
      setNovoAluno('');
      setNovoLogin('');
      setNovaSenha('');
      carregarAlunos();
    } catch (err) {
      alert('Erro ao criar aluno. Verifique se o login já existe.');
    }
  };

  return (
    <div>
      <div className="mb-6 bg-white p-4 rounded shadow">
        <h3 className="text-lg font-bold mb-2">Adicionar Aluno</h3>
        <form onSubmit={adicionarAluno} className="flex gap-4 flex-wrap items-end">
          <div className="flex-grow min-w-[200px]">
            <label className="block text-xs mb-1">Nome Completo</label>
            <input
              type="text"
              placeholder="Ex: João Silva"
              className="w-full p-2 border rounded"
              value={novoAluno}
              onChange={e => setNovoAluno(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Login (Acesso ao Portal)</label>
            <input
              type="text"
              value={novoLogin}
              onChange={e => setNovoLogin(e.target.value)}
              placeholder="Deixe em branco para auto"
              className="w-48 p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-xs mb-1">Senha</label>
            <input
              type="text"
              value={novaSenha}
              onChange={e => setNovaSenha(e.target.value)}
              placeholder="Padrão: 123456"
              className="w-32 p-2 border rounded"
            />
          </div>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded flex items-center h-10 mb-px">
            <UserPlus size={18} className="mr-2" /> Adicionar
          </button>
        </form>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {alunos.map(aluno => (
              <tr key={aluno.id}>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">#{aluno.id}</td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{aluno.nome}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{aluno.login || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-blue-500 cursor-pointer">Editar</td>
              </tr>
            ))}
            {alunos.length === 0 && (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">Nenhum aluno cadastrado nesta turma.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
