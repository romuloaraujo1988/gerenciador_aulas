import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { School, Plus, GraduationCap } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

export default function Dashboard() {
  const [escolas, setEscolas] = useState([]);
  const [novaEscola, setNovaEscola] = useState('');

  useEffect(() => {
    carregarEscolas();
  }, []);

  const carregarEscolas = async () => {
    const res = await axios.get(`${API_URL}/escolas`);
    setEscolas(res.data);
  };

  const criarEscola = async (e) => {
    e.preventDefault();
    if (!novaEscola) return;
    await axios.post(`${API_URL}/escolas`, { nome: novaEscola });
    setNovaEscola('');
    carregarEscolas();
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-gray-800">Minhas Escolas</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {escolas.map(escola => (
          <Link key={escola.id} to={`/escola/${escola.id}`} className="block">
            <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-blue-500">
              <div className="flex items-center mb-4">
                <School className="text-blue-500 mr-2" size={24} />
                <h3 className="text-xl font-semibold text-gray-800">{escola.nome}</h3>
              </div>
              <p className="text-gray-600">{escola.turmas ? escola.turmas.length : 0} Turmas</p>
            </div>
          </Link>
        ))}

        <div className="bg-white p-6 rounded-lg shadow-md border-2 border-dashed border-gray-300 flex flex-col justify-center items-center">
          <form onSubmit={criarEscola} className="w-full">
            <h3 className="text-lg font-medium text-gray-700 mb-2 text-center">Adicionar Nova Escola</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome da Escola"
                className="flex-grow p-2 border rounded"
                value={novaEscola}
                onChange={e => setNovaEscola(e.target.value)}
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
