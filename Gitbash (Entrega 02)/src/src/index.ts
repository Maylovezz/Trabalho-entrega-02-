// @ts-nocheck
import { db } from './db.ts';
import * as schema from './schema.ts';
import { eq } from 'drizzle-orm';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const rl = readline.createInterface({ input, output });

async function main() {
  console.log('--- 📍 Sistema Geográfico CLI ---');

  while (true) {
    console.log('\n[1] Cadastrar Localidade (UF > Cidade > Região)');
    console.log('[2] Listar Tudo (Exemplo: DF - Brasília - Asa Norte)');
    console.log('[3] Excluir uma Região');
    console.log('[0] Sair');

    const opcao = await rl.question('\nEscolha uma opção: ');

    if (opcao === '1') {
      // CREATE: Cadastrando a hierarquia completa
      const sigla = await rl.question('Sigla da UF (ex: DF): ');
      const nomeUf = await rl.question('Nome da UF: ');
      const [uf] = await db.insert(schema.ufs).values({ nome: nomeUf, sigla }).returning();

      const nomeCid = await rl.question('Nome da Cidade: ');
      const [cid] = await db.insert(schema.cidades).values({ nome: nomeCid, ufId: uf.id }).returning();

      const nomeReg = await rl.question('Nome da Região/Bairro: ');
      await db.insert(schema.regioes).values({ nome: nomeReg, cidadeId: cid.id });

      console.log('\n✅ Cadastro realizado com sucesso!');

    } else if (opcao === '2') {
      // READ: Fazendo o JOIN triplo para o formato solicitado
      const lista = await db.select()
        .from(schema.regioes)
        .innerJoin(schema.cidades, eq(schema.regioes.cidadeId, schema.cidades.id))
        .innerJoin(schema.ufs, eq(schema.cidades.ufId, schema.ufs.id));

      console.log('\n--- LISTAGEM ATUAL ---');
      if (lista.length === 0) console.log('Nenhum dado encontrado.');
      
      lista.forEach(item => {
        console.log(`${item.ufs.sigla} - ${item.cidades.nome} - ${item.regioes.nome}`);
      });

    } else if (opcao === '3') {
      // DELETE: Removendo por nome (para facilitar na CLI)
      const nomeParaDeletar = await rl.question('Nome da Região para excluir: ');
      await db.delete(schema.regioes).where(eq(schema.regioes.nome, nomeParaDeletar));
      console.log(`\n🗑️ Região "${nomeParaDeletar}" removida!`);

    } else if (opcao === '0') {
      console.log('Saindo do sistema...');
      break;
    }
  }
  rl.close();
  process.exit(0);
}

main().catch(console.error);