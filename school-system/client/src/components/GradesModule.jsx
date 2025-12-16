import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Plus, Save } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

export default function GradesModule({ disciplina }) {
  const [atividades, setAtividades] = useState([]);
  const [notas, setNotas] = useState([]); // All grades fetched
  const [alunos, setAlunos] = useState([]);
  const [activeBimester, setActiveBimester] = useState(1);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState({ formula: 'SOMA' });

  // New Activity Form
  const [newActName, setNewActName] = useState('');
  const [newActCat, setNewActCat] = useState('TRABALHO');
  const [newActMax, setNewActMax] = useState(10);

  useEffect(() => {
    if (disciplina?.turma?.alunos) {
        setAlunos(disciplina.turma.alunos);
    }
    carregarDados();
  }, [disciplina, activeBimester]);

  const carregarDados = async () => {
    // Load Activities for this bimester
    const resAtiv = await axios.get(`${API_URL}/disciplinas/${disciplina.id}/atividades?bimestre=${activeBimester}`);
    setAtividades(resAtiv.data);

    // Load Grades
    const resNotas = await axios.get(`${API_URL}/disciplinas/${disciplina.id}/notas`);
    setNotas(resNotas.data);
  };

  const criarAtividade = async (e) => {
    e.preventDefault();
    await axios.post(`${API_URL}/atividades`, {
        nome: newActName,
        categoria: newActCat,
        valorMaximo: newActMax,
        bimestre: activeBimester,
        data: new Date(),
        disciplinaId: disciplina.id
    });
    setNewActName('');
    carregarDados();
  };

  const salvarNota = async (alunoId, atividadeId, valor) => {
    await axios.post(`${API_URL}/notas`, {
        alunoId,
        atividadeId,
        valor
    });
    // Optimistic update or reload? Let's reload for safety
    carregarDados();
  };

  const salvarConfig = async () => {
      await axios.post(`${API_URL}/configuracoes`, {
          disciplinaId: disciplina.id,
          bimestre: activeBimester,
          formula: config.formula
      });
      alert('Configuração salva!');
      setShowConfig(false);
  }

  const getNota = (alunoId, atividadeId) => {
      const nota = notas.find(n => n.alunoId === alunoId && n.atividadeId === atividadeId);
      return nota ? nota.valor : '';
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-2">
                {[1, 2, 3, 4].map(b => (
                    <button
                        key={b}
                        onClick={() => setActiveBimester(b)}
                        className={`px-4 py-2 rounded ${activeBimester === b ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                        {b}º Bimestre
                    </button>
                ))}
            </div>
            <button
                onClick={() => setShowConfig(!showConfig)}
                className="flex items-center text-gray-600 hover:text-blue-600"
            >
                <Settings className="mr-1" /> Configurar Fórmulas
            </button>
        </div>

        {showConfig && (
            <div className="bg-yellow-50 p-4 border border-yellow-200 rounded mb-4">
                <h4 className="font-bold mb-2">Configuração de Cálculo - {activeBimester}º Bimestre</h4>
                <div className="flex gap-4 items-center">
                    <select
                        value={config.formula}
                        onChange={e => setConfig({...config, formula: e.target.value})}
                        className="p-2 border rounded"
                    >
                        <option value="SOMA">Soma Simples (Acumular Pontos)</option>
                        <option value="CUSTOM_TRABALHO_PROVA">Média: (Soma Trabalhos + Soma Provas) / 2</option>
                    </select>
                    <button onClick={salvarConfig} className="bg-blue-500 text-white px-4 py-2 rounded">Salvar Regra</button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                    * A regra selecionada afetará como a nota final deste bimestre é calculada no Boletim.
                </p>
            </div>
        )}

        {/* Create Activity */}
        <div className="bg-white p-4 mb-6 border rounded shadow-sm">
            <h4 className="font-bold mb-2 text-sm uppercase text-gray-500">Nova Atividade</h4>
            <form onSubmit={criarAtividade} className="flex gap-4 items-end flex-wrap">
                <div>
                    <label className="block text-xs mb-1">Nome</label>
                    <input
                        type="text"
                        value={newActName} onChange={e => setNewActName(e.target.value)}
                        className="border p-2 rounded w-40" placeholder="Ex: Prova 1"
                    />
                </div>
                <div>
                    <label className="block text-xs mb-1">Categoria</label>
                    <select
                        value={newActCat} onChange={e => setNewActCat(e.target.value)}
                        className="border p-2 rounded w-32"
                    >
                        <option value="TRABALHO">Trabalho</option>
                        <option value="PROVA">Prova</option>
                        <option value="CONCEITO">Conceito</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs mb-1">Valor Max</label>
                    <input
                        type="number"
                        value={newActMax} onChange={e => setNewActMax(e.target.value)}
                        className="border p-2 rounded w-20"
                    />
                </div>
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded flex items-center mb-px">
                    <Plus size={16} className="mr-1" /> Criar
                </button>
            </form>
        </div>

        {/* Gradebook Table */}
        <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-200">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border p-2 text-left w-64 sticky left-0 bg-gray-100">Aluno</th>
                        {atividades.map(ativ => (
                            <th key={ativ.id} className="border p-2 text-center min-w-[100px]">
                                <div className="text-sm font-bold">{ativ.nome}</div>
                                <div className="text-xs text-gray-500">{ativ.categoria} (Max {ativ.valorMaximo})</div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {alunos.map(aluno => (
                        <tr key={aluno.id} className="hover:bg-gray-50">
                            <td className="border p-2 font-medium sticky left-0 bg-white">{aluno.nome}</td>
                            {atividades.map(ativ => (
                                <td key={ativ.id} className="border p-2 text-center">
                                    <input
                                        type="number"
                                        className="w-16 p-1 border rounded text-center focus:ring-2 focus:ring-blue-500 outline-none"
                                        defaultValue={getNota(aluno.id, ativ.id)}
                                        onBlur={(e) => salvarNota(aluno.id, ativ.id, e.target.value)}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {atividades.length === 0 && <div className="p-8 text-center text-gray-500">Nenhuma atividade criada para este bimestre.</div>}
        </div>
    </div>
  );
}
