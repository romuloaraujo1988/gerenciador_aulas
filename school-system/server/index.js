require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// --- Escolas ---
app.get('/api/escolas', async (req, res) => {
  const escolas = await prisma.escola.findMany({ include: { turmas: true } });
  res.json(escolas);
});

app.post('/api/escolas', async (req, res) => {
  const { nome } = req.body;
  const escola = await prisma.escola.create({ data: { nome } });
  res.json(escola);
});

// --- Turmas ---
app.get('/api/turmas', async (req, res) => {
  const { escolaId } = req.query;
  const where = escolaId ? { escolaId: Number(escolaId) } : {};
  const turmas = await prisma.turma.findMany({
    where,
    include: { escola: true, disciplinas: true }
  });
  res.json(turmas);
});

app.get('/api/turmas/:id', async (req, res) => {
  const { id } = req.params;
  const turma = await prisma.turma.findUnique({
    where: { id: Number(id) },
    include: { alunos: true, disciplinas: true }
  });
  res.json(turma);
});

app.post('/api/turmas', async (req, res) => {
  const { nome, escolaId } = req.body;
  const turma = await prisma.turma.create({
    data: { nome, escolaId: Number(escolaId) }
  });
  res.json(turma);
});

// --- Alunos ---
app.post('/api/alunos', async (req, res) => {
  const { nome, turmaId, login, senha } = req.body;
  try {
    let hashedSenha = null;
    if (senha) {
      hashedSenha = await bcrypt.hash(senha, 10);
    }

    const aluno = await prisma.aluno.create({
      data: {
        nome,
        turmaId: Number(turmaId),
        login,
        senha: hashedSenha
      }
    });
    // Remove senha from response
    const { senha: _, ...alunoSemSenha } = aluno;
    res.json(alunoSemSenha);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Login já existe' });
    }
    res.status(500).json({ error: 'Erro ao criar aluno' });
  }
});

app.get('/api/turmas/:id/alunos', async (req, res) => {
  const { id } = req.params;
  const alunos = await prisma.aluno.findMany({
    where: { turmaId: Number(id) }
  });
  res.json(alunos);
});

// --- Disciplinas ---
app.post('/api/disciplinas', async (req, res) => {
  const { nome, turmaId } = req.body;
  const disciplina = await prisma.disciplina.create({
    data: { nome, turmaId: Number(turmaId) }
  });
  res.json(disciplina);
});

app.get('/api/disciplinas/:id', async (req, res) => {
  const { id } = req.params;
  const disciplina = await prisma.disciplina.findUnique({
    where: { id: Number(id) },
    include: {
        turma: { include: { alunos: true } },
        atividades: true,
        configs: true
    }
  });
  res.json(disciplina);
});

// --- Configuração Bimestre ---
app.post('/api/configuracoes', async (req, res) => {
  const { disciplinaId, bimestre, formula, meta } = req.body;
  // Upsert config
  const existing = await prisma.configuracaoBimestre.findFirst({
    where: { disciplinaId: Number(disciplinaId), bimestre: Number(bimestre) }
  });

  if (existing) {
    const updated = await prisma.configuracaoBimestre.update({
      where: { id: existing.id },
      data: { formula, meta }
    });
    return res.json(updated);
  }

  const config = await prisma.configuracaoBimestre.create({
    data: { disciplinaId: Number(disciplinaId), bimestre: Number(bimestre), formula, meta }
  });
  res.json(config);
});

// --- Login de Aluno ---
app.post('/api/auth/aluno', async (req, res) => {
  const { login, senha } = req.body;
  if (!login || !senha) {
    return res.status(400).json({ error: 'Login e senha são obrigatórios' });
  }

  const aluno = await prisma.aluno.findUnique({
    where: { login },
    include: { turma: { include: { disciplinas: true } } }
  });

  if (!aluno || !aluno.senha) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const validPassword = await bcrypt.compare(senha, aluno.senha);
  if (!validPassword) {
      // Para retrocompatibilidade com alunos criados antes do hash
      if (aluno.senha === senha) {
          // Opcional: atualizar a senha para hash aqui
      } else {
          return res.status(401).json({ error: 'Credenciais inválidas' });
      }
  }

  // Remove a senha antes de enviar para o frontend
  const { senha: _, ...alunoSemSenha } = aluno;
  res.json(alunoSemSenha);
});

// --- IA: Gerar Atividade ---
app.post('/api/ia/gerar-atividade', async (req, res) => {
  const { tema, tipo, faixaEtaria = '14 a 18 anos' } = req.body;

  if (!tema || !tipo) {
    return res.status(400).json({ error: 'Tema e tipo são obrigatórios' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Chave da API do Gemini não configurada' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { responseMimeType: "application/json" } });

    let prompt = '';
    if (tipo === 'QUIZ') {
      prompt = `Crie um quiz interativo e divertido para adolescentes de ${faixaEtaria} sobre o tema "${tema}".
      Retorne APENAS um JSON válido no seguinte formato:
      {
        "titulo": "Nome do Quiz",
        "questoes": [
          {
            "pergunta": "Texto da pergunta",
            "opcoes": ["Opção A", "Opção B", "Opção C", "Opção D"],
            "respostaCorretaIndex": 0,
            "feedbackCorreto": "Mensagem motivacional de acerto",
            "feedbackIncorreto": "Mensagem explicativa do erro"
          }
        ]
      }
      Certifique-se de incluir no mínimo 3 e no máximo 5 questões.`;
    } else if (tipo === 'FLASHCARD') {
      prompt = `Crie uma série de flashcards interativos para adolescentes de ${faixaEtaria} sobre o tema "${tema}".
      Retorne APENAS um JSON válido no seguinte formato:
      {
        "titulo": "Nome dos Flashcards",
        "cards": [
          {
            "frente": "Conceito ou Pergunta",
            "verso": "Definição ou Resposta detalhada"
          }
        ]
      }
      Certifique-se de incluir no mínimo 5 e no máximo 8 cards.`;
    } else {
      return res.status(400).json({ error: 'Tipo de atividade não suportado' });
    }

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse the JSON to ensure it's valid before returning
    const parsedData = JSON.parse(responseText);
    res.json(parsedData);
  } catch (error) {
    console.error('Erro ao gerar atividade com IA:', error);
    res.status(500).json({ error: 'Erro ao gerar atividade com IA', detalhes: error.message });
  }
});

// --- Atividades ---
app.get('/api/atividades/:id', async (req, res) => {
  const { id } = req.params;
  const atividade = await prisma.atividade.findUnique({
    where: { id: Number(id) }
  });
  if (!atividade) return res.status(404).json({ error: 'Atividade não encontrada' });
  res.json(atividade);
});

app.post('/api/atividades', async (req, res) => {
  const { nome, data, bimestre, categoria, valorMaximo, disciplinaId, tipo, conteudo } = req.body;
  const atividade = await prisma.atividade.create({
    data: {
      nome,
      data: new Date(data),
      bimestre: Number(bimestre),
      categoria,
      valorMaximo: Number(valorMaximo),
      disciplinaId: Number(disciplinaId),
      tipo,
      conteudo: conteudo ? JSON.stringify(conteudo) : null
    }
  });
  res.json(atividade);
});

app.get('/api/disciplinas/:id/atividades', async (req, res) => {
    const { id } = req.params;
    const { bimestre } = req.query;
    const where = { disciplinaId: Number(id) };
    if (bimestre) where.bimestre = Number(bimestre);

    const atividades = await prisma.atividade.findMany({ where });
    res.json(atividades);
});

// --- Notas ---
app.post('/api/notas', async (req, res) => {
  const { valor, alunoId, atividadeId } = req.body;

  // Check if grade exists
  const existing = await prisma.nota.findFirst({
    where: { alunoId: Number(alunoId), atividadeId: Number(atividadeId) }
  });

  if (existing) {
    const updated = await prisma.nota.update({
      where: { id: existing.id },
      data: { valor: Number(valor) }
    });
    return res.json(updated);
  }

  const nota = await prisma.nota.create({
    data: { valor: Number(valor), alunoId: Number(alunoId), atividadeId: Number(atividadeId) }
  });
  res.json(nota);
});

app.get('/api/disciplinas/:id/notas', async (req, res) => {
    // Get all grades for a subject (all students, all activities)
    const { id } = req.params;
    // We can join tables to get everything needed for the gradebook
    const notas = await prisma.nota.findMany({
        where: {
            atividade: {
                disciplinaId: Number(id)
            }
        },
        include: {
            atividade: true,
            aluno: true
        }
    });
    res.json(notas);
});

// --- Chamada (Presença) ---
app.post('/api/chamadas', async (req, res) => {
    const { data, disciplinaId, presencas } = req.body;
    // presencas: [{ alunoId: 1, presente: true }, ...]

    // Create Chamada record
    const chamada = await prisma.chamada.create({
        data: {
            data: new Date(data),
            disciplinaId: Number(disciplinaId)
        }
    });

    // Create Presenca records
    const presencaData = presencas.map(p => ({
        chamadaId: chamada.id,
        alunoId: p.alunoId,
        presente: p.presente
    }));

    await prisma.presenca.createMany({ data: presencaData });

    res.json(chamada);
});

app.get('/api/disciplinas/:id/chamadas', async (req, res) => {
    const { id } = req.params;
    const chamadas = await prisma.chamada.findMany({
        where: { disciplinaId: Number(id) },
        include: { presencas: true },
        orderBy: { data: 'desc' }
    });
    res.json(chamadas);
});

// --- Boletim / Relatório Final ---
app.get('/api/disciplinas/:id/boletim', async (req, res) => {
    const { id } = req.params;

    // Fetch necessary data
    const disciplina = await prisma.disciplina.findUnique({ where: { id: Number(id) } });
    const alunos = await prisma.aluno.findMany({ where: { turmaId: disciplina.turmaId } });
    const atividades = await prisma.atividade.findMany({ where: { disciplinaId: Number(id) } });
    const notas = await prisma.nota.findMany({
        where: { atividade: { disciplinaId: Number(id) } }
    });
    const configs = await prisma.configuracaoBimestre.findMany({ where: { disciplinaId: Number(id) } });

    // Attendance data
    const chamadas = await prisma.chamada.findMany({ where: { disciplinaId: Number(id) } });
    const presencas = await prisma.presenca.findMany({
        where: { chamada: { disciplinaId: Number(id) } }
    });

    const boletim = alunos.map(aluno => {
        let totalPontos = 0;
        const notasPorBimestre = {};

        // Calculate grades per bimester
        [1, 2, 3, 4].forEach(bimestre => {
            const config = configs.find(c => c.bimestre === bimestre);
            const ativsBimestre = atividades.filter(a => a.bimestre === bimestre);

            let notaBimestre = 0;

            if (!config || config.formula === 'SOMA') {
                // Default: Sum of all grades
                ativsBimestre.forEach(a => {
                    const nota = notas.find(n => n.atividadeId === a.id && n.alunoId === aluno.id);
                    if (nota) notaBimestre += nota.valor;
                });
            } else if (config.formula === 'CUSTOM_TRABALHO_PROVA') {
                // (Sum(Trabalhos) + Sum(Provas)) / 2
                // Or user specified: "nota de trabalho vale 9 e soma-se mais 1 para relacionado a conceito"
                // Let's implement the generic "Group by Category" logic which covers most cases

                // For now, let's implement the specific logic requested:
                // "dependendo do bimestre eu opto por fazer uma nota até chegar a 10, ou vários trabalhos somando uma nota e mais avaliação e divido por 2"

                // Let's look at categories.
                // If config says 'MEDIA_TRABALHO_PROVA':
                const trabalhos = ativsBimestre.filter(a => a.categoria === 'TRABALHO' || a.categoria === 'CONCEITO');
                const provas = ativsBimestre.filter(a => a.categoria === 'PROVA');

                let somaTrabalhos = 0;
                trabalhos.forEach(a => {
                     const nota = notas.find(n => n.atividadeId === a.id && n.alunoId === aluno.id);
                     if (nota) somaTrabalhos += nota.valor;
                });

                let somaProvas = 0;
                provas.forEach(a => {
                     const nota = notas.find(n => n.atividadeId === a.id && n.alunoId === aluno.id);
                     if (nota) somaProvas += nota.valor;
                });

                if (provas.length > 0) {
                     notaBimestre = (somaTrabalhos + somaProvas) / 2;
                } else {
                     notaBimestre = somaTrabalhos; // Fallback if no exam
                }
            }

            notasPorBimestre[bimestre] = notaBimestre;
            totalPontos += notaBimestre;
        });

        // Calculate Attendance
        const totalChamadas = chamadas.length;
        const alunoPresencas = presencas.filter(p => p.alunoId === aluno.id && p.presente).length;
        const frequencia = totalChamadas > 0 ? (alunoPresencas / totalChamadas) * 100 : 100;

        return {
            aluno: aluno,
            notasBimestre: notasPorBimestre,
            totalPontos,
            frequencia,
            aprovado: totalPontos >= 24 && frequencia >= 75
        };
    });

    res.json(boletim);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
