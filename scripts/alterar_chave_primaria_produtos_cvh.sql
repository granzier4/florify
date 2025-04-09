-- Script para alterar a chave primária da tabela produtos_cvh de item_code para codbarra

-- 1. Verificar se codbarra tem valores nulos ou duplicados
DO $$
DECLARE
    nulos INT;
    duplicados INT;
BEGIN
    -- Verificar valores nulos
    SELECT COUNT(*) INTO nulos FROM produtos_cvh WHERE codbarra IS NULL;
    
    -- Verificar valores duplicados
    SELECT COUNT(*) INTO duplicados FROM (
        SELECT codbarra FROM produtos_cvh WHERE codbarra IS NOT NULL GROUP BY codbarra HAVING COUNT(*) > 1
    ) AS temp;
    
    IF nulos > 0 THEN
        RAISE EXCEPTION 'Existem % registros com codbarra NULL. Corrija antes de alterar a chave primária.', nulos;
    END IF;
    
    IF duplicados > 0 THEN
        RAISE EXCEPTION 'Existem % codbarras duplicados. Corrija antes de alterar a chave primária.', duplicados;
    END IF;
END $$;

-- 2. Remover a chave primária atual
ALTER TABLE public.produtos_cvh DROP CONSTRAINT produtos_cvh_pkey;

-- 3. Adicionar NOT NULL ao campo codbarra
ALTER TABLE public.produtos_cvh ALTER COLUMN codbarra SET NOT NULL;

-- 4. Criar a nova chave primária
ALTER TABLE public.produtos_cvh ADD CONSTRAINT produtos_cvh_pkey PRIMARY KEY (codbarra);

-- 5. Criar índice para item_code (que era a antiga chave primária)
CREATE INDEX IF NOT EXISTS produtos_cvh_item_code_idx ON public.produtos_cvh USING btree (item_code);

-- 6. Verificar resultado
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    a.attname AS column_name
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
WHERE c.contype = 'p' AND c.conrelid = 'public.produtos_cvh'::regclass;
