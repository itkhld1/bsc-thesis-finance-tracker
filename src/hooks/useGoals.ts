import { API_BASE_URL } from '@/lib/api-config';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';

export interface Goal {
  id: string;
  userId: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  category: string;
  createdAt: string;
}

const fetchGoals = async (token: string | null): Promise<Goal[]> => {
  if (!token) return [];
  const response = await fetch(`${API_BASE_URL}/goals`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch goals');
  return response.json();
};

export const useGoals = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const goalsQuery = useQuery<Goal[], Error>({
    queryKey: ['goals', token],
    queryFn: () => fetchGoals(token),
    enabled: !!token,
  });

  const createGoalMutation = useMutation({
    mutationFn: async (newGoal: { name: string; targetAmount: number; deadline?: string; category?: string }) => {
      const response = await fetch(`${API_BASE_URL}/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newGoal)
      });
      if (!response.ok) throw new Error('Failed to create goal');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const updateGoalMutation = useMutation({
    mutationFn: async (goal: Partial<Goal> & { id: string }) => {
      const response = await fetch(`${API_BASE_URL}/goals/${goal.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(goal)
      });
      if (!response.ok) throw new Error('Failed to update goal');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const contributeMutation = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const response = await fetch(`${API_BASE_URL}/goals/${id}/contribution`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });
      if (!response.ok) throw new Error('Failed to contribute to goal');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete goal');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    }
  });

  return {
    goals: goalsQuery.data ?? [],
    isLoading: goalsQuery.isLoading,
    isError: goalsQuery.isError,
    createGoal: createGoalMutation.mutateAsync,
    updateGoal: updateGoalMutation.mutateAsync,
    contribute: contributeMutation.mutateAsync,
    deleteGoal: deleteGoalMutation.mutateAsync,
    isCreating: createGoalMutation.isPending,
    isUpdating: updateGoalMutation.isPending,
    isContributing: contributeMutation.isPending
  };
};
