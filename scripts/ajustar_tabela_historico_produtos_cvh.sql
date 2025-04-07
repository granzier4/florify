-- Script para ajustar a tabela historico_produtos_cvh
-- Este script verifica se as colunas necessárias existem e as adiciona se necessário

-- Verificar e adicionar a coluna item_cod se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'historico_produtos_cvh' 
        AND column_name = 'item_cod'
    ) THEN
        ALTER TABLE public.historico_produtos_cvh ADD COLUMN item_cod TEXT;
        RAISE NOTICE 'Coluna item_cod adicionada à tabela historico_produtos_cvh';
    ELSE
        RAISE NOTICE 'Coluna item_cod já existe na tabela historico_produtos_cvh';
    END IF;
END $$;

-- Verificar e adicionar a coluna codbarra se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'historico_produtos_cvh' 
        AND column_name = 'codbarra'
    ) THEN
        ALTER TABLE public.historico_produtos_cvh ADD COLUMN codbarra TEXT;
        RAISE NOTICE 'Coluna codbarra adicionada à tabela historico_produtos_cvh';
    ELSE
        RAISE NOTICE 'Coluna codbarra já existe na tabela historico_produtos_cvh';
    END IF;
END $$;

-- Remover a coluna item_code se existir (para evitar confusão)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'historico_produtos_cvh' 
        AND column_name = 'item_code'
    ) THEN
        ALTER TABLE public.historico_produtos_cvh DROP COLUMN item_code;
        RAISE NOTICE 'Coluna item_code removida da tabela historico_produtos_cvh';
    ELSE
        RAISE NOTICE 'Coluna item_code não existe na tabela historico_produtos_cvh';
    END IF;
END $$;

-- Remover a coluna itemcode se existir (para evitar confusão)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'historico_produtos_cvh' 
        AND column_name = 'itemcode'
    ) THEN
        ALTER TABLE public.historico_produtos_cvh DROP COLUMN itemcode;
        RAISE NOTICE 'Coluna itemcode removida da tabela historico_produtos_cvh';
    ELSE
        RAISE NOTICE 'Coluna itemcode não existe na tabela historico_produtos_cvh';
    END IF;
END $$;

-- Adicionar índices para melhorar a performance de consultas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'historico_produtos_cvh' AND indexname = 'idx_historico_produtos_cvh_codbarra'
    ) THEN
        CREATE INDEX idx_historico_produtos_cvh_codbarra ON public.historico_produtos_cvh(codbarra);
        RAISE NOTICE 'Índice idx_historico_produtos_cvh_codbarra criado';
    ELSE
        RAISE NOTICE 'Índice idx_historico_produtos_cvh_codbarra já existe';
    END IF;
END $$;

-- Adicionar índice para item_cod
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'historico_produtos_cvh' AND indexname = 'idx_historico_produtos_cvh_item_cod'
    ) THEN
        CREATE INDEX idx_historico_produtos_cvh_item_cod ON public.historico_produtos_cvh(item_cod);
        RAISE NOTICE 'Índice idx_historico_produtos_cvh_item_cod criado';
    ELSE
        RAISE NOTICE 'Índice idx_historico_produtos_cvh_item_cod já existe';
    END IF;
END $$;

-- Adicionar índice para importacao_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'historico_produtos_cvh' AND indexname = 'idx_historico_produtos_cvh_importacao_id'
    ) THEN
        CREATE INDEX idx_historico_produtos_cvh_importacao_id ON public.historico_produtos_cvh(importacao_id);
        RAISE NOTICE 'Índice idx_historico_produtos_cvh_importacao_id criado';
    ELSE
        RAISE NOTICE 'Índice idx_historico_produtos_cvh_importacao_id já existe';
    END IF;
END $$;

-- Verificar se há registros sem codbarra e tentar atualizá-los
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT h.id, h.item_cod, p.codbarra
        FROM historico_produtos_cvh h
        JOIN produtos_cvh p ON h.item_cod = p.item_code
        WHERE h.codbarra IS NULL
    LOOP
        UPDATE historico_produtos_cvh
        SET codbarra = r.codbarra
        WHERE id = r.id;
        
        RAISE NOTICE 'Atualizado codbarra para o registro com id %', r.id;
    END LOOP;
END $$;
