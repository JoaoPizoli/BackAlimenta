const axios = require('axios');

// Teste simples para debug do problema de switching de datas
async function main() {
  console.log('🧪 [NODE TEST] Testando problema de switching de datas');
  
  const today = new Date();
  const todayString = formatDate(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = formatDate(yesterday);
  
  console.log('📅 Hoje:', todayString);
  console.log('📅 Ontem:', yesterdayString);
  
  await testDateSwitch(todayString, yesterdayString);
}

async function testDateSwitch(today, yesterday) {
  console.log('\n=== SIMULANDO COMPORTAMENTO DO USUÁRIO ===');
  
  // 1. Verificar alimentos para hoje (após registro por áudio)
  console.log(`\n1️⃣ Verificando alimentos para HOJE (${today})...`);
  await callAPI(today);
  
  // 2. Switch para ontem
  console.log(`\n2️⃣ Usuário muda para ONTEM (${yesterday})...`);
  await callAPI(yesterday);
  
  // 3. Switch de volta para hoje - AQUI É ONDE O PROBLEMA ACONTECE
  console.log(`\n3️⃣ Usuário volta para HOJE (${today}) - TESTE CRÍTICO...`);
  await callAPI(today);
  
  console.log('\n🎯 Se os dados de hoje sumiram na etapa 3, encontramos o bug!');
}

async function callAPI(date) {
  try {
    const response = await axios.get(`http://localhost:3333/alimentos-detalhados/data/${date}/1`);
    
    if (response.status === 200) {
      const alimentosAgrupados = response.data.data;
      
      console.log('📊 Status: Sucesso');
      console.log('📊 Tipos de refeição:', Object.keys(alimentosAgrupados));
      
      let totalAlimentos = 0;
      Object.entries(alimentosAgrupados).forEach(([tipo, alimentos]) => {
        const count = alimentos.length;
        totalAlimentos += count;
        if (count > 0) {
          console.log(`   ${tipo}: ${count} alimentos`);
        }
      });
      
      console.log(`📊 Total: ${totalAlimentos} alimentos`);
      
      if (totalAlimentos > 0) {
        console.log(`✅ DADOS ENCONTRADOS para ${date}`);
      } else {
        console.log(`⚠️ NENHUM DADO para ${date}`);
      }
    } else {
      console.log(`❌ Status: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

main().catch(console.error);
