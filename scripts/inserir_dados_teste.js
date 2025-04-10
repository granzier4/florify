// Script para inserir dados de teste no Supabase
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Configurar dotenv para carregar variáveis de ambiente do arquivo .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env') });

// Inicializar cliente Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são necessárias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inserirDadosTeste() {
  console.log('Iniciando inserção de dados de teste...');

  try {
    // 1. Inserir produtos CVH
    console.log('Inserindo produtos CVH...');
    const produtosCvh = [
      { codbarra: '7891234567890', item_code: 'ITEM001', descricao: 'Rosa Vermelha Premium', categoria: 'Rosas', cor: 'Vermelho', peso: 0.5, embalagem: 'Unitário' },
      { codbarra: '7891234567891', item_code: 'ITEM002', descricao: 'Tulipa Amarela', categoria: 'Tulipas', cor: 'Amarelo', peso: 0.3, embalagem: 'Buquê' },
      { codbarra: '7891234567892', item_code: 'ITEM003', descricao: 'Orquídea Branca', categoria: 'Orquídeas', cor: 'Branco', peso: 0.8, embalagem: 'Vaso' },
      { codbarra: '7891234567893', item_code: 'ITEM004', descricao: 'Girassol Grande', categoria: 'Girassóis', cor: 'Amarelo', peso: 0.7, embalagem: 'Unitário' },
      { codbarra: '7891234567894', item_code: 'ITEM005', descricao: 'Lírio Oriental', categoria: 'Lírios', cor: 'Rosa', peso: 0.4, embalagem: 'Buquê' }
    ];

    for (const produto of produtosCvh) {
      const { error } = await supabase
        .from('produtos_cvh')
        .upsert(produto, { onConflict: 'codbarra' });

      if (error) {
        console.error(`Erro ao inserir produto ${produto.codbarra}:`, error);
      } else {
        console.log(`Produto ${produto.codbarra} inserido com sucesso.`);
      }
    }

    // 2. Obter lojas disponíveis
    console.log('Buscando lojas disponíveis...');
    const { data: lojas, error: lojasError } = await supabase
      .from('lojas')
      .select('id, nome_fantasia')
      .limit(10);

    if (lojasError) {
      console.error('Erro ao buscar lojas:', lojasError);
      return;
    }

    console.log(`Encontradas ${lojas.length} lojas.`);
    
    if (lojas.length === 0) {
      console.log('Nenhuma loja encontrada. Criando uma loja de teste...');
      
      const { data: novaLoja, error: novaLojaError } = await supabase
        .from('lojas')
        .insert({
          razao_social: 'Floricultura Teste Ltda',
          nome_fantasia: 'Florify Teste',
          cnpj: '12345678901234',
          email_contato: 'teste@florify.com',
          telefone: '(11) 99999-9999',
          endereco: 'Rua das Flores, 123',
          slug: 'florify-teste',
          status: 'ativo'
        })
        .select()
        .single();
      
      if (novaLojaError) {
        console.error('Erro ao criar loja de teste:', novaLojaError);
        return;
      }
      
      lojas.push(novaLoja);
      console.log(`Loja de teste criada com ID: ${novaLoja.id}`);
    }

    // 3. Associar produtos às lojas
    for (const loja of lojas) {
      console.log(`Associando produtos à loja ${loja.nome_fantasia} (${loja.id})...`);
      
      const produtosLoja = [
        { loja_id: loja.id, codbarra: '7891234567890', ativo: true, destaque: true, ordem_exibicao: 1 },
        { loja_id: loja.id, codbarra: '7891234567891', ativo: true, destaque: false, ordem_exibicao: 2 },
        { loja_id: loja.id, codbarra: '7891234567892', ativo: true, destaque: false, ordem_exibicao: 3 },
        { loja_id: loja.id, codbarra: '7891234567893', ativo: false, destaque: false, ordem_exibicao: 4 },
        { loja_id: loja.id, codbarra: '7891234567894', ativo: true, destaque: true, ordem_exibicao: 5 }
      ];

      for (const produtoLoja of produtosLoja) {
        const { error } = await supabase
          .from('produtos_loja_cvh')
          .upsert(produtoLoja, { onConflict: 'loja_id,codbarra' });

        if (error) {
          console.error(`Erro ao associar produto ${produtoLoja.codbarra} à loja ${loja.id}:`, error);
        } else {
          console.log(`Produto ${produtoLoja.codbarra} associado à loja ${loja.id} com sucesso.`);
        }
      }
    }

    console.log('Inserção de dados de teste concluída com sucesso!');
  } catch (error) {
    console.error('Erro durante a inserção de dados de teste:', error);
  } finally {
    // Encerrar a conexão com o Supabase
    await supabase.auth.signOut();
  }
}

// Executar a função principal
inserirDadosTeste().catch(console.error);
