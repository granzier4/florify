import { supabase } from './supabase';
import Papa from 'papaparse';

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
      const { data, error } = await supabase
        .from('produtos_cvh')
        .select('*')
        .order('descricao', { ascending: true });
      
      if (error) throw error;
      return data as ProdutoCvh[];
    } catch (error: any) {
      console.error('Erro ao listar produtos CVH:', error);
      throw new Error('Falha ao listar produtos: ' + (error.message || 'Erro desconhecido'));
    }
  },
  
  // Buscar produto por código
  buscarProdutoPorCodigo: async (item_code: string): Promise<ProdutoCvh | null> => {
    try {
      // Usar o método de filtro para evitar problemas com caracteres especiais na URL
      const { data, error } = await supabase
        .from('produtos_cvh')
        .select('*')
        .filter('item_code', 'eq', item_code);
      
      if (error) {
        console.error('Erro ao buscar produto:', error);
        throw error;
      }
      
      return data && data.length > 0 ? data[0] as ProdutoCvh : null;
    } catch (error) {
      console.error(`Erro ao buscar produto ${item_code}:`, error);
      return null;
    }
  },
  
  // Buscar produto por código de barras
  buscarProdutoPorCodigoBarras: async (codbarra: string): Promise<ProdutoCvh | null> => {
    try {
      // Usar o método de filtro para evitar problemas com caracteres especiais na URL
      const { data, error } = await supabase
        .from('produtos_cvh')
        .select('*')
        .filter('codbarra', 'eq', codbarra);
      
      if (error) {
        console.error('Erro ao buscar produto por código de barras:', error);
        throw error;
      }
      
      return data && data.length > 0 ? data[0] as ProdutoCvh : null;
    } catch (error) {
      console.error(`Erro ao buscar produto com código de barras ${codbarra}:`, error);
      return null;
    }
  },
  
  // Analisar arquivo CSV
  analisarArquivoCsv: async (file: File): Promise<ResultadoAnalise> => {
    return new Promise((resolve, reject) => {
      const resultado: ResultadoAnalise = {
        novos: [],
        alterados: [],
        semAlteracao: [],
        erros: []
      };
      
      try {
        console.log('Iniciando análise do arquivo CSV...');
        
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: true,
          delimiter: ';', // Definindo o delimitador como ponto e vírgula
          complete: async (results) => {
            try {
              const { data, errors } = results;
              console.log(`Total de linhas no CSV: ${data.length}`);
              
              // Registrar erros de parse
              if (errors && errors.length > 0) {
                console.warn('Erros encontrados durante o parse do CSV:', errors);
                errors.forEach(err => {
                  resultado.erros.push({
                    linha: err.row !== undefined ? err.row : -1,
                    erro: err.message
                  });
                });
              }
              
              // Primeiro, carregar todos os produtos existentes de uma vez
              console.log('Buscando produtos existentes no banco de dados...');
              const { data: produtosExistentes, error: errorBusca } = await supabase
                .from('produtos_cvh')
                .select('*');
              
              if (errorBusca) {
                console.error('Erro ao buscar produtos existentes:', errorBusca);
                throw new Error(`Erro ao buscar produtos existentes: ${errorBusca.message}`);
              }
              
              // Criar um mapa de produtos por código de barras para facilitar a busca
              const mapaProdutosPorCodigoBarras = new Map<string, ProdutoCvh>();
              // Criar um mapa de produtos por item_code para facilitar a busca
              const mapaProdutosPorItemCode = new Map<string, ProdutoCvh>();
              
              if (produtosExistentes && produtosExistentes.length > 0) {
                produtosExistentes.forEach((produto: any) => {
                  // Mapear por código de barras se disponível
                  if (produto.codbarra) {
                    mapaProdutosPorCodigoBarras.set(produto.codbarra, produto as ProdutoCvh);
                  }
                  // Mapear por item_code também
                  if (produto.item_code) {
                    mapaProdutosPorItemCode.set(produto.item_code, produto as ProdutoCvh);
                  }
                });
              }
              
              console.log(`Total de produtos existentes no banco: ${produtosExistentes?.length || 0}`);
              console.log(`Produtos mapeados por código de barras: ${mapaProdutosPorCodigoBarras.size}`);
              console.log(`Produtos mapeados por item_code: ${mapaProdutosPorItemCode.size}`);
              
              // Criar um mapa para os produtos do CSV por item_code para verificar duplicidades
              const produtosCsvMap = new Map<string, any>();
              data.forEach((row: any) => {
                if (row.ITEM_CODE) {
                  produtosCsvMap.set(row.ITEM_CODE, row);
                }
              });
              
              // Validar e processar cada linha
              for (let i = 0; i < data.length; i++) {
                const row = data[i] as any;
                
                // Mapeamento dos campos do CSV para os campos do banco de dados
                const produtoCsv: ProdutoCvh = {
                  item_code: row.ITEM_CODE,
                  codbarra: row.CODBARRA,
                  descricao: row.DESCRICAO,
                  descricao_curta: row.DESCRICAO_CURTA,
                  cod_categoria: row.COD_CATEGORIA,
                  descricao_categoria: row.DESCRICAO_CATEGORIA,
                  cod_grupo: row.COD_GRUPO,
                  descricao_grupo: row.DESCRICAO_GRUPO,
                  data_cadastro: formatarDataParaPostgres(row.DATA_CADASTRO),
                  ncm: row.NCM,
                  class_cond: row.CLASS_COND,
                  grupo_com: row.GRUPO_COM,
                  grupo_log: row.GRUPO_LOG,
                  cst_sp: row.CST_SP,
                  peso: row.PESO,
                  cpc: row.CPC,
                  epc: row.EPC,
                  upc: row.UPC,
                  cor: row.COR,
                  foto: row.FOTO,
                  // Campos obrigatórios que precisam ser definidos
                  preco_unitario: 0, // Será definido posteriormente
                  unidade_medida: 'UN', // Valor padrão
                };
                
                // Validar campos obrigatórios
                if (!produtoCsv.item_code || !produtoCsv.descricao || !produtoCsv.codbarra) {
                  console.warn(`Linha ${i+2}: Campos obrigatórios ausentes`);
                  resultado.erros.push({
                    linha: i + 2, // +2 porque a linha 1 é o cabeçalho
                    erro: 'Campos obrigatórios ausentes (ITEM_CODE, DESCRICAO, CODBARRA)'
                  });
                  continue;
                }
                
                // Verificar se o produto já existe pelo código de barras
                const produtoExistentePorCodigoBarras = mapaProdutosPorCodigoBarras.get(produtoCsv.codbarra);
                // Verificar se o produto já existe pelo item_code
                const produtoExistentePorItemCode = mapaProdutosPorItemCode.get(produtoCsv.item_code);
                
                // Determinar qual produto existente usar para comparação
                let produtoExistente = null;
                
                // Prioridade 1: Usar o produto com o mesmo código de barras
                if (produtoExistentePorCodigoBarras) {
                  produtoExistente = produtoExistentePorCodigoBarras;
                } 
                // Prioridade 2: Usar o produto com o mesmo item_code
                else if (produtoExistentePorItemCode) {
                  produtoExistente = produtoExistentePorItemCode;
                }
                
                if (produtoExistente) {
                  // Produto já existe, verificar se há alterações
                  const diferencas: Record<string, { de: any; para: any }> = {};
                  let temAlteracao = false;
                  
                  // Lista de campos a ignorar na comparação
                  const camposIgnorar = ['importacao_id', 'lastupdatedate', 'id', 'created_at'];
                  
                  // Comparar todos os campos exceto os ignorados
                  Object.keys(produtoCsv).forEach(key => {
                    const tipedKey = key as keyof ProdutoCvh;
                    
                    // Ignorar campos específicos e undefined
                    if (!camposIgnorar.includes(tipedKey) && 
                        produtoCsv[tipedKey] !== undefined) {
                      
                      // Usar a função de comparação mais precisa
                      if (!compararValores(produtoExistente[tipedKey], produtoCsv[tipedKey])) {
                        // Verificar se a diferença é significativa
                        const valorExistente = produtoExistente[tipedKey];
                        const valorNovo = produtoCsv[tipedKey];
                        
                        // Ignorar diferenças entre null/undefined e string vazia
                        if ((valorExistente === null || valorExistente === undefined) && 
                            (valorNovo === '' || valorNovo === null || valorNovo === undefined)) {
                          return;
                        }
                        if ((valorNovo === null || valorNovo === undefined) && 
                            (valorExistente === '' || valorExistente === null || valorExistente === undefined)) {
                          return;
                        }
                        
                        // Ignorar diferenças entre números e strings numéricas
                        if (typeof valorExistente === 'number' && typeof valorNovo === 'string' && 
                            valorExistente.toString() === valorNovo) {
                          return;
                        }
                        if (typeof valorNovo === 'number' && typeof valorExistente === 'string' && 
                            valorNovo.toString() === valorExistente) {
                          return;
                        }
                        
                        // Registrar a diferença
                        diferencas[key] = {
                          de: valorExistente,
                          para: valorNovo
                        };
                        temAlteracao = true;
                      }
                    }
                  });
                  
                  if (temAlteracao) {
                    console.log(`Produto alterado: ${produtoCsv.codbarra}, diferenças:`, diferencas);
                    resultado.alterados.push({
                      atual: produtoExistente,
                      novo: produtoCsv,
                      diferencas
                    });
                  } else {
                    console.log(`Produto sem alteração: ${produtoCsv.codbarra}`);
                    resultado.semAlteracao.push(produtoExistente);
                  }
                } else {
                  // Produto novo
                  console.log(`Novo produto: ${produtoCsv.codbarra}`);
                  resultado.novos.push(produtoCsv);
                }
              }
              
              console.log(`Análise concluída: ${resultado.novos.length} novos, ${resultado.alterados.length} alterados, ${resultado.semAlteracao.length} sem alteração`);
              resolve(resultado);
            } catch (error) {
              console.error('Erro ao processar dados do CSV:', error);
              reject(new Error(`Erro ao processar dados do CSV: ${(error as Error).message}`));
            }
          },
          error: (error) => {
            console.error('Erro ao fazer parse do CSV:', error);
            reject(new Error(`Erro ao fazer parse do CSV: ${error.message}`));
          }
        });
      } catch (error) {
        console.error('Erro ao analisar arquivo CSV:', error);
        reject(new Error(`Erro ao analisar arquivo CSV: ${(error as Error).message}`));
      }
    });
  },
  
  // Salvar arquivo no Storage
  salvarArquivoStorage: async (file: File, userId: string): Promise<string> => {
    try {
      const fileName = `${userId}_${Date.now()}_${file.name}`;
      const filePath = `${fileName}`;
      
      const { error } = await supabase.storage
        .from('cvh-imports') // Usando o nome correto do bucket
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('Erro ao fazer upload do arquivo:', error);
        throw new Error(`Erro ao fazer upload do arquivo: ${error.message}`);
      }
      
      return filePath;
    } catch (error: any) {
      console.error('Erro ao salvar arquivo no storage:', error);
      throw new Error(`Erro ao salvar arquivo no storage: ${error.message}`);
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
  
  // Atualizar status da importação
  atualizarStatusImportacao: async (id: string, status: 'concluido' | 'pendente' | 'erro'): Promise<void> => {
    try {
      const { error } = await supabase
        .from('importacoes_cvh')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
    } catch (error: any) {
      console.error('Erro ao atualizar status da importação:', error);
      throw new Error('Falha ao atualizar status: ' + (error.message || 'Erro desconhecido'));
    }
  },
  
  // Confirmar importação
  confirmarImportacao: async (importacao_id: string, novos: ProdutoCvh[], alterados: ProdutoAlterado[]): Promise<void> => {
    try {
      console.log(`Iniciando importação: ${novos.length} novos, ${alterados.length} alterados`);
      
      // 1. Inserir novos produtos
      if (novos.length > 0) {
        console.log('Inserindo novos produtos...');
        const { error } = await supabase
          .from('produtos_cvh')
          .insert(novos.map(produto => ({
            ...produto,
            importacao_id,
            lastupdatedate: new Date().toISOString()
          })));
        
        if (error) {
          console.error('Erro ao inserir novos produtos:', error);
          throw error;
        }
        console.log('Novos produtos inseridos com sucesso');
      }
      
      // 2. Atualizar produtos alterados
      if (alterados.length > 0) {
        console.log('Atualizando produtos alterados...');
        for (const item of alterados) {
          // Importante: nunca atualizar o código de barras
          const dadosAtualizados = { ...item.novo };
          
          // Manter o código de barras original
          dadosAtualizados.codbarra = item.atual.codbarra;
          
          console.log(`Atualizando produto com código de barras: ${item.atual.codbarra}`);
          
          // Primeiro, vamos registrar o histórico (para evitar problemas com a atualização)
          try {
            // Extrair os valores anteriores e novos das diferenças
            const dadosAnteriores: Record<string, any> = {};
            const dadosNovos: Record<string, any> = {};
            
            Object.entries(item.diferencas).forEach(([campo, { de, para }]) => {
              dadosAnteriores[campo] = de;
              dadosNovos[campo] = para;
            });
            
            // Construir o objeto de inserção com apenas os campos que sabemos que existem
            const historicoObj: Record<string, any> = {
              importacao_id,
              dados_anteriores: dadosAnteriores,
              dados_novos: dadosNovos,
              data_alteracao: new Date().toISOString()
            };
            
            // Adicionar item_cod apenas se o produto tiver este campo
            if (item.atual.item_code) {
              historicoObj.item_cod = item.atual.item_code;
            }
            
            // Adicionar codbarra apenas se o produto tiver este campo
            if (item.atual.codbarra) {
              historicoObj.codbarra = item.atual.codbarra;
            }
            
            // Inserir o registro de histórico diretamente
            const { error: errorHistorico } = await supabase
              .from('historico_produtos_cvh')
              .insert(historicoObj);
            
            if (errorHistorico) {
              console.error(`Erro ao registrar histórico para código de barras ${item.atual.codbarra}:`, errorHistorico);
              // Não lançar erro para não interromper o fluxo principal
            } else {
              console.log(`Histórico registrado com sucesso para código de barras ${item.atual.codbarra}`);
            }
          } catch (errorHistorico) {
            console.error(`Erro ao registrar histórico para código de barras ${item.atual.codbarra}:`, errorHistorico);
            // Não lançar erro para não interromper o fluxo principal
          }
          
          // Agora, atualizar o produto
          const { error } = await supabase
            .from('produtos_cvh')
            .update({
              ...dadosAtualizados,
              importacao_id,
              lastupdatedate: new Date().toISOString()
            })
            .eq('codbarra', item.atual.codbarra);
          
          if (error) {
            console.error(`Erro ao atualizar produto com código de barras ${item.atual.codbarra}:`, error);
            throw error;
          }
        }
        console.log('Produtos alterados atualizados com sucesso');
      }
      
      // 3. Atualizar status da importação
      console.log('Atualizando status da importação...');
      const { error } = await supabase
        .from('importacoes_cvh')
        .update({ status: 'concluido' })
        .eq('id', importacao_id);
      
      if (error) {
        console.error('Erro ao atualizar status da importação:', error);
        throw error;
      }
      
      console.log('Importação concluída com sucesso');
    } catch (error: any) {
      console.error('Erro ao confirmar importação:', error);
      
      // Atualizar status da importação para erro
      await supabase
        .from('importacoes_cvh')
        .update({ 
          status: 'erro',
          diff_preview: {
            ...await produtosCvhService.buscarImportacao(importacao_id).then(imp => imp?.diff_preview || {}),
            erro: error.message
          }
        })
        .eq('id', importacao_id);
      
      throw new Error(`Falha ao confirmar importação: ${error.message}`);
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
        .order('data_importacao', { ascending: false });
      
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
  },
  
  // Buscar histórico de alterações de um produto
  buscarHistoricoProduto: async (item_code: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('historico_produtos_cvh')
        .select(`
          *,
          importacao:importacao_id(
            id,
            nome_arquivo,
            data_importacao,
            usuario_id(nome)
          )
        `)
        .filter('item_code', 'eq', item_code)
        .order('data_alteracao', { ascending: false });
      
      if (error) throw error;
      
      return data || [];
    } catch (error: any) {
      console.error('Erro ao buscar histórico:', error);
      throw new Error('Falha ao buscar histórico: ' + (error.message || 'Erro desconhecido'));
    }
  }
};
