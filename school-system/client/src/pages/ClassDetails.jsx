import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { User, Book, ClipboardList, CheckSquare } from 'lucide-react';
import ClassStudents from '../components/ClassStudents';
import ClassSubjects from '../components/ClassSubjects';

const API_URL = 'http://localhost:3001/api';

export default function ClassDetails() {
  const { id } = useParams();
  const [turma, setTurma] = useState(null);
  const [activeTab, setActiveTab] = useState('disciplinas'); // disciplinas, alunos

  useEffect(() => {
    carregarTurma();
  }, [id]);

  const carregarTurma = async () => {
    const res = await axios.get(`${API_URL}/turmas/${id}`);
    setTurma(res.data);
  };

  if (!turma) return <div>Carregando...</div>;

  return (
    <div>
      <div className="flex items-center mb-6">
        <Link to={`/escola/${turma.escolaId}`} className="text-blue-500 hover:underline mr-4">← Voltar para Escola</Link>
        <h2 className="text-3xl font-bold text-gray-800">{turma.nome}</h2>
      </div>

      <div className="flex border-b mb-6">
        <button
          className={`py-2 px-4 ${activeTab === 'disciplinas' ? 'border-b-2 border-blue-500 text-blue-600 font-bold' : 'text-gray-600'}`}
          onClick={() => setActiveTab('disciplinas')}
        >
          Disciplinas
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'alunos' ? 'border-b-2 border-blue-500 text-blue-600 font-bold' : 'text-gray-600'}`}
          onClick={() => setActiveTab('alunos')}
        >
          Alunos
        </button>
      </div>

      {activeTab === 'disciplinas' && (
        <ClassSubjects turmaId={id} />
      )}

      {activeTab === 'alunos' && (
        <ClassStudents turmaId={id} />
      )}
    </div>
  );
}
