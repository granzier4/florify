-- Script para criar as tabelas necessárias para importação de produtos CVH
-- Florify - Importação de Arquivos CSV

-- Tabela principal de produtos CVH
CREATE TABLE IF NOT EXISTS produtos_cvh (
    itemcode TEXT PRIMARY KEY,
    descricao TEXT NOT NULL,
    categoria TEXT,
    cor TEXT,
    detalhes TEXT,
    preco_unitario NUMERIC(10, 2) NOT NULL,
    unidade_medida TEXT NOT NULL,
    embalagem TEXT,
    cvh_data_atual DATE,
    lastupdatedate TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    importacao_id UUID -- Referência à importação que criou/atualizou este produto
);

-- Índices para melhorar a performance de consultas
CREATE INDEX IF NOT EXISTS produtos_cvh_categoria_idx ON produtos_cvh(categoria);
CREATE INDEX IF NOT EXISTS produtos_cvh_cor_idx ON produtos_cvh(cor);

-- Tabela de registro de importações
CREATE TABLE IF NOT EXISTS importacoes_cvh (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_arquivo TEXT NOT NULL,
    total_linhas INTEGER NOT NULL DEFAULT 0,
    novos INTEGER NOT NULL DEFAULT 0,
    alterados INTEGER NOT NULL DEFAULT 0,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    data_importacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('concluido', 'pendente', 'erro')),
    diff_preview JSONB, -- Armazena as diferenças detectadas para visualização
    arquivo_path TEXT -- Caminho para o arquivo no Storage
);

-- Índices para a tabela de importações
CREATE INDEX IF NOT EXISTS importacoes_cvh_usuario_id_idx ON importacoes_cvh(usuario_id);
CREATE INDEX IF NOT EXISTS importacoes_cvh_status_idx ON importacoes_cvh(status);
CREATE INDEX IF NOT EXISTS importacoes_cvh_data_idx ON importacoes_cvh(data_importacao);

-- Adicionar constraint de chave estrangeira na tabela produtos_cvh
ALTER TABLE produtos_cvh 
ADD CONSTRAINT produtos_cvh_importacao_fk 
FOREIGN KEY (importacao_id) REFERENCES importacoes_cvh(id);

-- Tabela para armazenar o histórico de alterações de produtos
CREATE TABLE IF NOT EXISTS historico_produtos_cvh (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itemcode TEXT NOT NULL REFERENCES produtos_cvh(itemcode),
    importacao_id UUID NOT NULL REFERENCES importacoes_cvh(id),
    dados_anteriores JSONB, -- Estado anterior do produto
    dados_novos JSONB, -- Novos dados do produto
    data_alteracao TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para a tabela de histórico
CREATE INDEX IF NOT EXISTS historico_produtos_cvh_itemcode_idx ON historico_produtos_cvh(itemcode);
CREATE INDEX IF NOT EXISTS historico_produtos_cvh_importacao_idx ON historico_produtos_cvh(importacao_id);

-- Função para registrar automaticamente alterações no histórico
CREATE OR REPLACE FUNCTION registrar_alteracao_produto_cvh()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO historico_produtos_cvh (
            itemcode, 
            importacao_id, 
            dados_anteriores, 
            dados_novos
        ) VALUES (
            NEW.itemcode,
            NEW.importacao_id,
            row_to_json(OLD),
            row_to_json(NEW)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para executar a função quando um produto for atualizado
CREATE TRIGGER trigger_registrar_alteracao_produto_cvh
AFTER UPDATE ON produtos_cvh
FOR EACH ROW
EXECUTE FUNCTION registrar_alteracao_produto_cvh();

-- Configurar políticas RLS (Row Level Security)

-- Habilitar RLS nas tabelas
ALTER TABLE produtos_cvh ENABLE ROW LEVEL SECURITY;
ALTER TABLE importacoes_cvh ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_produtos_cvh ENABLE ROW LEVEL SECURITY;

-- Política para produtos_cvh: apenas master_plataforma pode modificar
CREATE POLICY produtos_cvh_policy ON produtos_cvh
    USING (true)  -- Todos podem visualizar
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE usuarios.id = auth.uid()
            AND usuarios.tipo = 'master_plataforma'
        )
    );

-- Política para importacoes_cvh: apenas master_plataforma pode criar/modificar
CREATE POLICY importacoes_cvh_policy ON importacoes_cvh
    USING (true)  -- Todos podem visualizar
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE usuarios.id = auth.uid()
            AND usuarios.tipo = 'master_plataforma'
        )
    );

-- Política para historico_produtos_cvh: apenas leitura para todos
CREATE POLICY historico_produtos_cvh_policy ON historico_produtos_cvh
    USING (true)
    WITH CHECK (false);  -- Ninguém pode modificar diretamente

-- Comentários para documentação
COMMENT ON TABLE produtos_cvh IS 'Produtos da Cooperativa Veiling Holambra importados via CSV';
COMMENT ON TABLE importacoes_cvh IS 'Registro de todas as importações de produtos CVH realizadas';
COMMENT ON TABLE historico_produtos_cvh IS 'Histórico de alterações nos produtos CVH para auditoria';

COMMENT ON COLUMN produtos_cvh.itemcode IS 'Código único do produto (chave primária)';
COMMENT ON COLUMN produtos_cvh.descricao IS 'Descrição do produto';
COMMENT ON COLUMN produtos_cvh.categoria IS 'Categoria do produto (ex: flor, planta, etc.)';
COMMENT ON COLUMN produtos_cvh.cor IS 'Cor predominante do produto';
COMMENT ON COLUMN produtos_cvh.detalhes IS 'Observações e detalhes adicionais';
COMMENT ON COLUMN produtos_cvh.preco_unitario IS 'Preço de referência do produto';
COMMENT ON COLUMN produtos_cvh.unidade_medida IS 'Tipo de unidade (vaso, caixa, etc.)';
COMMENT ON COLUMN produtos_cvh.embalagem IS 'Tipo de embalagem do produto';
COMMENT ON COLUMN produtos_cvh.cvh_data_atual IS 'Data da última atualização desse item na CVH';
COMMENT ON COLUMN produtos_cvh.lastupdatedate IS 'Data da última atualização deste registro na base';
COMMENT ON COLUMN produtos_cvh.importacao_id IS 'Referência à importação que criou/atualizou este produto';

COMMENT ON COLUMN importacoes_cvh.id IS 'Identificador único da importação';
COMMENT ON COLUMN importacoes_cvh.nome_arquivo IS 'Nome do arquivo CSV enviado';
COMMENT ON COLUMN importacoes_cvh.total_linhas IS 'Quantidade total de registros no arquivo';
COMMENT ON COLUMN importacoes_cvh.novos IS 'Quantidade de itens novos adicionados';
COMMENT ON COLUMN importacoes_cvh.alterados IS 'Quantidade de itens alterados';
COMMENT ON COLUMN importacoes_cvh.usuario_id IS 'Usuário que executou a importação';
COMMENT ON COLUMN importacoes_cvh.data_importacao IS 'Data e hora da importação';
COMMENT ON COLUMN importacoes_cvh.status IS 'Status da importação: concluido, pendente ou erro';
COMMENT ON COLUMN importacoes_cvh.diff_preview IS 'Pré-visualização das diferenças detectadas em formato JSON';
COMMENT ON COLUMN importacoes_cvh.arquivo_path IS 'Caminho para o arquivo no Storage do Supabase';

-- Criar um bucket no Storage para armazenar os arquivos CSV
-- Nota: Esta parte deve ser executada manualmente no Console do Supabase ou via API
-- INSERT INTO storage.buckets (id, name) VALUES ('cvh_imports', 'cvh_imports');
