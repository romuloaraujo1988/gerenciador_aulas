import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export default function ReportsModule({ disciplina }) {
  const [boletim, setBoletim] = useState([]);

  useEffect(() => {
    carregarBoletim();
  }, [disciplina]);

  const carregarBoletim = async () => {
    const res = await axios.get(`${API_URL}/disciplinas/${disciplina.id}/boletim`);
    setBoletim(res.data);
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-800">Relatório Final - {disciplina.nome}</h3>
            <button onClick={carregarBoletim} className="text-blue-600 hover:underline">Atualizar Relatório</button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden border">
            <table className="min-w-full">
                <thead className="bg-gray-800 text-white">
                    <tr>
                        <th className="py-3 px-4 text-left">Aluno</th>
                        <th className="py-3 px-4 text-center">1º Bim</th>
                        <th className="py-3 px-4 text-center">2º Bim</th>
                        <th className="py-3 px-4 text-center">3º Bim</th>
                        <th className="py-3 px-4 text-center">4º Bim</th>
                        <th className="py-3 px-4 text-center bg-gray-700">Total</th>
                        <th className="py-3 px-4 text-center">Frequência</th>
                        <th className="py-3 px-4 text-center">Situação</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {boletim.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{item.aluno.nome}</td>
                            <td className="py-3 px-4 text-center">{item.notasBimestre[1] || '-'}</td>
                            <td className="py-3 px-4 text-center">{item.notasBimestre[2] || '-'}</td>
                            <td className="py-3 px-4 text-center">{item.notasBimestre[3] || '-'}</td>
                            <td className="py-3 px-4 text-center">{item.notasBimestre[4] || '-'}</td>
                            <td className="py-3 px-4 text-center font-bold bg-gray-50">{item.totalPontos.toFixed(1)}</td>
                            <td className={`py-3 px-4 text-center ${item.frequencia < 75 ? 'text-red-600 font-bold' : 'text-green-600'}`}>
                                {item.frequencia.toFixed(1)}%
                            </td>
                            <td className="py-3 px-4 text-center">
                                {item.aprovado ? (
                                    <span className="bg-green-100 text-green-800 py-1 px-3 rounded-full text-xs font-bold">APROVADO</span>
                                ) : (
                                    <span className="bg-red-100 text-red-800 py-1 px-3 rounded-full text-xs font-bold">REPROVADO</span>
                                )}
                            </td>
                        </tr>
                    ))}
                    {boletim.length === 0 && (
                        <tr><td colSpan="8" className="p-4 text-center text-gray-500">Nenhum dado disponível.</td></tr>
                    )}
                </tbody>
            </table>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded text-sm text-gray-600">
            <strong>Critérios de Aprovação:</strong> Total de Pontos &ge; 24.0 e Frequência &ge; 75%.
        </div>
    </div>
  );
}
