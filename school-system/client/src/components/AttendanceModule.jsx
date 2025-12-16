import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Save, CheckCircle, XCircle } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

export default function AttendanceModule({ disciplina }) {
  const [dataChamada, setDataChamada] = useState(new Date().toISOString().split('T')[0]);
  const [alunos, setAlunos] = useState([]);
  const [presencas, setPresencas] = useState({}); // { alunoId: boolean }
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    // Alunos come nested in disciplina from the endpoint used in SubjectView?
    // Let's check backend: app.get('/api/disciplinas/:id' ... include: { turma: { include: { alunos: true } } }
    if (disciplina?.turma?.alunos) {
        setAlunos(disciplina.turma.alunos);
        // Default everyone to present
        const initialPresencas = {};
        disciplina.turma.alunos.forEach(a => initialPresencas[a.id] = true);
        setPresencas(initialPresencas);
    }
  }, [disciplina]);

  const togglePresenca = (alunoId) => {
    setPresencas(prev => ({
        ...prev,
        [alunoId]: !prev[alunoId]
    }));
  };

  const salvarChamada = async () => {
    setLoading(true);
    try {
        const payload = {
            data: dataChamada,
            disciplinaId: disciplina.id,
            presencas: Object.keys(presencas).map(alunoId => ({
                alunoId: Number(alunoId),
                presente: presencas[alunoId]
            }))
        };
        await axios.post(`${API_URL}/chamadas`, payload);
        setSuccessMsg('Chamada salva com sucesso!');
        setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error) {
        console.error(error);
        alert('Erro ao salvar chamada');
    }
    setLoading(false);
  };

  return (
    <div>
        <div className="flex items-center justify-between mb-6 bg-gray-50 p-4 rounded">
            <div className="flex items-center">
                <Calendar className="mr-2 text-gray-600" />
                <label className="mr-2 font-medium">Data da Aula:</label>
                <input
                    type="date"
                    value={dataChamada}
                    onChange={(e) => setDataChamada(e.target.value)}
                    className="border p-2 rounded"
                />
            </div>
            <button
                onClick={salvarChamada}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded flex items-center hover:bg-blue-700 disabled:opacity-50"
            >
                <Save className="mr-2" size={18} />
                {loading ? 'Salvando...' : 'Salvar Chamada'}
            </button>
        </div>

        {successMsg && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded text-center font-bold">
                {successMsg}
            </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {alunos.map(aluno => {
                const isPresent = presencas[aluno.id];
                return (
                    <div
                        key={aluno.id}
                        onClick={() => togglePresenca(aluno.id)}
                        className={`
                            cursor-pointer p-4 rounded-lg shadow border-2 transition-all flex flex-col items-center justify-center text-center h-32
                            ${isPresent ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}
                        `}
                    >
                        <h4 className="font-bold text-gray-800 text-lg mb-2">{aluno.nome}</h4>
                        {isPresent ? (
                            <div className="flex items-center text-green-600 font-bold">
                                <CheckCircle size={24} className="mr-1" /> Presente
                            </div>
                        ) : (
                            <div className="flex items-center text-red-600 font-bold">
                                <XCircle size={24} className="mr-1" /> Faltou
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    </div>
  );
}
