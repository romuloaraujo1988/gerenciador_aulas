import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

export default function GamePlayer() {
  const { atividadeId } = useParams();
  const navigate = useNavigate();

  const [aluno, setAluno] = useState(null);
  const [atividade, setAtividade] = useState(null);
  const [conteudo, setConteudo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Game State
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(null);

  // Flashcard State
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem('alunoData');
    if (!data) {
      navigate('/aluno/login');
      return;
    }
    setAluno(JSON.parse(data));
    carregarAtividade();
  }, [atividadeId, navigate]);

  const carregarAtividade = async () => {
    try {
      // Como não temos um endpoint para uma atividade específica, buscamos as disciplinas e iteramos
      // Em um app real, o ideal é criar app.get('/api/atividades/:id')
      // Vamos tentar buscar a atividade via endpoint (iremos criar no backend se não houver, mas por hora vamos fazer um workaround buscando todas e filtrando)
      const res = await axios.get(`${API_URL}/atividades/${atividadeId}`);

      const ativ = res.data;
      setAtividade(ativ);
      if (ativ.conteudo) {
        setConteudo(JSON.parse(ativ.conteudo));
      }
    } catch (err) {
      console.error(err);
      // Fallback
      alert('Erro ao carregar atividade.');
      navigate('/aluno/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerOptionClick = (index) => {
    if (selectedAnswer !== null) return; // Prevent multiple clicks

    setSelectedAnswer(index);
    const correct = index === conteudo.questoes[currentQuestion].respostaCorretaIndex;
    setIsAnswerCorrect(correct);

    if (correct) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setIsAnswerCorrect(null);

    const nextQuestion = currentQuestion + 1;
    if (nextQuestion < conteudo.questoes.length) {
      setCurrentQuestion(nextQuestion);
    } else {
      finishGame();
    }
  };

  const finishGame = async (pontosPersonalizados = null) => {
    let finalScore = pontosPersonalizados !== null ? pontosPersonalizados : score;
    let pontosCalculados = 0;

    if (atividade.tipo === 'QUIZ') {
      const maxScore = conteudo.questoes.length;
      pontosCalculados = (finalScore / maxScore) * atividade.valorMaximo;
    } else if (atividade.tipo === 'FLASHCARD') {
      pontosCalculados = atividade.valorMaximo; // Fez os flashcards, ganha nota máxima
    }

    try {
      await axios.post(`${API_URL}/notas`, {
        valor: pontosCalculados,
        alunoId: aluno.id,
        atividadeId: atividade.id
      });
      setShowResult(true);
    } catch (err) {
      console.error("Erro ao salvar nota:", err);
      alert('Erro ao salvar sua nota. Avise seu professor.');
    }
  };

  if (loading) return <div className="p-8 text-center">Carregando Jogo...</div>;
  if (!atividade || !conteudo) return <div className="p-8 text-center text-red-500">Jogo não encontrado ou sem conteúdo!</div>;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <button onClick={() => navigate('/aluno/dashboard')} className="flex items-center text-gray-500 hover:text-blue-600 mb-6">
        <ArrowLeft className="mr-2" /> Voltar para Minhas Missões
      </button>

      {/* QUIZ INTERFACE */}
      {atividade.tipo === 'QUIZ' && !showResult && (
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-10 border-t-8 border-purple-500">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{conteudo.titulo}</h2>
            <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-bold">
              Questão {currentQuestion + 1} de {conteudo.questoes.length}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl md:text-2xl font-medium text-gray-700">
              {conteudo.questoes[currentQuestion].pergunta}
            </h3>
          </div>

          <div className="space-y-3">
            {conteudo.questoes[currentQuestion].opcoes.map((opcao, index) => {
              let buttonClass = "w-full text-left p-4 rounded-lg border-2 font-medium transition-all text-lg ";

              if (selectedAnswer === null) {
                buttonClass += "border-gray-200 hover:border-purple-500 hover:bg-purple-50";
              } else {
                if (index === conteudo.questoes[currentQuestion].respostaCorretaIndex) {
                  buttonClass += "bg-green-100 border-green-500 text-green-800";
                } else if (index === selectedAnswer) {
                  buttonClass += "bg-red-100 border-red-500 text-red-800";
                } else {
                  buttonClass += "border-gray-200 opacity-50";
                }
              }

              return (
                <button
                  key={index}
                  className={buttonClass}
                  onClick={() => handleAnswerOptionClick(index)}
                  disabled={selectedAnswer !== null}
                >
                  <span className="inline-block w-8 h-8 rounded-full bg-white text-center leading-8 border border-gray-300 mr-3">
                    {['A', 'B', 'C', 'D'][index]}
                  </span>
                  {opcao}
                </button>
              );
            })}
          </div>

          {selectedAnswer !== null && (
            <div className={`mt-6 p-4 rounded-lg flex items-start ${isAnswerCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="mr-3 mt-1">
                {isAnswerCorrect ? <CheckCircle className="text-green-500" size={24} /> : <XCircle className="text-red-500" size={24} />}
              </div>
              <div className="flex-grow">
                <p className={`font-bold ${isAnswerCorrect ? 'text-green-800' : 'text-red-800'}`}>
                  {isAnswerCorrect ? 'Correto!' : 'Ops, não foi dessa vez!'}
                </p>
                <p className="text-gray-700 mt-1">
                  {isAnswerCorrect
                    ? conteudo.questoes[currentQuestion].feedbackCorreto
                    : conteudo.questoes[currentQuestion].feedbackIncorreto}
                </p>
              </div>
              <button
                onClick={handleNextQuestion}
                className="ml-4 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg whitespace-nowrap"
              >
                Próxima →
              </button>
            </div>
          )}
        </div>
      )}

      {/* FLASHCARD INTERFACE */}
      {atividade.tipo === 'FLASHCARD' && !showResult && (
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-10 border-t-8 border-blue-500">
           <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{conteudo.titulo}</h2>
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-bold">
              Card {currentQuestion + 1} de {conteudo.cards.length}
            </div>
          </div>

          <div
            className={`min-h-[300px] w-full cursor-pointer perspective-1000 flex items-center justify-center p-8 rounded-xl border-4 ${isFlipped ? 'border-yellow-400 bg-yellow-50' : 'border-blue-400 bg-blue-50'}`}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className="text-center">
              <span className={`block mb-4 font-bold tracking-widest uppercase ${isFlipped ? 'text-yellow-600' : 'text-blue-600'}`}>
                {isFlipped ? 'Verso' : 'Frente'}
              </span>
              <h3 className="text-2xl md:text-3xl font-medium text-gray-800">
                {isFlipped ? conteudo.cards[currentQuestion].verso : conteudo.cards[currentQuestion].frente}
              </h3>
              <p className="mt-8 text-sm text-gray-400">Clique no card para virar</p>
            </div>
          </div>

          <div className="mt-8 flex justify-center gap-4">
             <button
                onClick={() => {
                    setIsFlipped(false);
                    const next = currentQuestion + 1;
                    if (next < conteudo.cards.length) setCurrentQuestion(next);
                    else finishGame();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md text-lg w-full"
              >
                {currentQuestion + 1 < conteudo.cards.length ? 'Próximo Card →' : 'Finalizar Estudo'}
              </button>
          </div>
        </div>
      )}

      {/* RESULT SCREEN */}
      {showResult && (
        <div className="bg-white rounded-xl shadow-lg p-10 text-center">
          <Trophy className="mx-auto text-yellow-500 mb-6" size={80} />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Missão Concluída!</h2>
          <p className="text-gray-600 mb-8">Parabéns por completar a atividade.</p>

          {atividade.tipo === 'QUIZ' && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8 inline-block">
              <p className="text-lg text-gray-700">Você acertou</p>
              <p className="text-5xl font-bold text-purple-600 my-2">{score} de {conteudo.questoes.length}</p>
              <p className="text-sm text-gray-500">Sua nota foi enviada ao professor!</p>
            </div>
          )}

          {atividade.tipo === 'FLASHCARD' && (
             <div className="bg-gray-50 rounded-lg p-6 mb-8 inline-block">
               <p className="text-lg text-gray-700 mb-2">Estudo Finalizado!</p>
               <p className="text-sm text-gray-500">Sua participação foi registrada.</p>
             </div>
          )}

          <div>
            <button
              onClick={() => navigate('/aluno/dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-colors"
            >
              Voltar para Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
