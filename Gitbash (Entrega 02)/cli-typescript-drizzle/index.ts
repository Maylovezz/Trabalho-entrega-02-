// @ts-nocheck
import { db } from './db.ts';
import * as schema from './schema.ts';
import { eq, and } from 'drizzle-orm';
import * as readline from 'node:readline/promises';

const rl = readline.createInterface({ 
  input: process.stdin, 
  output: process.stdout,
  terminal: true 
});

async function main() {
  const sqlite = db.session.client;
  
  // Garante as tabelas e as relações (Foreign Keys)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS ufs (id TEXT PRIMARY KEY, nome TEXT, sigla TEXT UNIQUE);
    CREATE TABLE IF NOT EXISTS cidades (id TEXT PRIMARY KEY, nome TEXT, uf_id TEXT, FOREIGN KEY(uf_id) REFERENCES ufs(id));
    CREATE TABLE IF NOT EXISTS regioes (id TEXT PRIMARY KEY, nome TEXT, cidade_id TEXT, FOREIGN KEY(cidade_id) REFERENCES cidades(id));
  `);

  while (true) {
    console.log('\n==============================');
    console.log('   📍 SISTEMA GEOGRÁFICO');
    console.log('==============================');
    console.log('1. Cadastrar Novo Local');
    console.log('2. Listar Tudo (UF - Cidade - Região)');
    console.log('0. Sair');

    const opcao = (await rl.question('\nEscolha uma opção: ')).trim();

    if (opcao === '1') {
      console.log('\n--- 🆕 INICIANDO CADASTRO ---');
      
      const siglaInput = (await rl.question('Sigla da UF (ex: SP, MT, PA): ')).trim().toUpperCase();
      const nomeUf = (await rl.question(`Nome completo de ${siglaInput}: `)).trim();
      const nomeCid = (await rl.question(`Cidade em ${siglaInput}: `)).trim();

      try {
        // 1. GERENCIAR UF (Busca ou Cria)
        let uf = (await db.select().from(schema.ufs).where(eq(schema.ufs.sigla, siglaInput)))[0];
        if (!uf) {
          const [novaUf] = await db.insert(schema.ufs).values({ 
            nome: nomeUf, 
            sigla: siglaInput 
          }).returning();
          uf = novaUf;
        }

        // 2. GERENCIAR CIDADE (Busca ou Cria)
        let cidade = (await db.select().from(schema.cidades).where(
          and(eq(schema.cidades.nome, nomeCid), eq(schema.cidades.ufId, uf.id))
        ))[0];
        if (!cidade) {
          const [novaCid] = await db.insert(schema.cidades).values({ 
            nome: nomeCid, 
            ufId: uf.id 
          }).returning();
          cidade = novaCid;
        }

        // 3. LOOP PARA VÁRIAS REGIÕES
        console.log(`\nAdicionando regiões para ${nomeCid} - ${siglaInput}`);
        console.log('(Digite "fim" para encerrar esta cidade)');

        while (true) {
          const nomeReg = (await rl.question('Nome da Região/Bairro: ')).trim();
          
          if (nomeReg.toLowerCase() === 'fim') break;
          if (nomeReg === '') continue;

          await db.insert(schema.regioes).values({ 
            nome: nomeReg, 
            cidadeId: cidade.id 
          });
          console.log(`✅ Região "${nomeReg}" salva!`);
        }

      } catch (err) {
        console.log('\n❌ Erro ao processar. Certifique-se de preencher os dados corretamente.');
      }

    } else if (opcao === '2') {
      console.log('\n--- 📋 LISTAGEM COMPLETA ---');
      
      const lista = await db.select({
        uf: schema.ufs.sigla,
        cidade: schema.cidades.nome,
        regiao: schema.regioes.nome
      })
      .from(schema.regioes)
      .innerJoin(schema.cidades, eq(schema.regioes.cidadeId, schema.cidades.id))
      .innerJoin(schema.ufs, eq(schema.cidades.ufId, schema.ufs.id));

      if (lista.length === 0) {
        console.log('O banco de dados está vazio.');
      } else {
        // O formato que você pediu: UF - Cidade - Região
        lista.forEach(item => {
          console.log(`${item.uf} - ${item.cidade} - ${item.regiao}`);
        });
      }

    } else if (opcao === '0') {
      console.log('Saindo...');
      break;
    }
  }
  process.exit(0);
}

main();