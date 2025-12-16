const axios = require('axios');
const assert = require('assert');

const API_URL = 'http://localhost:3001/api';

async function runTests() {
    console.log('--- Starting Verification Script ---');

    try {
        // 1. Create School
        console.log('1. Creating School...');
        const schoolRes = await axios.post(`${API_URL}/escolas`, { nome: 'Escola Teste Automatizado' });
        const school = schoolRes.data;
        assert(school.id, 'School should have an ID');
        console.log('   [OK] School created:', school.nome);

        // 2. Create Class
        console.log('2. Creating Class...');
        const classRes = await axios.post(`${API_URL}/turmas`, { nome: '1º Ano Z', escolaId: school.id });
        const turma = classRes.data;
        assert(turma.id, 'Class should have an ID');
        console.log('   [OK] Class created:', turma.nome);

        // 3. Create Student
        console.log('3. Creating Student...');
        const studentRes = await axios.post(`${API_URL}/alunos`, { nome: 'Joãozinho Silva', turmaId: turma.id });
        const student = studentRes.data;
        assert(student.id, 'Student should have an ID');
        console.log('   [OK] Student created:', student.nome);

        // 4. Create Subject
        console.log('4. Creating Subject...');
        const subjectRes = await axios.post(`${API_URL}/disciplinas`, { nome: 'Matemática', turmaId: turma.id });
        const subject = subjectRes.data;
        assert(subject.id, 'Subject should have an ID');
        console.log('   [OK] Subject created:', subject.nome);

        // 5. Configure Bimester Formula (1st Bimester = Custom Logic)
        console.log('5. Configuring Formula for 1st Bimester...');
        // "nota de trabalho vale 9 e soma-se mais 1 para relacionado a conceito" -> This implies Custom Logic where we sum Work + Concept
        // Or using the requested logic: (Sum(Trabalhos) + Sum(Provas)) / 2
        // Let's use CUSTOM_TRABALHO_PROVA
        await axios.post(`${API_URL}/configuracoes`, {
            disciplinaId: subject.id,
            bimestre: 1,
            formula: 'CUSTOM_TRABALHO_PROVA'
        });
        console.log('   [OK] Formula Configured');

        // 6. Create Activities
        console.log('6. Creating Activities...');
        // Trabalho 1 (Weight 10)
        const work1 = await axios.post(`${API_URL}/atividades`, {
            nome: 'Trabalho de Casa',
            data: new Date(),
            bimestre: 1,
            categoria: 'TRABALHO',
            valorMaximo: 10,
            disciplinaId: subject.id
        });

        // Prova 1 (Weight 10)
        const exam1 = await axios.post(`${API_URL}/atividades`, {
            nome: 'Prova Mensal',
            data: new Date(),
            bimestre: 1,
            categoria: 'PROVA',
            valorMaximo: 10,
            disciplinaId: subject.id
        });
        console.log('   [OK] Activities Created');

        // 7. Enter Grades
        console.log('7. Entering Grades...');
        // Student gets 8 in Work and 6 in Exam
        // Formula: (8 + 6) / 2 = 7
        await axios.post(`${API_URL}/notas`, { valor: 8, alunoId: student.id, atividadeId: work1.data.id });
        await axios.post(`${API_URL}/notas`, { valor: 6, alunoId: student.id, atividadeId: exam1.data.id });
        console.log('   [OK] Grades Entered');

        // 8. Attendance
        console.log('8. Registering Attendance...');
        // 1 day present, 1 day absent
        await axios.post(`${API_URL}/chamadas`, {
            data: new Date(),
            disciplinaId: subject.id,
            presencas: [{ alunoId: student.id, presente: true }]
        });
        await axios.post(`${API_URL}/chamadas`, {
            data: new Date(Date.now() + 86400000), // Next day
            disciplinaId: subject.id,
            presencas: [{ alunoId: student.id, presente: false }]
        });
        console.log('   [OK] Attendance Registered');

        // 9. Generate Report Card (Boletim)
        console.log('9. Checking Report Card...');
        const reportRes = await axios.get(`${API_URL}/disciplinas/${subject.id}/boletim`);
        const report = reportRes.data[0];

        console.log('   --- Report Result ---');
        console.log(`   Student: ${report.aluno.nome}`);
        console.log(`   1st Bim Grade: ${report.notasBimestre[1]}`);
        console.log(`   Total Points: ${report.totalPontos}`);
        console.log(`   Frequency: ${report.frequencia}%`);
        console.log(`   Approved: ${report.aprovado}`);

        // Verifications
        assert.strictEqual(report.notasBimestre[1], 7, 'Grade Calculation Error: Should be (8+6)/2 = 7');
        assert.strictEqual(report.frequencia, 50, 'Frequency Calculation Error: Should be 50% (1/2)');
        assert.strictEqual(report.aprovado, false, 'Approval Logic Error: Should fail due to points (<24) and frequency (<75%)');

        console.log('\n✅ ALL TESTS PASSED SUCCESSFULLY!');

    } catch (error) {
        console.error('\n❌ TEST FAILED');
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
        } else {
            console.error(error);
        }
        process.exit(1);
    }
}

runTests();
