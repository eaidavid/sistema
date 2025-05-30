import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useRealtimeUpdates() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Invalidar queries relacionadas a casas de apostas a cada 2 segundos
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/betting-houses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/betting-houses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/my-links'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats/user'] });
    }, 2000);

    return () => clearInterval(interval);
  }, [queryClient]);

  // Função para forçar atualização imediata
  const forceUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/betting-houses'] });
    queryClient.invalidateQueries({ queryKey: ['/api/admin/betting-houses'] });
    queryClient.invalidateQueries({ queryKey: ['/api/my-links'] });
    queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
    queryClient.invalidateQueries({ queryKey: ['/api/stats/user'] });
  };

  return { forceUpdate };
}