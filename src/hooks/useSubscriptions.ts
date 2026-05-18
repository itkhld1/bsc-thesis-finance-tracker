import { API_BASE_URL } from '@/lib/api-config';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';

export interface Subscription {
  name: string;
  monthlyCost: number;
  yearlyCost: number;
  lastDate: string;
  count: number;
  categoryId: string;
  confidence: 'High' | 'Medium';
}

const fetchSubscriptions = async (token: string | null): Promise<Subscription[]> => {
  if (!token) return [];
  const response = await fetch(`${API_BASE_URL}/expenses/subscriptions`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to fetch subscriptions');
  return response.json();
};

export const useSubscriptions = () => {
  const { token } = useAuth();
  return useQuery<Subscription[], Error>({
    queryKey: ['subscriptions', token],
    queryFn: () => fetchSubscriptions(token),
    enabled: !!token,
  });
};
