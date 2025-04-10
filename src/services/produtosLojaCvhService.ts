import { supabase } from '../lib/supabaseClient';
import { usuarioService } from './usuarioService';

// Tipos
export interface ProdutoLojaCvh {
  id?: string;
  loja_id: string;
  codbarra: string;
  ativo: boolean;
  criado_em?: string;
  atualizado_em?: string;
  ativado_por?: string;
  atualizado_por?: string;
  motivo_alteracao?: string;
  destaque?: boolean;
  ordem_exibicao?: number;
  metadata?: Record<string, any>;
}

// Interface estendida que inclui dados do produto
export interface ProdutoLojaCvhCompleto extends ProdutoLojaCvh {
  produto?: {
    item_code: string;
    descricao: string;
    categoria: string;
    cor: string;
    // Outros campos do produto que possam ser necessários
  };
  item_code?: string;
  descricao?: string;
  categoria?: string;
  cor?: string;
  associado: boolean; // Indica se o produto está associado à loja
}

// Interface para operações em lote
export interface OperacaoProdutoLoja {
  codbarra: string;
  ativo: boolean;
  motivo_alteracao?: string;
  destaque?: boolean;
  ordem_exibicao?: number;
  metadata?: Record<string, any>;
}

// Interface para resultados de operações em lote
export interface ResultadoOperacaoBatch {
  sucesso: OperacaoProdutoLoja[];
  falha: {
    operacao: OperacaoProdutoLoja;
    erro: string;
  }[];
}

// Interface para filtros
export interface FiltrosProdutosLoja {
  item_code?: string;
  codbarra?: string;
  descricao?: string;
  cor?: string[];
  categoria?: string[];
  ativo?: boolean | null; // null significa "todos"
}

// Serviço para gerenciar produtos por loja
export const produtosLojaCvhService = {
  // Listar produtos de uma loja com filtros
  listarProdutos: async (loja_id: string, filtros?: FiltrosProdutosLoja): Promise<ProdutoLojaCvhCompleto[]> => {
    try {
      // Primeiro, buscar todos os produtos da tabela produtos_cvh
      let produtosQuery = supabase
        .from('produtos_cvh')
        .select('*');

      // Aplicar filtros relacionados aos produtos
      if (filtros) {
        // Filtrar por descrição
        if (filtros.descricao) {
          produtosQuery = produtosQuery.ilike('descricao', `%${filtros.descricao}%`);
        }

        // Filtrar por código de barras
        if (filtros.codbarra) {
          produtosQuery = produtosQuery.ilike('codbarra', `%${filtros.codbarra}%`);
        }

        // Filtrar por item_code
        if (filtros.item_code) {
          produtosQuery = produtosQuery.ilike('item_code', `%${filtros.item_code}%`);
        }

        // Filtrar por categoria
        if (filtros.categoria && filtros.categoria.length > 0) {
          produtosQuery = produtosQuery.in('categoria', filtros.categoria);
        }

        // Filtrar por cor
        if (filtros.cor && filtros.cor.length > 0) {
          produtosQuery = produtosQuery.in('cor', filtros.cor);
        }
      }

      // Executar a query para obter todos os produtos
      const { data: produtosCvh, error: produtosError } = await produtosQuery;

      if (produtosError) {
        console.error('Erro ao buscar produtos:', produtosError);
        throw new Error(`Erro ao buscar produtos: ${produtosError.message}`);
      }
      
      if (!produtosCvh || produtosCvh.length === 0) {
        return [];
      }

      // Buscar as associações da loja com produtos
      const { data: associacoes, error: associacoesError } = await supabase
        .from('produtos_loja_cvh')
        .select('*')
        .eq('loja_id', loja_id);

      if (associacoesError) {
        console.error('Erro ao buscar associações:', associacoesError);
        throw new Error(`Erro ao buscar associações: ${associacoesError.message}`);
      }
      
      // Criar um mapa de associações para facilitar a verificação
      const mapaAssociacoes = new Map();
      associacoes?.forEach(assoc => {
        mapaAssociacoes.set(assoc.codbarra, assoc);
      });
      
      // Mapear os produtos com informações de associação
      const produtosComAssociacao = produtosCvh.map((produto: any) => {
        const associacao = mapaAssociacoes.get(produto.codbarra);
        const associado = !!associacao;

        // Construir o objeto completo
        const produtoCompleto: ProdutoLojaCvhCompleto = {
          id: associacao?.id || '',
          loja_id,
          codbarra: produto.codbarra,
          ativo: associacao?.ativo || false,
          destaque: associacao?.destaque || false,
          ordem_exibicao: associacao?.ordem_exibicao || null,
          criado_em: associacao?.criado_em || null,
          atualizado_em: associacao?.atualizado_em || null,
          ativado_por: associacao?.ativado_por || null,
          atualizado_por: associacao?.atualizado_por || null,
          motivo_alteracao: associacao?.motivo_alteracao || null,
          metadata: associacao?.metadata || {},
          associado: associado,
          produto: {
            item_code: produto.item_code || '',
            descricao: produto.descricao || '',
            categoria: produto.categoria || '',
            cor: produto.cor || ''
          },
          item_code: produto.item_code || '',
          descricao: produto.descricao || '',
          categoria: produto.categoria || '',
          cor: produto.cor || ''
        };

        return produtoCompleto;
      });
      
      console.log(`[DEBUG]: Encontrados ${produtosComAssociacao.length} produtos para a loja ${loja_id}`);
      // Aplicar filtros
      let produtosFiltrados = produtosComAssociacao;
      
      if (filtros) {
        if (filtros.item_code) {
          produtosFiltrados = produtosFiltrados.filter(p => 
            p.item_code?.toLowerCase().includes(filtros.item_code!.toLowerCase())
          );
        }
        
        if (filtros.descricao) {
          produtosFiltrados = produtosFiltrados.filter(p => 
            p.descricao?.toLowerCase().includes(filtros.descricao!.toLowerCase())
          );
        }
        
        if (filtros.codbarra) {
          produtosFiltrados = produtosFiltrados.filter(p => 
            p.codbarra.toLowerCase().includes(filtros.codbarra!.toLowerCase())
          );
        }
        
        if (filtros.categoria && filtros.categoria.length > 0) {
          produtosFiltrados = produtosFiltrados.filter(p => 
            p.categoria && filtros.categoria!.includes(p.categoria)
          );
        }
        
        if (filtros.cor && filtros.cor.length > 0) {
          produtosFiltrados = produtosFiltrados.filter(p => 
            p.cor && filtros.cor!.includes(p.cor)
          );
        }
        
        if (filtros.ativo !== null && filtros.ativo !== undefined) {
          if (filtros.ativo === true) {
            // Para produtos ativos, eles devem estar associados E ativos
            produtosFiltrados = produtosFiltrados.filter(p => p.associado && p.ativo === true);
          } else {
            // Para produtos inativos, mostramos todos que não estão ativos
            // (tanto os associados mas inativos quanto os não associados)
            produtosFiltrados = produtosFiltrados.filter(p => !p.ativo || !p.associado);
          }
        }
      }
      
      return produtosFiltrados;
    } catch (error: any) {
      console.error('[ERRO]: Exceção ao listar produtos:', error);
      throw new Error(`Falha ao listar produtos: ${error.message}`);
    }
  },
  
  // Atualizar um produto (ativar/desativar)
  atualizarProduto: async (produto: ProdutoLojaCvh): Promise<ProdutoLojaCvh> => {
    try {
      console.log('[DEBUG]: Atualizando produto:', produto.codbarra);
      
      // Verificar se o produto já está associado à loja
      const { data: existente, error: erroConsulta } = await supabase
        .from('produtos_loja_cvh')
        .select('*')
        .eq('loja_id', produto.loja_id)
        .eq('codbarra', produto.codbarra)
        .maybeSingle();
      
      if (erroConsulta) {
        console.error('[ERRO]: Falha ao verificar produto existente:', erroConsulta);
        throw new Error(`Falha ao verificar produto existente: ${erroConsulta.message}`);
      }
      
      let resultado;
      
      // Se o produto já existe, atualizar
      if (existente) {
        console.log('[DEBUG]: Atualizando produto existente:', existente.id);
        
        const { data, error } = await supabase
          .from('produtos_loja_cvh')
          .update({
            ativo: produto.ativo,
            atualizado_em: new Date().toISOString(),
            atualizado_por: produto.atualizado_por,
            motivo_alteracao: produto.motivo_alteracao,
            destaque: produto.destaque,
            ordem_exibicao: produto.ordem_exibicao,
            metadata: produto.metadata
          })
          .eq('id', existente.id)
          .select()
          .single();
        
        if (error) {
          console.error('[ERRO]: Falha ao atualizar produto:', error);
          throw new Error(`Falha ao atualizar produto: ${error.message}`);
        }
        
        resultado = data;
      } else {
        // Se não existe, inserir novo
        console.log('[DEBUG]: Inserindo nova associação de produto para a loja');
        
        const { data, error } = await supabase
          .from('produtos_loja_cvh')
          .insert({
            loja_id: produto.loja_id,
            codbarra: produto.codbarra,
            ativo: produto.ativo,
            ativado_por: produto.atualizado_por,
            atualizado_por: produto.atualizado_por,
            motivo_alteracao: produto.motivo_alteracao,
            destaque: produto.destaque,
            ordem_exibicao: produto.ordem_exibicao,
            metadata: produto.metadata
          })
          .select()
          .single();
        
        if (error) {
          console.error('[ERRO]: Falha ao inserir produto:', error);
          throw new Error(`Falha ao inserir produto: ${error.message}`);
        }
        
        resultado = data;
      }
      
      console.log('[DEBUG]: Produto atualizado com sucesso:', resultado.id);
      return resultado;
    } catch (error: any) {
      console.error('[ERRO]: Exceção ao atualizar produto:', error);
      throw new Error(`Falha ao atualizar produto: ${error.message}`);
    }
  },
  
  // Atualizar vários produtos em lote
  atualizarProdutosEmLote: async (loja_id: string, operacoes: OperacaoProdutoLoja[], usuario_id: string): Promise<ResultadoOperacaoBatch> => {
    try {
      console.log(`[DEBUG]: Iniciando atualização em lote de ${operacoes.length} produtos para loja ${loja_id}`);
      
      const resultado: ResultadoOperacaoBatch = {
        sucesso: [],
        falha: []
      };
      
      // Processar cada operação individualmente
      for (const operacao of operacoes) {
        try {
          // Obter o email do usuário
          const usuario = await usuarioService.buscarUsuarioPorId(usuario_id);
          const emailUsuario = usuario?.email || usuario_id; // Fallback para o ID caso não encontre o email
          
          console.log(`[DEBUG]: Email do usuário obtido: ${emailUsuario}`);
          
          // Criar metadata com informações de associação
          const metadata = {
            ...operacao.metadata,
            associado_em: new Date().toISOString(),
            associado_por: emailUsuario // Usamos o email do usuário
          };
          
          await produtosLojaCvhService.atualizarProduto({
            loja_id,
            codbarra: operacao.codbarra,
            ativo: operacao.ativo,
            atualizado_por: usuario_id,
            motivo_alteracao: operacao.motivo_alteracao,
            destaque: operacao.destaque,
            ordem_exibicao: operacao.ordem_exibicao,
            metadata: metadata
          });
          
          resultado.sucesso.push(operacao);
        } catch (error: any) {
          console.error(`[ERRO]: Falha ao processar produto ${operacao.codbarra}:`, error);
          resultado.falha.push({
            operacao,
            erro: error.message || 'Erro desconhecido'
          });
        }
      }
      
      console.log(`[DEBUG]: Atualização em lote concluída. Sucesso: ${resultado.sucesso.length}, Falhas: ${resultado.falha.length}`);
      return resultado;
    } catch (error: any) {
      console.error('[ERRO]: Exceção ao atualizar produtos em lote:', error);
      throw new Error(`Falha ao atualizar produtos em lote: ${error.message}`);
    }
  },
  
  // Obter opções para filtros (categorias e cores disponíveis)
  obterOpcoesFiltro: async (loja_id: string): Promise<{ categorias: string[], cores: string[] }> => {
    try {
      console.log('[DEBUG]: Obtendo opções para filtros');
      
      // Obter categorias únicas
      const { data: categorias, error: erroCategorias } = await supabase
        .from('produtos_cvh')
        .select('categoria')
        .order('categoria')
        .not('categoria', 'is', null);
      
      if (erroCategorias) {
        console.error('[ERRO]: Falha ao obter categorias:', erroCategorias);
        throw erroCategorias;
      }
      
      // Obter cores únicas
      const { data: cores, error: erroCores } = await supabase
        .from('produtos_cvh')
        .select('cor')
        .order('cor')
        .not('cor', 'is', null);
      
      if (erroCores) {
        console.error('[ERRO]: Falha ao obter cores:', erroCores);
        throw erroCores;
      }
      
      // Extrair valores únicos
      const categoriasUnicas = [...new Set(categorias.map(item => item.categoria))];
      const coresUnicas = [...new Set(cores.map(item => item.cor))];
      
      console.log(`[DEBUG]: Encontradas ${categoriasUnicas.length} categorias e ${coresUnicas.length} cores`);
      
      return {
        categorias: categoriasUnicas,
        cores: coresUnicas
      };
    } catch (error: any) {
      console.error('[ERRO]: Exceção ao obter opções para filtros:', error);
      throw new Error(`Falha ao obter opções para filtros: ${error.message}`);
    }
  },
  
  // Obter contagem de produtos ativos e inativos
  obterContagem: async (loja_id: string): Promise<{ ativos: number, inativos: number, total: number }> => {
    try {
      console.log('[DEBUG]: Obtendo contagem de produtos para loja:', loja_id);
      
      // Contar produtos ativos
      const { count: ativos, error: erroAtivos } = await supabase
        .from('produtos_loja_cvh')
        .select('id', { count: 'exact', head: true })
        .eq('loja_id', loja_id)
        .eq('ativo', true);
      
      if (erroAtivos) {
        console.error('[ERRO]: Falha ao contar produtos ativos:', erroAtivos);
        throw erroAtivos;
      }
      
      // Contar produtos inativos
      const { count: inativos, error: erroInativos } = await supabase
        .from('produtos_loja_cvh')
        .select('id', { count: 'exact', head: true })
        .eq('loja_id', loja_id)
        .eq('ativo', false);
      
      if (erroInativos) {
        console.error('[ERRO]: Falha ao contar produtos inativos:', erroInativos);
        throw erroInativos;
      }
      
      // Contar total de produtos no catálogo CVH
      const { count: total, error: erroTotal } = await supabase
        .from('produtos_cvh')
        .select('codbarra', { count: 'exact', head: true });
      
      if (erroTotal) {
        console.error('[ERRO]: Falha ao contar total de produtos:', erroTotal);
        throw erroTotal;
      }
      
      console.log(`[DEBUG]: Contagem - Ativos: ${ativos}, Inativos: ${inativos}, Total: ${total}`);
      
      return {
        ativos: ativos || 0,
        inativos: inativos || 0,
        total: total || 0
      };
    } catch (error: any) {
      console.error('[ERRO]: Exceção ao obter contagem de produtos:', error);
      throw new Error(`Falha ao obter contagem: ${error.message}`);
    }
  },
  
  // Executar diagnóstico de produtos para uma loja
  executarDiagnostico: async (loja_id: string, usuario_id: string): Promise<void> => {
    try {
      console.log('[DEBUG]: Executando diagnóstico para loja:', loja_id);
      
      // Verificar produtos com associações inválidas
      const { data: associacoesInvalidas, error: erroAssociacoes } = await supabase
        .from('produtos_loja_cvh')
        .select('codbarra')
        .eq('loja_id', loja_id)
        .not('codbarra', 'in', supabase.from('produtos_cvh').select('codbarra'));
      
      if (erroAssociacoes) {
        console.error('[ERRO]: Falha ao verificar associações inválidas:', erroAssociacoes);
        throw erroAssociacoes;
      }
      
      // Se encontrar associações inválidas, removê-las
      if (associacoesInvalidas && associacoesInvalidas.length > 0) {
        console.log(`[DEBUG]: Encontradas ${associacoesInvalidas.length} associações inválidas. Removendo...`);
        
        const codbarras = associacoesInvalidas.map(item => item.codbarra);
        
        const { error: erroRemocao } = await supabase
          .from('produtos_loja_cvh')
          .delete()
          .eq('loja_id', loja_id)
          .in('codbarra', codbarras);
        
        if (erroRemocao) {
          console.error('[ERRO]: Falha ao remover associações inválidas:', erroRemocao);
          throw erroRemocao;
        }
        
        // Registrar a operação de diagnóstico
        await supabase
          .from('logs_operacoes')
          .insert({
            tipo: 'diagnostico',
            usuario_id,
            loja_id,
            detalhes: {
              associacoes_removidas: codbarras,
              motivo: 'Produtos não existentes no catálogo CVH'
            }
          });
      } else {
        console.log('[DEBUG]: Nenhuma associação inválida encontrada.');
        
        // Registrar a operação de diagnóstico sem alterações
        await supabase
          .from('logs_operacoes')
          .insert({
            tipo: 'diagnostico',
            usuario_id,
            loja_id,
            detalhes: {
              resultado: 'Nenhum problema encontrado'
            }
          });
      }
      
      console.log('[DEBUG]: Diagnóstico concluído com sucesso.');
    } catch (error: any) {
      console.error('[ERRO]: Exceção ao executar diagnóstico:', error);
      throw new Error(`Falha ao executar diagnóstico: ${error.message}`);
    }
  }
};

export default produtosLojaCvhService;