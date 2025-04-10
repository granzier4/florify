-- Script para criar a tabela produtos_loja_cvh
-- Esta tabela gerencia quais produtos da base CVH estão ativos para cada loja

-- Criar a tabela principal
CREATE TABLE IF NOT EXISTS public.produtos_loja_cvh (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loja_id UUID NOT NULL REFERENCES lojas(id),
    codbarra TEXT NOT NULL REFERENCES produtos_cvh(codbarra),
    ativo BOOLEAN NOT NULL DEFAULT false,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT now(),
    ativado_por UUID REFERENCES usuarios(id),
    atualizado_por UUID REFERENCES usuarios(id),
    motivo_alteracao TEXT,
    destaque BOOLEAN DEFAULT false,
    ordem_exibicao INTEGER,
    metadata JSONB DEFAULT '{}',
    CONSTRAINT produtos_loja_cvh_loja_produto_unique UNIQUE(loja_id, codbarra)
);

-- Comentários para documentação
COMMENT ON TABLE public.produtos_loja_cvh IS 'Tabela que controla quais produtos da base CVH estão ativos para cada loja';
COMMENT ON COLUMN public.produtos_loja_cvh.id IS 'Identificador único do registro';
COMMENT ON COLUMN public.produtos_loja_cvh.loja_id IS 'Referência à loja (foreign key para lojas.id)';
COMMENT ON COLUMN public.produtos_loja_cvh.codbarra IS 'Código de barras do produto (foreign key para produtos_cvh.codbarra)';
COMMENT ON COLUMN public.produtos_loja_cvh.ativo IS 'Indica se o produto está ativo para a loja (true) ou não (false)';
COMMENT ON COLUMN public.produtos_loja_cvh.criado_em IS 'Data e hora de criação do registro';
COMMENT ON COLUMN public.produtos_loja_cvh.atualizado_em IS 'Data e hora da última atualização do registro';
COMMENT ON COLUMN public.produtos_loja_cvh.ativado_por IS 'Usuário que ativou o produto (foreign key para usuarios.id)';
COMMENT ON COLUMN public.produtos_loja_cvh.atualizado_por IS 'Usuário que fez a última atualização (foreign key para usuarios.id)';
COMMENT ON COLUMN public.produtos_loja_cvh.motivo_alteracao IS 'Motivo da ativação/desativação do produto';
COMMENT ON COLUMN public.produtos_loja_cvh.destaque IS 'Indica se o produto deve ser destacado no catálogo';
COMMENT ON COLUMN public.produtos_loja_cvh.ordem_exibicao IS 'Ordem de exibição do produto no catálogo';
COMMENT ON COLUMN public.produtos_loja_cvh.metadata IS 'Dados adicionais específicos da loja para o produto';

-- Índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_produtos_loja_cvh_loja_id ON public.produtos_loja_cvh(loja_id);
CREATE INDEX IF NOT EXISTS idx_produtos_loja_cvh_codbarra ON public.produtos_loja_cvh(codbarra);
CREATE INDEX IF NOT EXISTS idx_produtos_loja_cvh_ativo ON public.produtos_loja_cvh(ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_loja_cvh_destaque ON public.produtos_loja_cvh(destaque);

-- Trigger para atualizar o campo atualizado_em automaticamente
CREATE OR REPLACE FUNCTION update_produtos_loja_cvh_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_produtos_loja_cvh_updated_at
BEFORE UPDATE ON public.produtos_loja_cvh
FOR EACH ROW
EXECUTE FUNCTION update_produtos_loja_cvh_updated_at();

-- Row Level Security (RLS) para controle de acesso
ALTER TABLE public.produtos_loja_cvh ENABLE ROW LEVEL SECURITY;

-- Política para usuários master_plataforma (acesso total)
CREATE POLICY produtos_loja_cvh_master_policy ON public.produtos_loja_cvh
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE usuarios.id = auth.uid()
            AND usuarios.tipo = 'master_plataforma'
        )
    );

-- Política para usuários usuario_loja (acesso apenas à sua loja)
CREATE POLICY produtos_loja_cvh_loja_policy ON public.produtos_loja_cvh
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM usuarios
            WHERE usuarios.id = auth.uid()
            AND usuarios.tipo = 'usuario_loja'
            AND usuarios.loja_id = produtos_loja_cvh.loja_id
        )
    );
