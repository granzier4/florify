import { supabase } from './supabase';

/**
 * Serviço para gerenciamento de logs de importação de produtos
 */
export const logService = {
  /**
   * Registra um log de sucesso na importação
   */
  registrarSucessoImportacao: async (params: {
    importacao_id: string;
    usuario_id?: string;
    nome_arquivo: string;
    novos: number;
    alterados: number;
  }): Promise<void> => {
    try {
      const { importacao_id, usuario_id, nome_arquivo, novos, alterados } = params;
      
      await supabase
        .from('historico_produtos_cvh')
        .insert({
          importacao_id,
          usuario_id,
          tipo_operacao: 'importacao',
          status: 'sucesso',
          metadata: {
            arquivo: nome_arquivo,
            timestamp: new Date().toISOString(),
            novos,
            alterados,
            total: novos + alterados
          }
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
  registrarErroImportacao: async (params: {
    importacao_id: string;
    usuario_id?: string;
    mensagem: string;
    erro: any;
    metadata?: Record<string, any>;
  }): Promise<void> => {
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
  registrarAlteracaoProduto: async (params: {
    importacao_id: string;
    usuario_id?: string;
    nome_arquivo: string;
    item_code: string; // Mantido para compatibilidade, mas não é usado para identificação
    codbarra: string; // Chave principal para identificação do produto
    dados_anteriores: any;
    dados_novos: any;
    campos_alterados: string[];
  }): Promise<void> => {
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
          metadata: {
            arquivo: nome_arquivo,
            timestamp: new Date().toISOString(),
            campos_alterados,
            operacao: 'atualizacao_produto'
          }
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
  registrarNovoProduto: async (params: {
    importacao_id: string;
    usuario_id?: string;
    nome_arquivo: string;
    produto: any; // Deve conter o campo codbarra para identificação
  }): Promise<void> => {
    try {
      const { importacao_id, usuario_id, nome_arquivo, produto } = params;
      
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
          metadata: {
            arquivo: nome_arquivo,
            timestamp: new Date().toISOString(),
            operacao: 'novo_produto'
          }
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
  registrarErroOperacao: async (params: {
    importacao_id: string;
    usuario_id?: string;
    nome_arquivo: string;
    item_code?: string; // Mantido para compatibilidade, mas não é usado para identificação
    itemcode?: string; // Campo antigo, será mapeado para item_code
    codbarra?: string; // Chave principal para identificação do produto
    tipo_operacao: string;
    mensagem_erro: string;
    erro: any;
    metadata?: Record<string, any>;
  }): Promise<void> => {
    try {
      const { 
        importacao_id, 
        usuario_id, 
        nome_arquivo, 
        item_code: paramItemCode, 
        itemcode: paramItemcode, 
        codbarra, 
        tipo_operacao, 
        mensagem_erro, 
        erro, 
        metadata 
      } = params;
      
      // Usar item_code do parâmetro ou mapear de itemcode se disponível
      const item_code = paramItemCode || paramItemcode || '';
      
      await supabase
        .from('historico_produtos_cvh')
        .insert({
          importacao_id,
          usuario_id,
          item_code,
          codbarra: codbarra || '',
          tipo_operacao,
          status: 'erro',
          mensagem_erro,
          metadata: {
            arquivo: nome_arquivo,
            timestamp: new Date().toISOString(),
            erro_tecnico: erro.message || 'Erro desconhecido',
            codigo_erro: erro.code,
            ...metadata
          }
        });
    } catch (error: any) {
      console.error(`[Log]: Falha ao registrar erro de operação`, error);
      // Não propagar erro para não interromper o fluxo principal
    }
  },
  
  /**
   * Registra logs em lote (para melhor performance)
   */
  registrarLogsEmLote: async (logs: any[]): Promise<void> => {
    try {
      // Garantir que os campos estejam no formato correto antes de inserir
      const logsFormatados = logs.map(log => {
        // Remover o campo itemcode se existir e mapear para item_code (nome correto no banco)
        if (log.itemcode !== undefined) {
          // Mapear itemcode para item_code se item_code não estiver definido
          if (!log.item_code) {
            log.item_code = log.itemcode;
          }
          // Remover o campo itemcode para evitar erro no banco
          delete log.itemcode;
        }
        
        // Garantir que codbarra seja a chave principal para identificação
        if (!log.codbarra && log.item_code) {
          console.warn('[Log]: Registro sem codbarra definido. Usando item_code como fallback, mas isto não é recomendado.');
        }
        
        // Garantir que todos os campos obrigatórios existam
        // Usar codbarra como chave principal para identificação do produto
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
