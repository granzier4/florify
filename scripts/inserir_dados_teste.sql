-- Script para inserir dados de teste
-- Primeiro, vamos inserir alguns produtos CVH
INSERT INTO public.produtos_cvh (codbarra, item_code, descricao, categoria, cor, peso, embalagem)
VALUES 
  ('7891234567890', 'ITEM001', 'Rosa Vermelha Premium', 'Rosas', 'Vermelho', 0.5, 'Unitário'),
  ('7891234567891', 'ITEM002', 'Tulipa Amarela', 'Tulipas', 'Amarelo', 0.3, 'Buquê'),
  ('7891234567892', 'ITEM003', 'Orquídea Branca', 'Orquídeas', 'Branco', 0.8, 'Vaso'),
  ('7891234567893', 'ITEM004', 'Girassol Grande', 'Girassóis', 'Amarelo', 0.7, 'Unitário'),
  ('7891234567894', 'ITEM005', 'Lírio Oriental', 'Lírios', 'Rosa', 0.4, 'Buquê')
ON CONFLICT (codbarra) DO UPDATE 
SET 
  item_code = EXCLUDED.item_code,
  descricao = EXCLUDED.descricao,
  categoria = EXCLUDED.categoria,
  cor = EXCLUDED.cor,
  peso = EXCLUDED.peso,
  embalagem = EXCLUDED.embalagem;

-- Agora, vamos obter o ID da primeira loja disponível
DO $$
DECLARE
    loja_id UUID;
BEGIN
    -- Obter o ID da primeira loja
    SELECT id INTO loja_id FROM public.lojas LIMIT 1;
    
    IF loja_id IS NOT NULL THEN
        -- Inserir produtos na tabela produtos_loja_cvh
        INSERT INTO public.produtos_loja_cvh (loja_id, codbarra, ativo, destaque, ordem_exibicao)
        VALUES 
          (loja_id, '7891234567890', true, true, 1),
          (loja_id, '7891234567891', true, false, 2),
          (loja_id, '7891234567892', true, false, 3),
          (loja_id, '7891234567893', false, false, 4),
          (loja_id, '7891234567894', true, true, 5)
        ON CONFLICT (loja_id, codbarra) DO UPDATE 
        SET 
          ativo = EXCLUDED.ativo,
          destaque = EXCLUDED.destaque,
          ordem_exibicao = EXCLUDED.ordem_exibicao,
          atualizado_em = NOW();
        
        RAISE NOTICE 'Produtos inseridos com sucesso para a loja %', loja_id;
    ELSE
        RAISE EXCEPTION 'Nenhuma loja encontrada. Crie uma loja antes de executar este script.';
    END IF;
END
$$;
