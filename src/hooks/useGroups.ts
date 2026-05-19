import { API_BASE_URL } from '@/lib/api-config';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';

export interface GroupMember {
  id: string | number;
  name: string;
  email: string;
  avatar?: string;
}

export interface ExpenseSplit {
  userId: string | number;
  amount?: number;
  percentage?: number;
}

export interface GroupExpense {
  id: string;
  description: string;
  amount: number;
  paidBy: string | number;
  splitBetween: (string | number)[];
  date: string;
  category: string;
  recipientId?: string | number;
  splits?: ExpenseSplit[];
}

export interface Group {
  id: string;
  name: string;
  description: string;
  createdBy: number;
  createdAt: string;
  members: GroupMember[];
  expenses: GroupExpense[];
}

export interface Activity {
  id: string;
  groupId: string;
  userId: number;
  userName: string;
  type: string;
  description: string;
  createdAt: string;
}

const fetchGroups = async (token: string | null): Promise<Group[]> => {
  if (!token) return [];
  const response = await fetch(`${API_BASE_URL}/groups`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch groups');
  return response.json();
};

export const useGroups = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const groupsQuery = useQuery<Group[], Error>({
    queryKey: ['groups', token],
    queryFn: () => fetchGroups(token),
    enabled: !!token,
  });

  const useGroupActivity = (groupId: string) => {
    return useQuery<Activity[], Error>({
      queryKey: ['group-activity', groupId, token],
      queryFn: async () => {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/activity`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch activity');
        return response.json();
      },
      enabled: !!token && !!groupId,
    });
  };

  const createGroupMutation = useMutation({
    mutationFn: async (newGroup: { name: string; description: string; memberEmails: string[] }) => {
      const response = await fetch(`${API_BASE_URL}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newGroup)
      });
      if (!response.ok) throw new Error('Failed to create group');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    }
  });

  const settleUpMutation = useMutation({
    mutationFn: async (settlement: { groupId: string; amount: number; recipientId: string | number; date: string }) => {
      const response = await fetch(`${API_BASE_URL}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...settlement,
          description: 'Settlement',
          categoryId: 'settlement',
        })
      });
      if (!response.ok) throw new Error('Failed to record settlement');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    }
  });

  return {
    groups: groupsQuery.data ?? [],
    isLoading: groupsQuery.isLoading,
    isError: groupsQuery.isError,
    createGroup: createGroupMutation.mutateAsync,
    isCreating: createGroupMutation.isPending,
    settleUp: settleUpMutation.mutateAsync,
    isSettling: settleUpMutation.isPending,
    useGroupActivity
  };
};
