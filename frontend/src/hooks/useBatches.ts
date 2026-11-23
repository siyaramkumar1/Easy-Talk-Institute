import { useQuery } from '@tanstack/react-query';
import { batchService } from '../services/batchService';

export const useBatches = (status?: string) => {
  const query = useQuery({
    queryKey: ['batches', status],
    queryFn: () => batchService.getAll(status)
  });

  return {
    batches: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : '',
    refetch: query.refetch
  };
};

export const usePublicBatches = (status?: string) => {
  const normalizedStatus = status ? status.toLowerCase() : 'all';
  const query = useQuery({
    queryKey: ['publicBatches', normalizedStatus],
    queryFn: () => batchService.getPublic(status)
  });

  return {
    batches: query.data || [],
    loading: query.isLoading,
    error: query.error ? (query.error as any).message : '',
    refetch: query.refetch
  };
};
