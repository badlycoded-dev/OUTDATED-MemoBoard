import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser, getPlans } from '../api/board';

const PLAN_COLORS = { Default: '#dfe1e6', Advanced: '#deebff', Full: '#e3fcef', Developer: '#f3e8ff' };
const PLAN_TEXT   = { Default: '#5e6c84', Advanced: '#0747a6', Full: '#006644', Developer: '#6554c0' };

export default function AdminPanel({ onClose }) {
  const [users, setUsers]       = useState([]);
  const [plans, setPlans]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [newName, setNewName]   = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPlan, setNewPlan]   = useState('Default');
  const [newRole, setNewRole]   = useState('user');
  const [adding, setAdding]     = useState(false);
  const [editId, setEditId]     = useState(null);

  useEffect(() => {
    Promise.all([getUsers(), getPlans()]).then(([u, p]) => {
      setUsers(u); setPlans(p); setLoading(false);
    });
  }, []);

  const reload = () => getUsers().then(setUsers);

  const handleAdd = async () => {
    if (!newName.trim() || !newEmail.trim()) return;
    setAdding(true);
    try {
      await createUser({ name: newName.trim(), email: newEmail.trim(), plan: newPlan, role: newRole });
      setNewName(''); setNewEmail(''); setNewPlan('Default'); setNewRole('user');
      await reload();
    } catch(e) { alert(e.message); }
    setAdding(false);
  };

  const handlePlanChange = async (userId, plan) => {
    await updateUser(userId, { plan });
    await reload();
  };

  const handleRoleChange = async (userId, role) => {
    await updateUser(userId, { role });
    await reload();
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    await deleteUser(userId);
    await reload();
  };

  return (
    <div className="admin-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="admin-panel">
        <div className="admin-header">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-shield-lock" style={{ fontSize: 18 }} />
            <strong>Admin Panel</strong>
            <span className="admin-badge">User Management</span>
          </div>
          <button className="mb-btn-ghost" onClick={onClose}>✕</button>
        </div>

        <div className="admin-body">
          {/* Plan overview */}
          <div className="admin-section-label">Plan overview</div>
          <div className="admin-plan-grid">
            {plans.map(p => {
              const count = users.filter(u => u.plan === p).length;
              return (
                <div key={p} className="admin-plan-card" style={{ background: PLAN_COLORS[p] || '#f4f5f7' }}>
                  <div className="admin-plan-name" style={{ color: PLAN_TEXT[p] || '#172b4d' }}>{p}</div>
                  <div className="admin-plan-count" style={{ color: PLAN_TEXT[p] || '#172b4d' }}>{count}</div>
                  <div className="admin-plan-users" style={{ color: PLAN_TEXT[p] || '#172b4d', opacity: 0.7 }}>users</div>
                </div>
              );
            })}
          </div>

          {/* Add user */}
          <div className="admin-section-label mt-3">Add user</div>
          <div className="admin-add-row">
            <input className="form-control form-control-sm" placeholder="Name"
              value={newName} onChange={e => setNewName(e.target.value)} />
            <input className="form-control form-control-sm" placeholder="Email"
              value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            <select className="form-select form-select-sm" value={newPlan} onChange={e => setNewPlan(e.target.value)}>
              {plans.map(p => <option key={p}>{p}</option>)}
            </select>
            <select className="form-select form-select-sm" value={newRole} onChange={e => setNewRole(e.target.value)}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button className="mb-btn-primary" onClick={handleAdd} disabled={adding}>
              {adding ? '…' : 'Add'}
            </button>
          </div>

          {/* Users table */}
          <div className="admin-section-label mt-3">Users ({users.length})</div>
          {loading ? (
            <div className="text-muted" style={{ fontSize: 13 }}>Loading…</div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th><th>Email</th><th>Plan</th><th>Role</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div className="admin-avatar">{u.name.slice(0,2).toUpperCase()}</div>
                          {editId === u._id ? (
                            <input className="form-control form-control-sm" defaultValue={u.name} style={{ width: 120 }}
                              onBlur={async e => { await updateUser(u._id, { name: e.target.value }); await reload(); setEditId(null); }}
                              autoFocus onKeyDown={e => e.key === 'Escape' && setEditId(null)} />
                          ) : (
                            <span style={{ cursor: 'pointer' }} onClick={() => setEditId(u._id)}>{u.name}</span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: '#5e6c84' }}>{u.email}</td>
                      <td>
                        <select className="form-select form-select-sm admin-plan-select"
                          value={u.plan} onChange={e => handlePlanChange(u._id, e.target.value)}
                          style={{ background: PLAN_COLORS[u.plan], color: PLAN_TEXT[u.plan] }}>
                          {plans.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </td>
                      <td>
                        <select className="form-select form-select-sm" value={u.role}
                          onChange={e => handleRoleChange(u._id, e.target.value)} style={{ width: 90 }}>
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <button className="mb-remove-btn" onClick={() => handleDelete(u._id)}>
                          <i className="bi bi-trash" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!users.length && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: '#8993a4', fontSize: 13, padding: '20px 0' }}>
                      No users yet. Add one above.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
