import { useState, useEffect } from 'react';
import { lojaService } from '../services/lojaService';
import { Loja } from '../types/auth';

export function useLojas() {
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const carregarLojas = async () => {
      try {
        setCarregando(true);
        setErro(null);
        const lojasData = await lojaService.listarLojas();
        setLojas(lojasData);
      } catch (error: any) {
        console.error('Erro ao carregar lojas:', error);
        setErro(error.message || 'Erro ao carregar lojas');
      } finally {
        setCarregando(false);
      }
    };

    carregarLojas();
  }, []);

  return { lojas, carregando, erro };
}
