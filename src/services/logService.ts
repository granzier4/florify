import { supabase } from './supabase';

/**
 * Tipos para o serviço de logs
 */
interface BaseLogParams {
  importacao_id: string;
  usuario_id?: string;
  nome_arquivo: string;
}

interface SucessoImportacaoParams extends BaseLogParams {
  novos: number;
  alterados: number;
}

interface ErroImportacaoParams {
  importacao_id: string;
  usuario_id?: string;
  mensagem: string;
  erro: any;
  metadata?: Record<string, any>;
}

interface AlteracaoProdutoParams extends BaseLogParams {
  codbarra: string; // Chave principal para identificação do produto
  item_code: string;
  dados_anteriores: Record<string, any>;
  dados_novos: Record<string, any>;
  campos_alterados: string[];
}

interface NovoProdutoParams extends BaseLogParams {
  produto: {
    codbarra: string;
    item_code?: string;
    [key: string]: any;
  };
}

interface ErroOperacaoParams extends BaseLogParams {
  codbarra?: string; // Chave principal para identificação do produto
  item_code?: string;
  tipo_operacao: string;
  mensagem_erro: string;
  erro: any;
  metadata?: Record<string, any>;
}

interface LogRecord {
  importacao_id: string;
  usuario_id?: string;
  item_code?: string;
  codbarra?: string;
  tipo_operacao: string;
  status: 'sucesso' | 'erro';
  mensagem_erro?: string;
  dados_anteriores?: Record<string, any>;
  dados_novos?: Record<string, any>;
  metadata?: Record<string, any>;
  data_alteracao?: string;
}

/**
 * Serviço para gerenciamento de logs de importação de produtos
 */
export const logService = {
  /**
   * Cria um objeto de metadados base para os logs
   */
  criarMetadataBase: (nome_arquivo: string, extra?: Record<string, any>): Record<string, any> => {
    return {
      arquivo: nome_arquivo,
      timestamp: new Date().toISOString(),
      ambiente: process.env.NODE_ENV || 'development',
      versao: process.env.VERSION || '1.0.0',
      ...extra
    };
  },

  /**
   * Registra um log de sucesso na importação
   */
  registrarSucessoImportacao: async (params: SucessoImportacaoParams): Promise<void> => {
    try {
      const { importacao_id, usuario_id, nome_arquivo, novos, alterados } = params;
      
      await supabase
        .from('historico_produtos_cvh')
        .insert({
          importacao_id,
          usuario_id,
          tipo_operacao: 'importacao',
          status: 'sucesso',
          metadata: logService.criarMetadataBase(nome_arquivo, {
            novos,
            alterados,
            total: novos + alterados
          })
        });
      
      console.log('[Log]: Sucesso de importação registrado');
    } catch (error: any) {
      console.error('[Log]: Falha ao registrar sucesso de importação', error);
      // Não propagar erro para não interromper o fluxo principal
    }
  },
  
  /**
   * Registra um log de erro na importação
   */
  registrarErroImportacao: async (params: ErroImportacaoParams): Promise<void> => {
    try {
      const { importacao_id, usuario_id, mensagem, erro, metadata = {} } = params;
      
      await supabase
        .from('historico_produtos_cvh')
        .insert({
          importacao_id,
          usuario_id,
          tipo_operacao: 'importacao',
          status: 'erro',
          mensagem_erro: mensagem,
          metadata: {
            timestamp: new Date().toISOString(),
            erro_tecnico: erro.message || 'Erro desconhecido',
            stack: erro.stack,
            ...metadata
          }
        });
      
      console.log('[Log]: Erro de importação registrado');
    } catch (error: any) {
      console.error('[Log]: Falha ao registrar erro de importação', error);
      // Não propagar erro para não interromper o fluxo principal
    }
  },
  
  /**
   * Registra um log de alteração de produto
   * Usa codbarra como chave principal para identificação
   */
  registrarAlteracaoProduto: async (params: AlteracaoProdutoParams): Promise<void> => {
    try {
      const { 
        importacao_id, 
        usuario_id, 
        nome_arquivo, 
        item_code, 
        codbarra, 
        dados_anteriores, 
        dados_novos, 
        campos_alterados 
      } = params;
      
      await supabase
        .from('historico_produtos_cvh')
        .insert({
          importacao_id,
          usuario_id,
          dados_anteriores,
          dados_novos,
          item_code,
          codbarra,
          tipo_operacao: 'alteracao',
          status: 'sucesso',
          metadata: logService.criarMetadataBase(nome_arquivo, {
            campos_alterados,
            operacao: 'atualizacao_produto'
          })
        });
    } catch (error: any) {
      console.error(`[Log]: Falha ao registrar alteração do produto ${params.codbarra}`, error);
      // Não propagar erro para não interromper o fluxo principal
    }
  },
  
  /**
   * Registra um log de novo produto
   * Usa codbarra como chave principal para identificação
   */
  registrarNovoProduto: async (params: NovoProdutoParams): Promise<void> => {
    try {
      const { importacao_id, usuario_id, nome_arquivo, produto } = params;
      
      if (!produto.codbarra) {
        console.error('[Log]: Tentativa de registrar novo produto sem codbarra');
        return;
      }
      
      await supabase
        .from('historico_produtos_cvh')
        .insert({
          importacao_id,
          usuario_id,
          dados_novos: produto,
          item_code: produto.item_code || '',
          codbarra: produto.codbarra,
          tipo_operacao: 'insercao',
          status: 'sucesso',
          metadata: logService.criarMetadataBase(nome_arquivo, {
            operacao: 'novo_produto'
          })
        });
    } catch (error: any) {
      console.error(`[Log]: Falha ao registrar novo produto ${params.produto.codbarra}`, error);
      // Não propagar erro para não interromper o fluxo principal
    }
  },
  
  /**
   * Registra um erro específico em uma operação
   * Usa codbarra como chave principal para identificação quando disponível
   */
  registrarErroOperacao: async (params: ErroOperacaoParams): Promise<void> => {
    try {
      const { 
        importacao_id, 
        usuario_id, 
        nome_arquivo, 
        item_code = '', 
        codbarra = '', 
        tipo_operacao, 
        mensagem_erro, 
        erro, 
        metadata 
      } = params;
      
      await supabase
        .from('historico_produtos_cvh')
        .insert({
          importacao_id,
          usuario_id,
          item_code,
          codbarra,
          tipo_operacao,
          status: 'erro',
          mensagem_erro,
          metadata: logService.criarMetadataBase(nome_arquivo, {
            erro_tecnico: erro.message || 'Erro desconhecido',
            codigo_erro: erro.code,
            ...metadata
          })
        });
    } catch (error: any) {
      console.error(`[Log]: Falha ao registrar erro de operação`, error);
      // Não propagar erro para não interromper o fluxo principal
    }
  },
  
  /**
   * Registra logs em lote (para melhor performance)
   */
  registrarLogsEmLote: async (logs: Partial<LogRecord>[]): Promise<void> => {
    try {
      // Garantir que os campos estejam no formato correto antes de inserir
      const logsFormatados = logs.map(log => {
        // Garantir que codbarra seja a chave principal para identificação
        if (!log.codbarra) {
          console.warn('[Log]: Registro sem codbarra definido. Isto não é recomendado.');
        }
        
        // Garantir que todos os campos obrigatórios existam
        return {
          ...log,
          item_code: log.item_code || '',
          codbarra: log.codbarra || '',
          tipo_operacao: log.tipo_operacao || 'desconhecido',
          status: log.status || 'desconhecido',
          data_alteracao: log.data_alteracao || new Date().toISOString()
        };
      });
      
      // Inserir logs em batches para evitar limites de tamanho
      const batchSize = 50;
      for (let i = 0; i < logsFormatados.length; i += batchSize) {
        const batch = logsFormatados.slice(i, i + batchSize);
        const { error } = await supabase
          .from('historico_produtos_cvh')
          .insert(batch);
        
        if (error) {
          console.error(`[DB]: Aviso - Falha ao registrar lote de logs (${i}-${i+batch.length})`, error);
        }
      }
    } catch (error: any) {
      console.error('[Log]: Falha ao registrar logs em lote', error);
      // Não propagar erro para não interromper o fluxo principal
    }
  }
};
