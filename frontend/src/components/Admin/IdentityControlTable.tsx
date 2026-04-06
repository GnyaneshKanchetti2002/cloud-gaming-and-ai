import React, { useState, useEffect, memo } from 'react';
import { API_BASE_URL } from '@/app/lib/api';
import { useAdminStore } from '@/store/adminStore';

const IdentityControlTable = memo(() => {
  const [users, setUsers] = useState<any[]>([]);
  const [userPage, setUserPage] = useState(0);
  const requestMfa = useAdminStore(state => state.requestMfa);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/users/?skip=${userPage * 20}&limit=20`, { 
        headers: { "Authorization": `Bearer ${token}` },
        credentials: "include" 
      });
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      console.error("Failed to fetch identities", e);
    }
  };

  useEffect(() => {
    fetchUsers();
    // HTTP Polling for users can be kept or migrated depending on scale. 
    // Here we use setInterval inside its own child component to avoid triggering monolith re-renders!
    const userInterval = setInterval(fetchUsers, 10000);
    return () => clearInterval(userInterval);
  }, [userPage]);

  // MFA Destructive Actions
  const handleToggleAdmin = (id: number, currentStatus: boolean) => {
    requestMfa("TOGGLE_ADMIN", { is_admin: !currentStatus }, `/users/${id}/admin`, "PUT");
  };

  const handleBanUser = (id: number) => {
    requestMfa("BAN_USER", null, `/users/${id}/ban`, "POST");
  };

  const handleDeleteUser = (id: number) => {
    requestMfa("PURGE_USER", null, `/users/${id}`, "DELETE");
  };

  const handleToggleRole = async (id: number, currentRole: string) => {
    const isB2B = currentRole === 'B2B' || currentRole === 'b2b_enterprise';
    const newRole = isB2B ? 'B2C' : 'B2B';
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE_URL}/users/${id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ role: newRole }),
        credentials: "include"
    });
    fetchUsers();
  };

  const handleAddWallet = (id: number) => {
    const amountStr = prompt("Enter number of hours to add/deduct:");
    if (!amountStr || isNaN(Number(amountStr))) return;
    const reason = prompt("Enter audit reason for this accounting change:");
    if (!reason) return;

    requestMfa("LEDGER_MODIFICATION", { hours_added: parseFloat(amountStr), reason }, `/users/${id}/wallet`, "PUT");
  };

  return (
    <div className="border border-green-900/50 bg-[#020502] shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden mt-8">
      <div className="flex justify-between items-center p-4 border-b border-green-900/30 bg-gradient-to-r from-green-900/20 to-transparent">
        <h3 className="text-sm text-green-400 uppercase tracking-widest">Identities & Access Control</h3>
        <div className="flex gap-2">
           <button disabled={userPage === 0} onClick={() => setUserPage(userPage - 1)} className="px-3 py-1 bg-green-900/40 border border-green-900 hover:bg-green-800 disabled:opacity-30 text-xs font-bold uppercase text-green-400">Past</button>
           <button onClick={() => setUserPage(userPage + 1)} className="px-3 py-1 bg-green-900/40 border border-green-900 hover:bg-green-800 text-xs font-bold uppercase text-green-400">Next</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="text-green-700 bg-[#0a150a] border-b border-green-900/30">
            <tr>
              <th className="p-4 font-bold tracking-wider">ID</th>
              <th className="p-4 font-bold tracking-wider">EMAIL</th>
              <th className="p-4 font-bold tracking-wider">ROLE</th>
              <th className="p-4 font-bold tracking-wider">WALLET</th>
              <th className="p-4 font-bold tracking-wider">STATUS</th>
              <th className="p-4 font-bold tracking-wider text-right">ADMIN MODIFIERS</th>
            </tr>
          </thead>
          <tbody className="text-green-500 font-mono">
            {users.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-green-900 uppercase">No registered identities found.</td></tr>
            ) : users.map((u, i) => (
              <tr key={u.id} className="border-b border-green-900/10 hover:bg-green-900/20 transition-colors group">
                <td className="p-4 opacity-50">#{u.id} {u.is_admin ? <span className="text-yellow-500 font-bold ml-1">(OMEGA)</span> : ''}</td>
                <td className="p-4 font-bold text-green-400">{u.email}</td>
                <td className="p-4 font-bold uppercase text-blue-500">{u.role.replace('_', ' ')}</td>
                <td className="p-4">{u.balance_hours.toFixed(2)} HRS</td>
                <td className="p-4">
                   {u.is_banned ? <span className="text-red-500 font-black animate-pulse">[BANNED]</span> : u.is_active ? <span className="text-green-600">[ACTIVE]</span> : <span className="text-zinc-500">[PURGED]</span>}
                </td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <button 
                    onClick={() => handleToggleAdmin(u.id, u.is_admin)} 
                    className={`px-3 py-1 border transition-all text-[10px] uppercase font-bold shadow-sm ${u.is_admin ? 'border-yellow-600/50 text-yellow-500 hover:bg-yellow-900/30' : 'border-green-900 text-green-600 hover:text-white hover:bg-green-900'}`}
                  >
                    {u.is_admin ? 'Revoke Omega' : 'Grant Omega'}
                  </button>
                  <button onClick={() => handleToggleRole(u.id, u.role)} className="px-3 py-1 border border-green-900 text-green-600 hover:text-white hover:bg-green-900 transition-colors text-[10px] uppercase font-bold">Swap Role</button>
                  <button onClick={() => handleAddWallet(u.id)} className="px-3 py-1 border border-green-900 text-green-600 hover:text-white hover:bg-green-900 transition-colors text-[10px] uppercase font-bold">Ledger +/-</button>
                  {!u.is_banned && (
                     <button onClick={() => handleBanUser(u.id)} className="px-3 py-1 border border-red-900 text-red-600 hover:text-white hover:bg-red-900 transition-all text-[10px] uppercase font-bold shadow-[0_0_10px_rgba(239,68,68,0.1)]">Ban</button>
                  )}
                  {u.is_active && (
                     <button onClick={() => handleDeleteUser(u.id)} className="px-3 py-1 border border-red-900/50 text-red-900 hover:bg-black transition-colors text-[10px] uppercase font-bold opacity-50 hover:opacity-100">Purge</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default IdentityControlTable;
