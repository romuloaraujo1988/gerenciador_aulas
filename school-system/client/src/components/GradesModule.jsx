import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Settings, Plus, Save, Sparkles } from 'lucide-react';

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

  // IA Activity Form
  const [showIAGenerator, setShowIAGenerator] = useState(false);
  const [temaIA, setTemaIA] = useState('');
  const [tipoIA, setTipoIA] = useState('QUIZ');
  const [loadingIA, setLoadingIA] = useState(false);
  const [geradoIA, setGeradoIA] = useState(null);
  const [permiteVariasTentativas, setPermiteVariasTentativas] = useState(false);

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

  const gerarAtividadeIA = async (e) => {
    e.preventDefault();
    setLoadingIA(true);
    setGeradoIA(null);
    try {
      const res = await axios.post(`${API_URL}/ia/gerar-atividade`, {
        tema: temaIA,
        tipo: tipoIA
      });
      setGeradoIA(res.data);
    } catch (error) {
      console.error(error);
      alert('Erro ao gerar atividade com IA. Verifique a chave da API.');
    } finally {
      setLoadingIA(false);
    }
  };

  const salvarAtividadeIA = async () => {
    if (!geradoIA) return;

    await axios.post(`${API_URL}/atividades`, {
        nome: geradoIA.titulo || `Atividade de IA - ${temaIA}`,
        categoria: tipoIA === 'QUIZ' ? 'QUIZ_IA' : 'FLASHCARD_IA',
        tipo: tipoIA,
        conteudo: geradoIA,
        valorMaximo: 10, // Default for IA games
        bimestre: activeBimester,
        data: new Date(),
        disciplinaId: disciplina.id,
        permiteVariasTentativas
    });

    setShowIAGenerator(false);
    setTemaIA('');
    setGeradoIA(null);
    carregarDados();
  };

  const updateQuizQuestion = (qIndex, field, value) => {
    const updated = { ...geradoIA };
    updated.questoes[qIndex][field] = value;
    setGeradoIA(updated);
  };

  const updateQuizOption = (qIndex, optIndex, value) => {
    const updated = { ...geradoIA };
    updated.questoes[qIndex].opcoes[optIndex] = value;
    setGeradoIA(updated);
  };

  const updateFlashcard = (cIndex, field, value) => {
    const updated = { ...geradoIA };
    updated.cards[cIndex][field] = value;
    setGeradoIA(updated);
  };

  const updateFillBlanks = (fIndex, field, value) => {
    const updated = { ...geradoIA };
    updated.frases[fIndex][field] = value;
    setGeradoIA(updated);
  };

  const updateFillBlanksFalsas = (fIndex, optIndex, value) => {
    const updated = { ...geradoIA };
    updated.frases[fIndex].opcoesFalsas[optIndex] = value;
    setGeradoIA(updated);
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

        <div className="flex gap-4 mb-6">
            <button
                onClick={() => setShowIAGenerator(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded flex items-center shadow hover:bg-purple-700 transition"
            >
                <Sparkles size={18} className="mr-2" /> Gerar Jogo com IA
            </button>
        </div>

        {/* Modal/Formulário de IA */}
        {showIAGenerator && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl mt-10">
                    <h3 className="text-xl font-bold mb-4 text-purple-700 flex items-center">
                        <Sparkles size={24} className="mr-2" /> Criar Jogo com Inteligência Artificial
                    </h3>

                    {!geradoIA && (
                        <form onSubmit={gerarAtividadeIA}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Tema da Atividade</label>
                                <input
                                    type="text"
                                    value={temaIA}
                                    onChange={(e) => setTemaIA(e.target.value)}
                                    placeholder="Ex: Revolução Industrial, Equações de 2º Grau..."
                                    className="w-full p-3 border rounded focus:ring-2 focus:ring-purple-500 outline-none"
                                    required
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium mb-1">Formato do Jogo</label>
                                <select
                                    value={tipoIA}
                                    onChange={(e) => setTipoIA(e.target.value)}
                                    className="w-full p-3 border rounded focus:ring-2 focus:ring-purple-500 outline-none"
                                >
                                    <option value="QUIZ">Quiz Interativo (Múltipla Escolha)</option>
                                    <option value="FLASHCARD">Flashcards (Memorização)</option>
                                    <option value="FILL_BLANKS">Preencher Lacunas</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setShowIAGenerator(false)} className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100">Cancelar</button>
                                <button type="submit" disabled={loadingIA} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center">
                                    {loadingIA ? 'Gerando...' : 'Gerar com IA'}
                                </button>
                            </div>
                        </form>
                    )}

                    {geradoIA && (
                        <div>
                            <div className="bg-green-50 border border-green-200 p-4 rounded mb-4 max-h-96 overflow-y-auto">
                                <h4 className="font-bold text-green-800 mb-2">Sucesso! Pré-visualização gerada:</h4>
                                <h5 className="font-bold text-lg">{geradoIA.titulo}</h5>

                                {tipoIA === 'QUIZ' && geradoIA.questoes?.map((q, idx) => (
                                    <div key={idx} className="mt-3 p-3 bg-white rounded border">
                                        <div className="flex items-center mb-2">
                                          <span className="font-bold mr-2">{idx + 1}.</span>
                                          <input
                                            className="w-full border p-1 rounded font-semibold text-gray-800"
                                            value={q.pergunta}
                                            onChange={(e) => updateQuizQuestion(idx, 'pergunta', e.target.value)}
                                          />
                                        </div>
                                        <div className="mt-2 space-y-2 pl-6">
                                            {q.opcoes.map((op, i) => (
                                                <div key={i} className="flex items-center">
                                                    <input
                                                      type="radio"
                                                      checked={q.respostaCorretaIndex === i}
                                                      onChange={() => updateQuizQuestion(idx, 'respostaCorretaIndex', i)}
                                                      className="mr-2"
                                                      name={`questao_${idx}`}
                                                    />
                                                    <input
                                                      className={`w-full border p-1 rounded text-sm ${q.respostaCorretaIndex === i ? 'border-green-400 bg-green-50' : ''}`}
                                                      value={op}
                                                      onChange={(e) => updateQuizOption(idx, i, e.target.value)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {tipoIA === 'FILL_BLANKS' && geradoIA.frases?.map((f, idx) => (
                                    <div key={idx} className="mt-3 p-3 bg-white rounded border">
                                        <div className="mb-2">
                                          <span className="text-xs text-purple-600 font-bold block mb-1">Frase com ___ (lacuna)</span>
                                          <input
                                            className="w-full border p-1 rounded text-sm"
                                            value={f.textoComLacuna}
                                            onChange={(e) => updateFillBlanks(idx, 'textoComLacuna', e.target.value)}
                                          />
                                        </div>
                                        <div className="flex gap-2">
                                          <div className="w-1/3">
                                            <span className="text-xs text-green-600 font-bold block mb-1">Palavra Correta</span>
                                            <input
                                              className="w-full border border-green-300 bg-green-50 p-1 rounded text-sm"
                                              value={f.palavraCorreta}
                                              onChange={(e) => updateFillBlanks(idx, 'palavraCorreta', e.target.value)}
                                            />
                                          </div>
                                          <div className="w-2/3">
                                            <span className="text-xs text-red-600 font-bold block mb-1">Opções Falsas</span>
                                            <div className="flex gap-1">
                                              {f.opcoesFalsas.map((opt, optIdx) => (
                                                <input
                                                  key={optIdx}
                                                  className="w-full border border-red-200 bg-red-50 p-1 rounded text-sm"
                                                  value={opt}
                                                  onChange={(e) => updateFillBlanksFalsas(idx, optIdx, e.target.value)}
                                                />
                                              ))}
                                            </div>
                                          </div>
                                        </div>
                                    </div>
                                ))}

                                {tipoIA === 'FLASHCARD' && geradoIA.cards?.map((c, idx) => (
                                    <div key={idx} className="mt-3 flex gap-2">
                                        <div className="flex-1">
                                          <span className="text-xs text-blue-500 font-bold block mb-1">Frente</span>
                                          <textarea
                                            className="w-full p-2 bg-blue-50 border rounded text-sm h-20"
                                            value={c.frente}
                                            onChange={(e) => updateFlashcard(idx, 'frente', e.target.value)}
                                          />
                                        </div>
                                        <div className="flex-1">
                                          <span className="text-xs text-yellow-600 font-bold block mb-1">Verso</span>
                                          <textarea
                                            className="w-full p-2 bg-yellow-50 border rounded text-sm h-20"
                                            value={c.verso}
                                            onChange={(e) => updateFlashcard(idx, 'verso', e.target.value)}
                                          />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-col md:flex-row justify-between items-center mt-6 p-4 bg-gray-50 border-t rounded-b-lg">
                                <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer mb-4 md:mb-0">
                                    <input
                                        type="checkbox"
                                        checked={permiteVariasTentativas}
                                        onChange={(e) => setPermiteVariasTentativas(e.target.checked)}
                                        className="mr-2 h-4 w-4 text-purple-600 rounded"
                                    />
                                    Permitir que o aluno jogue múltiplas vezes (Salva a maior pontuação)
                                </label>
                                <div className="flex gap-2">
                                    <button onClick={() => setGeradoIA(null)} className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100">Gerar Novamente</button>
                                    <button onClick={salvarAtividadeIA} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center">
                                        <Save size={18} className="mr-2" /> Salvar Atividade
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Create Activity (Manual) */}
        <div className="bg-white p-4 mb-6 border rounded shadow-sm">
            <h4 className="font-bold mb-2 text-sm uppercase text-gray-500">Nova Avaliação Manual</h4>
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
