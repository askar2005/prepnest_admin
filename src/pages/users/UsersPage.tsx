import { useEffect, useState } from 'react';
import { fetchCollection } from '../../api/content';
import { apiClient } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/common/ToastHost';

export function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const { pushToast } = useToast();
  useEffect(() => {
    fetchCollection('/users', { limit: 50 }).then((res) => setUsers(res.items));
  }, []);

  const toggleDisabled = async (user: any) => {
    await apiClient.put(`/users/${user.id}`, { disabledAt: user.disabledAt ? null : new Date().toISOString() });
    pushToast(user.disabledAt ? 'User enabled' : 'User disabled', 'success');
    const res = await fetchCollection('/users', { limit: 50 });
    setUsers(res.items);
  };
  return (
    <div className="space-y-4">
      <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Users</h1>
      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[16px] border border-slate-200 p-4">
            <div className="min-w-0">
              <div className="font-medium truncate">{user.name}</div>
              <div className="text-sm text-slate-500 truncate">{user.email}</div>
            </div>
            <Button variant="secondary" onClick={() => toggleDisabled(user)} className="w-full sm:w-auto">
              {user.disabledAt ? 'Enable' : 'Disable'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
