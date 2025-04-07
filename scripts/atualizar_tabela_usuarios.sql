-- Script para atualizar a tabela 'usuarios' no Supabase

-- Adicionar coluna 'telefone' se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios' AND column_name = 'telefone') THEN
        ALTER TABLE usuarios ADD COLUMN telefone TEXT;
    END IF;
END $$;

-- Adicionar coluna 'status' se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'usuarios' AND column_name = 'status') THEN
        ALTER TABLE usuarios ADD COLUMN status TEXT NOT NULL DEFAULT 'pendente';
    END IF;
END $$;

-- Adicionar constraint para verificar valores válidos de status
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'usuarios_status_check') THEN
        ALTER TABLE usuarios ADD CONSTRAINT usuarios_status_check 
        CHECK (status IN ('ativo', 'inativo', 'pendente'));
    END IF;
END $$;

-- Atualizar a constraint existente para garantir a associação correta de loja_id com tipo
DO $$
BEGIN
    -- Primeiro, remover a constraint existente se houver
    BEGIN
        ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_tipo_loja_check;
    EXCEPTION
        WHEN undefined_object THEN
            NULL;
    END;
    
    -- Adicionar a nova constraint
    ALTER TABLE usuarios ADD CONSTRAINT usuarios_tipo_loja_check 
    CHECK (
        (tipo = 'master_plataforma' AND loja_id IS NULL) OR
        ((tipo = 'usuario_loja' OR tipo = 'cliente') AND loja_id IS NOT NULL)
    );
END $$;

-- Adicionar índices para melhorar performance
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'usuarios_email_idx') THEN
        CREATE INDEX usuarios_email_idx ON usuarios(email);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'usuarios_loja_id_idx') THEN
        CREATE INDEX usuarios_loja_id_idx ON usuarios(loja_id);
    END IF;
END $$;

-- Comentários nas colunas para documentação
COMMENT ON COLUMN usuarios.id IS 'ID único do usuário (UUID)';
COMMENT ON COLUMN usuarios.nome IS 'Nome completo do usuário';
COMMENT ON COLUMN usuarios.email IS 'Email do usuário (único)';
COMMENT ON COLUMN usuarios.telefone IS 'Número de telefone do usuário (opcional)';
COMMENT ON COLUMN usuarios.tipo IS 'Tipo de usuário: master_plataforma, usuario_loja ou cliente';
COMMENT ON COLUMN usuarios.status IS 'Status do usuário: ativo, inativo ou pendente';
COMMENT ON COLUMN usuarios.loja_id IS 'ID da loja associada (obrigatório para usuario_loja e cliente)';
COMMENT ON COLUMN usuarios.criado_em IS 'Data e hora de criação do registro';
