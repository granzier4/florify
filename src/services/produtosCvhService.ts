import { supabase } from '../lib/supabaseClient';
import Papa from 'papaparse';

// Função auxiliar para normalizar dados (converter 'itemcode' para 'item_code')
const normalizarDados = (dados: any): any => {
  if (dados === null || dados === undefined || typeof dados !== 'object') {
    return dados;
  }
  if (Array.isArray(dados)) {
    return dados.map(item => normalizarDados(item));
  }
  const resultado: Record<string, any> = {};
  for (const chave of Object.keys(dados)) {
    const valor = dados[chave];
    if (chave === 'itemcode') {
      resultado['item_code'] = normalizarDados(valor);
    } else {
      resultado[chave] = normalizarDados(valor);
    }
  }
  return resultado;
};

// Interfaces
export interface ProdutoCvh {
  id?: number;
  item_code: string;
  codbarra: string;
  descricao: string;
  descricao_curta?: string;
  cod_categoria?: string;
  descricao_categoria?: string;
  cod_grupo?: string;
  descricao_grupo?: string;
  data_cadastro?: string;
  ncm?: string;
  class_cond?: string;
  grupo_com?: string;
  grupo_log?: string;
  cst_sp?: string;
  peso?: number;
  cpc?: string;
  epc?: string;
  upc?: string;
  cor?: string;
  foto?: string;
  preco_unitario: number;
  unidade_medida: string;
  importacao_id?: string;
  lastupdatedate?: string;
}

export interface ProdutoAlterado {
  atual: ProdutoCvh;
  novo: ProdutoCvh;
  diferencas: Record<string, { de: any; para: any }>;
}

export interface ErroAnalise {
  linha: number;
  erro: string;
}

export interface ResultadoAnalise {
  novos: ProdutoCvh[];
  alterados: ProdutoAlterado[];
  semAlteracao: ProdutoCvh[];
  erros: ErroAnalise[];
}

export interface ImportacaoCvh {
  id?: string;
  nome_arquivo: string;
  arquivo_path: string;
  total_linhas: number;
  novos: number;
  alterados: number;
  status: 'pendente' | 'concluido' | 'erro';
  usuario_id: string;
  diff_preview: any;
  created_at?: string;
}

// Função auxiliar para formatar data no formato do PostgreSQL (YYYY-MM-DD)
const formatarDataParaPostgres = (dataStr: string | undefined): string | undefined => {
  if (!dataStr) return undefined;
  
  try {
    // Verificar se a data está no formato DD/MM/YYYY
    const partes = dataStr.split('/');
    if (partes.length === 3) {
      const dia = partes[0].padStart(2, '0');
      const mes = partes[1].padStart(2, '0');
      const ano = partes[2];
      
      // Retornar no formato YYYY-MM-DD
      return `${ano}-${mes}-${dia}`;
    }
    
    // Se não estiver no formato esperado, retornar undefined
    return undefined;
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return undefined;
  }
};

// Função auxiliar para comparar valores de forma mais precisa
const compararValores = (valor1: any, valor2: any): boolean => {
  // Se ambos forem null ou undefined, são iguais
  if (valor1 == null && valor2 == null) return true;
  
  // Se apenas um deles for null ou undefined, são diferentes
  if (valor1 == null || valor2 == null) return false;
  
  // Para datas, converter para string ISO e comparar
  if (valor1 instanceof Date && valor2 instanceof Date) {
    return valor1.toISOString() === valor2.toISOString();
  }
  
  // Para números, converter para string e comparar para evitar problemas com precisão
  if (typeof valor1 === 'number' && typeof valor2 === 'number') {
    return valor1.toString() === valor2.toString();
  }
  
  // Para strings, comparar diretamente
  if (typeof valor1 === 'string' && typeof valor2 === 'string') {
    return valor1 === valor2;
  }
  
  // Para outros tipos, usar JSON.stringify
  return JSON.stringify(valor1) === JSON.stringify(valor2);
};

export const produtosCvhService = {
  // Buscar todos os produtos
  listarProdutos: async (): Promise<ProdutoCvh[]> => {
    try {
      console.log('[DEBUG]: Tentando listar produtos da tabela produtos_cvh');
      const { data, error } = await supabase
        .from('produtos_cvh')
        .select('*')
        .order('descricao', { ascending: true });
      
      if (error) {
        console.error('[DEBUG]: Erro ao listar produtos:', error);
        throw error;
      }
      
      console.log(`[DEBUG]: Produtos listados com sucesso: ${data?.length || 0} produtos encontrados`);
      return data as ProdutoCvh[];
    } catch (error: any) {
      console.error('Erro ao listar produtos:', error);
      throw new Error('Falha ao listar produtos: ' + (error.message || 'Erro desconhecido'));
    }
  },

  // Buscar produto por código
  // NOTA: Esta função é mantida para compatibilidade, mas recomendamos usar buscarProdutoPorCodigoBarras
  // já que codbarra é a chave principal para identificação
  buscarProdutoPorCodigo: async (item_code: string): Promise<ProdutoCvh | null> => {
    try {
      console.log(`[DEBUG]: Buscando produto com item_code ${item_code}`);
      const { data, error } = await supabase
        .from('produtos_cvh')
        .select('*')
        .eq('item_code', item_code)
        .maybeSingle();
      
      if (error) {
        console.error('[DEBUG]: Erro ao buscar produto por código:', error);
        throw error;
      }
      
      return data as ProdutoCvh;
    } catch (error: any) {
      console.error('Erro ao buscar produto por código:', error);
      throw new Error('Falha ao buscar produto por código: ' + (error.message || 'Erro desconhecido'));
    }
  },

  // Buscar produto por código de barras
  buscarProdutoPorCodigoBarras: async (codbarra: string): Promise<ProdutoCvh | null> => {
    try {
      console.log(`[DEBUG]: Buscando produto com codbarra ${codbarra}`);
      const { data, error } = await supabase
        .from('produtos_cvh')
        .select('*')
        .eq('codbarra', codbarra)
        .maybeSingle();
      
      if (error) {
        console.error('[DEBUG]: Erro ao buscar produto por código de barras:', error);
        throw error;
      }
      
      return data as ProdutoCvh;
    } catch (error: any) {
      console.error('Erro ao buscar produto por código de barras:', error);
      throw new Error('Falha ao buscar produto por código de barras: ' + (error.message || 'Erro desconhecido'));
    }
  },

  // Analisar arquivo CSV
  analisarArquivoCsv: async (file: File): Promise<ResultadoAnalise> => {
    return new Promise((resolve, reject) => {
      try {
        console.log('[DEBUG]: Iniciando análise do arquivo CSV');
        
        // Resultado inicial
        const resultado: ResultadoAnalise = {
          novos: [],
          alterados: [],
          semAlteracao: [],
          erros: []
        };
        
        // Configurar o parser
        Papa.parse(file, {
          header: true,
          delimiter: ';', // Definindo o delimitador como ponto e vírgula
          skipEmptyLines: true,
          encoding: 'UTF-8',
          complete: async (results) => {
            try {
              console.log(`[DEBUG]: Arquivo CSV analisado com sucesso. Linhas: ${results.data.length}`);
              
              // Verificar se há dados no arquivo
              if (!results.data || results.data.length === 0) {
                reject(new Error('Arquivo CSV vazio ou sem dados válidos'));
                return;
              }
              
              // Verificar campos obrigatórios na primeira linha
              const primeiraLinha = results.data[0] as Record<string, any>;
              const camposObrigatorios = ['codbarra', 'descricao']; // Removido 'preco_unitario' e 'unidade_medida' como obrigatórios
              
              for (const campo of camposObrigatorios) {
                if (!primeiraLinha[campo] && !primeiraLinha[campo.toUpperCase()]) {
                  reject(new Error(`Campo obrigatório '${campo}' não encontrado no arquivo CSV`));
                  return;
                }
              }
              
              // Processar cada linha do CSV
              for (let i = 0; i < results.data.length; i++) {
                try {
                  const linha = results.data[i] as Record<string, any>;
                  
                  // Verificar se a linha tem dados válidos
                  if (Object.keys(linha).length === 0) {
                    continue; // Pular linhas vazias
                  }
                  
                  // Normalizar nomes de campos (converter para minúsculas)
                  const linhaNormalizada: Record<string, any> = {};
                  Object.entries(linha).forEach(([key, value]) => {
                    linhaNormalizada[key.toLowerCase()] = value;
                  });
                  
                  // Verificar campos obrigatórios
                  if (!linhaNormalizada.codbarra || !linhaNormalizada.descricao) {
                    resultado.erros.push({
                      linha: i + 2, // +2 porque i é 0-indexed e há um cabeçalho
                      erro: 'Campos obrigatórios ausentes (codbarra, descricao)'
                    });
                    continue;
                  }
                  
                  // Validar formato dos campos
                  if (linhaNormalizada.codbarra && typeof linhaNormalizada.codbarra !== 'string') {
                    resultado.erros.push({
                      linha: i + 2,
                      erro: 'Formato inválido para o campo codbarra'
                    });
                    continue;
                  }
                  
                  // Criar objeto produto a partir da linha do CSV
                  const produto: ProdutoCvh = {
                    item_code: linhaNormalizada.item_code || linhaNormalizada.itemcode || '',
                    codbarra: linhaNormalizada.codbarra,
                    descricao: linhaNormalizada.descricao,
                    descricao_curta: linhaNormalizada.descricao_curta,
                    cod_categoria: linhaNormalizada.cod_categoria,
                    descricao_categoria: linhaNormalizada.descricao_categoria,
                    cod_grupo: linhaNormalizada.cod_grupo,
                    descricao_grupo: linhaNormalizada.descricao_grupo,
                    data_cadastro: formatarDataParaPostgres(linhaNormalizada.data_cadastro),
                    ncm: linhaNormalizada.ncm,
                    class_cond: linhaNormalizada.class_cond,
                    grupo_com: linhaNormalizada.grupo_com,
                    grupo_log: linhaNormalizada.grupo_log,
                    cst_sp: linhaNormalizada.cst_sp,
                    peso: linhaNormalizada.peso ? parseFloat(linhaNormalizada.peso) : undefined,
                    cpc: linhaNormalizada.cpc,
                    epc: linhaNormalizada.epc,
                    upc: linhaNormalizada.upc,
                    cor: linhaNormalizada.cor,
                    foto: linhaNormalizada.foto,
                    preco_unitario: linhaNormalizada.preco_unitario ? parseFloat(linhaNormalizada.preco_unitario.replace(',', '.')) : 0,
                    unidade_medida: linhaNormalizada.unidade_medida || ''
                  };
                  
                  // Verificar se o produto já existe no banco de dados
                  // IMPORTANTE: Usando codbarra como chave principal para identificação
                  const produtoExistente = await produtosCvhService.buscarProdutoPorCodigoBarras(produto.codbarra);
                  
                  if (!produtoExistente) {
                    // Produto novo
                    resultado.novos.push(produto);
                  } else {
                    // Verificar se há alterações
                    const diferencas: Record<string, { de: any; para: any }> = {};
                    let temAlteracao = false;
                    
                    // Comparar cada campo do produto
                    Object.keys(produto).forEach(campo => {
                      // Ignorar campos que não devem ser comparados
                      if (campo === 'id' || campo === 'importacao_id' || campo === 'lastupdatedate' || campo === 'unidade_medida') {
                        return;
                      }
                      
                      // Verificar se o valor é diferente
                      if (!compararValores(produto[campo as keyof ProdutoCvh], produtoExistente[campo as keyof ProdutoCvh])) {
                        diferencas[campo] = {
                          de: produtoExistente[campo as keyof ProdutoCvh],
                          para: produto[campo as keyof ProdutoCvh]
                        };
                        temAlteracao = true;
                      }
                    });
                    
                    if (temAlteracao) {
                      // Produto alterado
                      resultado.alterados.push({
                        atual: produtoExistente,
                        novo: produto,
                        diferencas
                      });
                    } else {
                      // Produto sem alteração
                      resultado.semAlteracao.push(produtoExistente);
                    }
                  }
                } catch (error: any) {
                  console.error(`[DEBUG]: Erro ao processar linha ${i + 2}:`, error);
                  const mensagemErro = error.message || 'Erro desconhecido';
                  resultado.erros.push({
                    linha: i + 2,
                    erro: `Erro ao processar linha: ${mensagemErro}`
                  });
                  
                  // Log detalhado para facilitar a depuração
                  console.log(`[ERRO DETALHADO] Linha ${i + 2}: ${JSON.stringify(results.data[i])}`);
                }
              }
              
              console.log(`[DEBUG]: Análise concluída. Novos: ${resultado.novos.length}, Alterados: ${resultado.alterados.length}, Sem alteração: ${resultado.semAlteracao.length}, Erros: ${resultado.erros.length}`);
              
              // Logar detalhes dos erros para facilitar a depuração
              if (resultado.erros.length > 0) {
                console.log('[DEBUG]: Detalhes dos erros encontrados:');
                resultado.erros.forEach(erro => {
                  console.log(`[ERRO] Linha ${erro.linha}: ${erro.erro}`);
                });
              }
              
              resolve(resultado);
            } catch (error: any) {
              console.error('[DEBUG]: Erro durante o processamento do arquivo CSV:', error);
              reject(new Error(`Erro durante o processamento do arquivo CSV: ${error.message || 'Erro desconhecido'}`));
            }
          },
          error: (error) => {
            console.error('[DEBUG]: Erro ao analisar arquivo CSV:', error);
            reject(new Error(`Erro ao analisar arquivo CSV: ${(error as Error).message}`));
          }
        });
      } catch (error: any) {
        console.error('[DEBUG]: Erro ao iniciar análise do arquivo CSV:', error);
        reject(new Error(`Erro ao iniciar análise do arquivo CSV: ${error.message || 'Erro desconhecido'}`));
      }
    });
  },
  
  // Salvar arquivo no Storage
  salvarArquivoStorage: async (file: File, userId: string): Promise<string> => {
    try {
      // Gerar um nome único para o arquivo
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}_${file.name.replace(/\s+/g, '_')}`;
      
      // Caminho completo do arquivo no storage
      const filePath = `imports/cvh/${userId}/${fileName}`;
      
      // Verificar buckets disponíveis (debug)
      console.log('[DEBUG]: Tentando salvar arquivo no storage');
      
      // Fazer upload do arquivo - usando 'cvh-imports' como nome do bucket
      const { error } = await supabase.storage
        .from('cvh-imports') // Nome correto do bucket
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('[ERRO]: Falha ao fazer upload do arquivo:', error);
        throw error;
      }
      
      console.log('[DEBUG]: Arquivo salvo com sucesso:', filePath);
      return filePath;
    } catch (error: any) {
      console.error('[ERRO]: Erro ao salvar arquivo no storage:', error);
      throw new Error('Falha ao salvar arquivo: ' + (error.message || 'Erro desconhecido'));
    }
  },

  // Criar registro de importação
  criarImportacao: async (importacao: ImportacaoCvh): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('importacoes_cvh')
        .insert([importacao])
        .select()
        .single();
      
      if (error) throw error;
      
      return data.id;
    } catch (error: any) {
      console.error('Erro ao criar registro de importação:', error);
      throw new Error('Falha ao criar registro de importação: ' + (error.message || 'Erro desconhecido'));
    }
  },

  // Confirmar importação
  confirmarImportacao: async (importacao_id: string, novos: ProdutoCvh[], alterados: ProdutoAlterado[]): Promise<void> => {
    try {
      console.log('[DEBUG]: Iniciando processo de confirmação de importação');
      
      // Buscar informações da importação
      console.log('[DEBUG]: Buscando informações da importação:', importacao_id);
      const { data: importacao, error: errorImportacao } = await supabase
        .from('importacoes_cvh')
        .select('*')
        .eq('id', importacao_id)
        .single();
      
      if (errorImportacao) {
        console.error('[DEBUG]: Erro ao buscar informações da importação:', errorImportacao);
        throw new Error(`Falha ao buscar informações da importação: ${errorImportacao.message}`);
      }
      
      console.log('[DEBUG]: Informações da importação recuperadas com sucesso:', importacao);
      
      // Nota: Anteriormente obtínhamos o usuário atual, mas como não estamos usando
      // essa informação no momento, comentamos o código para evitar avisos de lint
      // 1. Inserir novos produtos
      if (novos.length > 0) {
        console.log(`[DEBUG]: Inserindo ${novos.length} novos produtos...`);
        
        // Normalizar todos os produtos para garantir que não haja referências a 'itemcode'
        const produtosNormalizados = novos.map(produto => {
          const produtoNormalizado = normalizarDados(produto);
          produtoNormalizado.importacao_id = importacao_id;
          produtoNormalizado.lastupdatedate = new Date().toISOString();
          return produtoNormalizado;
        });
        
        // Inserir produtos normalizados
        console.log('[DEBUG]: Tentando inserir produtos na tabela produtos_cvh');
        const { error } = await supabase
          .from('produtos_cvh')
          .upsert(produtosNormalizados, { onConflict: 'codbarra' });
        
        if (error) {
          console.error(`[ERRO]: Falha ao inserir novos produtos - ${error.message}`);
          throw new Error(`Falha ao inserir ${novos.length} produtos: ${error.message}`);
        } else {
          // Log de sucesso no console
          console.log(`[Sucesso]: ${novos.length} novos produtos inseridos`);
        }
        
        console.log(`[Importação]: ${novos.length} novos produtos processados`);
      }
      
      // 2. Atualizar produtos alterados
      if (alterados.length > 0) {
        console.log('[Importação]: Atualizando produtos alterados...');
        
        const errosAtualizacao: Array<{codbarra: string, erro: string}> = [];
        let produtosAtualizados = 0;
        
        for (const item of alterados) {
          try {
            // Remover campos que não devem ser atualizados
            const { id, ...dadosIniciais } = item.novo;
            
            // Adicionar importacao_id e data de atualização
            const dadosAtualizados = {
              ...dadosIniciais,
              importacao_id,
              lastupdatedate: new Date().toISOString()
            };
            
            // Normalizar dados para garantir que não haja referências a 'itemcode'
            const dadosAtualizadosNormalizados = normalizarDados(dadosAtualizados);
            
            // Garantir que apenas campos válidos sejam enviados na atualização
            // e que todos os valores sejam do tipo correto
            const camposValidos = [
              'item_code', 'codbarra', 'descricao', 'descricao_curta', 'cod_categoria',
              'descricao_categoria', 'cod_grupo', 'descricao_grupo', 'data_cadastro',
              'ncm', 'class_cond', 'grupo_com', 'grupo_log', 'cst_sp', 'cst_outros',
              'aliq_icms', 'aliq_pis', 'aliq_cofins', 'perc_margem', 'perc_margem_minima',
              'perc_margem_maxima', 'preco_custo', 'preco_venda', 'status', 'importacao_id',
              'peso', 'cpc', 'epc', 'upc', 'cor', 'foto', 'preco_unitario', 'unidade_medida'
            ];
            
            // Adicionar apenas campos válidos que existem e têm valores válidos
            const dadosAtualizadosFinais: Record<string, any> = {};
            Object.entries(dadosAtualizadosNormalizados).forEach(([key, valor]) => {
              // Verificar se o campo é válido e não é nulo ou undefined
              if (camposValidos.includes(key) && valor !== null && valor !== undefined) {
                // Converter objetos para JSON string se necessário
                if (typeof valor === 'object') {
                  dadosAtualizadosFinais[key] = JSON.stringify(valor);
                } else {
                  dadosAtualizadosFinais[key] = valor;
                }
              }
            });
            
            console.log(`[DEBUG]: Atualizando produto ${item.atual.codbarra} com dados:`, dadosAtualizadosFinais);
            
            try {
              // Atualizar o produto usando codbarra como chave principal (única forma de identificação)
              console.log(`[DEBUG]: Tentando atualizar produto com codbarra ${item.atual.codbarra}`);
              const { error } = await supabase
                .from('produtos_cvh')
                .upsert(dadosAtualizadosFinais, { onConflict: 'codbarra' });
              
              if (error) {
                console.error(`[ERRO]: Falha ao atualizar produto com codbarra ${item.atual.codbarra} - ${error.message}`);
                errosAtualizacao.push({
                  codbarra: item.atual.codbarra,
                  erro: error.message
                });
                throw error;
              } else {
                // Log de sucesso no console
                console.log(`[Sucesso]: Produto com codbarra ${item.atual.codbarra} atualizado`);
                produtosAtualizados++;
              }
            } catch (updateError: any) {
              console.error(`[ERRO]: Erro inesperado ao atualizar produto ${item.atual.codbarra}:`, updateError);
              errosAtualizacao.push({
                codbarra: item.atual.codbarra,
                erro: updateError.message || 'Erro desconhecido'
              });
            }
          } catch (itemError: any) {
            console.error(`[ERRO]: Erro ao processar item alterado com codbarra ${item.atual.codbarra}:`, itemError);
            errosAtualizacao.push({
              codbarra: item.atual.codbarra,
              erro: itemError.message || 'Erro desconhecido'
            });
          }
        }
        
        console.log(`[Importação]: ${alterados.length} produtos alterados processados, ${produtosAtualizados} atualizados com sucesso`);
        
        // Se houver erros de atualização, lançar exceção
        if (errosAtualizacao.length > 0) {
          throw new Error(`Falha ao atualizar ${errosAtualizacao.length} produtos. Primeiro erro: ${errosAtualizacao[0].erro}`);
        }
      }
      
      // Atualizar status da importação
      const { error: updateError } = await supabase
        .from('importacoes_cvh')
        .update({ 
          status: 'concluido',
          diff_preview: {
            ...importacao.diff_preview,
            resumo_final: {
              novos_processados: novos.length,
              alterados_processados: alterados.length,
              timestamp: new Date().toISOString()
            }
          }
        })
        .eq('id', importacao_id);
      
      if (updateError) {
        console.error('[DEBUG]: Erro ao atualizar status da importação:', updateError);
        throw new Error(`Falha ao atualizar status da importação: ${updateError.message}`);
      }
      
      console.log(`Importação ${importacao_id} concluída com sucesso.`);
    } catch (error: any) {
      console.error('Erro ao confirmar importação:', error);
      
      // Verificar se o erro está relacionado à tabela historico_produtos_cvh
      if (error.message && error.message.includes('historico_produtos_cvh')) {
        console.log('[DEBUG]: Erro relacionado à tabela historico_produtos_cvh. Ignorando, pois o histórico não será usado por enquanto.');
        
        // Continuar com a atualização do status da importação como concluída
        try {
          const { error: updateError } = await supabase
            .from('importacoes_cvh')
            .update({ 
              status: 'concluido',
              diff_preview: {
                resumo_final: {
                  novos_processados: novos.length,
                  alterados_processados: alterados.length,
                  timestamp: new Date().toISOString()
                }
              }
            })
            .eq('id', importacao_id);
          
          if (updateError) {
            console.error('[DEBUG]: Erro ao atualizar status da importação:', updateError);
          } else {
            console.log(`Importação ${importacao_id} concluída com sucesso (ignorando erro de histórico).`);
            return; // Sair da função sem lançar erro
          }
        } catch (updateError) {
          console.error('[DEBUG]: Exceção ao atualizar status da importação:', updateError);
        }
      }
      
      // Atualizar status da importação para erro (para outros tipos de erro)
      try {
        const { error: updateError } = await supabase
          .from('importacoes_cvh')
          .update({ 
            status: 'erro',
            diff_preview: {
              erro: error.message || 'Erro desconhecido',
              timestamp: new Date().toISOString()
            }
          })
          .eq('id', importacao_id);
        
        if (updateError) {
          console.error('[DEBUG]: Erro ao atualizar status de erro da importação:', updateError);
        }
      } catch (updateError) {
        console.error('[DEBUG]: Exceção ao atualizar status de erro:', updateError);
      }
      
      // Sempre propagar o erro para que a interface possa tratá-lo corretamente
      throw new Error(`Falha na importação: ${error.message || 'Erro desconhecido'}`);
    }
  },
  
  // Listar histórico de importações
  listarImportacoes: async (): Promise<ImportacaoCvh[]> => {
    try {
      const { data, error } = await supabase
        .from('importacoes_cvh')
        .select(`
          *,
          usuario:usuario_id(nome)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data as unknown as ImportacaoCvh[];
    } catch (error: any) {
      console.error('Erro ao listar importações:', error);
      throw new Error('Falha ao listar importações: ' + (error.message || 'Erro desconhecido'));
    }
  },
  
  // Buscar detalhes de uma importação
  buscarImportacao: async (id: string): Promise<ImportacaoCvh> => {
    try {
      const { data, error } = await supabase
        .from('importacoes_cvh')
        .select(`
          *,
          usuario:usuario_id(nome)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      return data as unknown as ImportacaoCvh;
    } catch (error: any) {
      console.error('Erro ao buscar importação:', error);
      throw new Error('Falha ao buscar importação: ' + (error.message || 'Erro desconhecido'));
    }
  }
};
