-- Script para atualizar a tabela produtos_cvh com os novos campos do CSV
-- Florify - Atualização para importação de produtos CVH

-- Adicionar novos campos à tabela produtos_cvh
ALTER TABLE produtos_cvh
ADD COLUMN IF NOT EXISTS codbarra TEXT,
ADD COLUMN IF NOT EXISTS descricao_curta TEXT,
ADD COLUMN IF NOT EXISTS cod_categoria TEXT,
ADD COLUMN IF NOT EXISTS descricao_categoria TEXT,
ADD COLUMN IF NOT EXISTS cod_grupo TEXT,
ADD COLUMN IF NOT EXISTS descricao_grupo TEXT,
ADD COLUMN IF NOT EXISTS data_cadastro DATE,
ADD COLUMN IF NOT EXISTS ncm TEXT,
ADD COLUMN IF NOT EXISTS class_cond TEXT,
ADD COLUMN IF NOT EXISTS grupo_com TEXT,
ADD COLUMN IF NOT EXISTS grupo_log TEXT,
ADD COLUMN IF NOT EXISTS cst_sp TEXT,
ADD COLUMN IF NOT EXISTS peso NUMERIC(10, 3),
ADD COLUMN IF NOT EXISTS cpc TEXT,
ADD COLUMN IF NOT EXISTS epc TEXT,
ADD COLUMN IF NOT EXISTS upc TEXT,
ADD COLUMN IF NOT EXISTS foto TEXT;

-- Renomear campo itemcode para item_code para manter consistência com o CSV
ALTER TABLE produtos_cvh
RENAME COLUMN itemcode TO item_code;

-- Atualizar a constraint de chave primária
ALTER TABLE produtos_cvh
DROP CONSTRAINT produtos_cvh_pkey,
ADD CONSTRAINT produtos_cvh_pkey PRIMARY KEY (item_code);

-- Atualizar a tabela historico_produtos_cvh para usar item_code em vez de itemcode
ALTER TABLE historico_produtos_cvh 
RENAME COLUMN IF EXISTS itemcode TO item_code;

-- Adicionar a coluna item_code se não existir
ALTER TABLE historico_produtos_cvh
ADD COLUMN IF NOT EXISTS item_code TEXT;

-- Adicionar a coluna codbarra se não existir
ALTER TABLE historico_produtos_cvh
ADD COLUMN IF NOT EXISTS codbarra TEXT;

-- Atualizar a constraint de chave estrangeira na tabela historico_produtos_cvh
ALTER TABLE historico_produtos_cvh
DROP CONSTRAINT historico_produtos_cvh_itemcode_fkey,
ADD CONSTRAINT historico_produtos_cvh_item_code_fkey 
FOREIGN KEY (item_code) REFERENCES produtos_cvh(item_code);

-- Atualizar os índices
DROP INDEX IF EXISTS produtos_cvh_categoria_idx;
CREATE INDEX IF NOT EXISTS produtos_cvh_cod_categoria_idx ON produtos_cvh(cod_categoria);
CREATE INDEX IF NOT EXISTS produtos_cvh_descricao_categoria_idx ON produtos_cvh(descricao_categoria);
CREATE INDEX IF NOT EXISTS produtos_cvh_cod_grupo_idx ON produtos_cvh(cod_grupo);

-- Adicionar comentários para os novos campos
COMMENT ON COLUMN produtos_cvh.item_code IS 'Código único do produto (chave primária)';
COMMENT ON COLUMN produtos_cvh.codbarra IS 'Código de barras do produto';
COMMENT ON COLUMN produtos_cvh.descricao_curta IS 'Descrição curta do produto';
COMMENT ON COLUMN produtos_cvh.cod_categoria IS 'Código da categoria do produto';
COMMENT ON COLUMN produtos_cvh.descricao_categoria IS 'Descrição da categoria do produto';
COMMENT ON COLUMN produtos_cvh.cod_grupo IS 'Código do grupo do produto';
COMMENT ON COLUMN produtos_cvh.descricao_grupo IS 'Descrição do grupo do produto';
COMMENT ON COLUMN produtos_cvh.data_cadastro IS 'Data de cadastro do produto na CVH';
COMMENT ON COLUMN produtos_cvh.ncm IS 'Código NCM do produto';
COMMENT ON COLUMN produtos_cvh.class_cond IS 'Classificação de condição do produto';
COMMENT ON COLUMN produtos_cvh.grupo_com IS 'Grupo comercial do produto';
COMMENT ON COLUMN produtos_cvh.grupo_log IS 'Grupo logístico do produto';
COMMENT ON COLUMN produtos_cvh.cst_sp IS 'Código de situação tributária em São Paulo';
COMMENT ON COLUMN produtos_cvh.peso IS 'Peso do produto';
COMMENT ON COLUMN produtos_cvh.cpc IS 'Código de Produto Comercial';
COMMENT ON COLUMN produtos_cvh.epc IS 'Código EPC (Electronic Product Code)';
COMMENT ON COLUMN produtos_cvh.upc IS 'Código UPC (Universal Product Code)';
COMMENT ON COLUMN produtos_cvh.foto IS 'URL ou caminho para a foto do produto';
