import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Check, X, Clock, Ban, RefreshCw, Plus, Pencil, UserX, Gift } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const STATUS_CONFIG = {
  active:    { label: "Ativa",     color: "bg-green-500/20 text-green-400",   icon: Check },
  pending:   { label: "Pendente",  color: "bg-yellow-500/20 text-yellow-400", icon: Clock },
  expired:   { label: "Expirada",  color: "bg-gray-500/20 text-gray-400",     icon: X },
  cancelled: { label: "Cancelada", color: "bg-red-500/20 text-red-400",       icon: Ban },
  none:      { label: "Sem assinatura", color: "bg-white/5 text-gray-500",    icon: UserX },
};

const PLAN_OPTIONS = [
  { id: "semanal", label: "Semanal", days: 7 },
  { id: "mensal",  label: "Mensal",  days: 30 },
  { id: "anual",   label: "Anual",   days: 365 },
];

const PLAN_LABELS = { trial: "Trial (29 dias grátis)", semanal: "Semanal", mensal: "Mensal", premium: "Premium", anual: "Anual" };

function getDaysRemaining(expires_at) {
  if (!expires_at) return null;
  const diff = new Date(expires_at) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function AddSubscriptionModal({ email: prefillEmail, onClose, onSuccess }) {
  const [email, setEmail] = useState(prefillEmail || '');
  const [plan, setPlan] = useState('mensal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!email) { setError('Informe o email do usuário.'); return; }
    setError(null);
    setLoading(true);
    const selectedPlan = PLAN_OPTIONS.find(p => p.id === plan);
    const now = new Date();
    const expires = new Date(now.getTime() + selectedPlan.days * 24 * 60 * 60 * 1000);
    await base44.entities.Subscription.create({
      user_email: email.trim().toLowerCase(),
      plan,
      status: 'active',
      payment_method: 'pix',
      starts_at: now.toISOString(),
      expires_at: expires.toISOString(),
    });
    setLoading(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1A1A1A] rounded-2xl border border-white/10 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-white font-bold text-lg">Adicionar Assinatura Manual</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-gray-400 text-sm mb-1.5 block">Email do usuário</label>
            <Input
              placeholder="usuario@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-[#2A2A2A] border-white/10 text-white placeholder:text-gray-500"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm mb-1.5 block">Plano</label>
            <div className="grid grid-cols-3 gap-2">
              {PLAN_OPTIONS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setPlan(p.id)}
                  className={`py-2.5 rounded-lg border text-sm font-semibold transition-all ${plan === p.id ? 'bg-[#E50914] border-[#E50914] text-white' : 'border-white/10 text-gray-300 hover:border-white/30'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Expira em: <span className="text-gray-300">{PLAN_OPTIONS.find(p => p.id === plan)?.days} dias a partir de hoje</span>
            </p>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 border-white/10 text-gray-300">Cancelar</Button>
            <Button onClick={handleSubmit} disabled={loading} className="flex-1 bg-[#E50914] hover:bg-[#FF3D3D]">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Ativar Acesso"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditExpiryModal({ subscription, onClose, onSuccess }) {
  const rawDate = subscription.expires_at
    ? new Date(subscription.expires_at).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(rawDate);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const newExpiry = new Date(date + 'T23:59:59.000Z').toISOString();
    await base44.entities.Subscription.update(subscription.id, { expires_at: newExpiry });
    setLoading(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1A1A1A] rounded-2xl border border-white/10 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-white font-bold text-lg">Editar Expiração</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-gray-400 text-sm">Usuário: <span className="text-white">{subscription.user_email}</span></p>
          <div>
            <label className="text-gray-400 text-sm mb-1.5 block">Nova data de expiração</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-[#2A2A2A] border border-white/10 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E50914]"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 border-white/10 text-gray-300">Cancelar</Button>
            <Button onClick={handleSave} disabled={loading} className="flex-1 bg-[#E50914] hover:bg-[#FF3D3D]">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSubscriptions({ embedded = false }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | active | none
  const [addForEmail, setAddForEmail] = useState(null); // null = closed, string = email prefill
  const [editingSub, setEditingSub] = useState(null);
  const [grantingTrial, setGrantingTrial] = useState(false);
  const queryClient = useQueryClient();

  const handleGrantTrialAll = async () => {
    setGrantingTrial(true);
    const res = await base44.functions.invoke('grantTrialToAllUsers', {});
    setGrantingTrial(false);
    queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
    alert(`✅ Trial concedido para ${res.data.created} usuário(s). ${res.data.skipped} já tinham assinatura.`);
  };

  const { data: subscriptions = [], isLoading: loadingSubs } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: () => base44.entities.Subscription.list('-created_date', 500),
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => base44.entities.User.list('-created_date', 500),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Subscription.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] }),
  });

  // Map email -> best subscription (active > pending > others)
  const subByEmail = useMemo(() => {
    const map = {};
    subscriptions.forEach(s => {
      const existing = map[s.user_email];
      if (!existing) { map[s.user_email] = s; return; }
      const priority = { active: 4, pending: 3, expired: 2, cancelled: 1 };
      if ((priority[s.status] || 0) > (priority[existing.status] || 0)) {
        map[s.user_email] = s;
      }
    });
    return map;
  }, [subscriptions]);

  // Merge users with their subscription
  const rows = useMemo(() => {
    return users.map(u => ({
      user: u,
      sub: subByEmail[u.email] || null,
    }));
  }, [users, subByEmail]);

  const filtered = useMemo(() => {
    return rows.filter(({ user, sub }) => {
      const matchSearch =
        user.email?.toLowerCase().includes(search.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        sub?.plan?.toLowerCase().includes(search.toLowerCase());

      const matchFilter =
        filter === 'all' ? true :
        filter === 'active' ? sub?.status === 'active' :
        filter === 'none' ? !sub || sub.status !== 'active' :
        true;

      return matchSearch && matchFilter;
    });
  }, [rows, search, filter]);

  const stats = {
    total: users.length,
    active: rows.filter(r => r.sub?.status === 'active').length,
    noSub: rows.filter(r => !r.sub || r.sub.status !== 'active').length,
    pending: rows.filter(r => r.sub?.status === 'pending').length,
  };

  const isLoading = loadingSubs || loadingUsers;

  return (
    <>
    <div className={embedded ? '' : 'min-h-screen bg-[#0F0F0F] p-6'}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Usuários & Assinaturas</h1>
          <div className="flex gap-2">
            <Button onClick={handleGrantTrialAll} disabled={grantingTrial} variant="outline" className="border-[#FFC107]/40 text-[#FFC107] hover:bg-[#FFC107]/10 gap-2">
              {grantingTrial ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />}
              Trial para todos
            </Button>
            <Button onClick={() => setAddForEmail('')} className="bg-[#E50914] hover:bg-[#FF3D3D] gap-2">
              <Plus className="w-4 h-4" /> Adicionar Assinatura
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5">
            <p className="text-gray-400 text-sm">Total Usuários</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5">
            <p className="text-gray-400 text-sm">Com Assinatura Ativa</p>
            <p className="text-2xl font-bold text-green-400">{stats.active}</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5">
            <p className="text-gray-400 text-sm">Sem Assinatura Ativa</p>
            <p className="text-2xl font-bold text-red-400">{stats.noSub}</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-xl p-4 border border-white/5">
            <p className="text-gray-400 text-sm">Pendentes</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
          </div>
        </div>

        {/* Filters + Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Buscar por nome, email ou plano..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-[#1A1A1A] border-white/10 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="flex gap-1 bg-[#1A1A1A] p-1 rounded-lg border border-white/5">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'active', label: 'Ativos' },
              { id: 'none', label: 'Sem assinatura' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${filter === f.id ? 'bg-[#E50914] text-white' : 'text-gray-400 hover:text-white'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-6 h-6 animate-spin text-[#E50914]" />
          </div>
        ) : (
          <div className="bg-[#1A1A1A] rounded-xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-gray-400">
                    <th className="text-left p-4">Usuário</th>
                    <th className="text-left p-4">Plano</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Expira em</th>
                    <th className="text-left p-4">Tempo Restante</th>
                    <th className="text-left p-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(({ user, sub }) => {
                    const statusKey = sub?.status || 'none';
                    const cfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.none;
                    const Icon = cfg.icon;
                    return (
                      <tr key={user.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${!sub ? 'opacity-70' : ''}`}>
                        <td className="p-4">
                          <p className="text-white font-medium text-sm">{user.full_name || 'Sem nome'}</p>
                          <p className="text-gray-400 text-xs">{user.email}</p>
                        </td>
                        <td className="p-4 text-gray-300">
                          {sub ? (PLAN_LABELS[sub.plan] || sub.plan) : <span className="text-gray-600">—</span>}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.color}`}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="p-4 text-gray-400">
                          {sub?.expires_at ? new Date(sub.expires_at).toLocaleDateString('pt-BR') : <span className="text-gray-600">—</span>}
                        </td>
                        <td className="p-4">
                          {(() => {
                            if (!sub?.expires_at) return <span className="text-gray-600">—</span>;
                            const days = getDaysRemaining(sub.expires_at);
                            if (days === null) return <span className="text-gray-500">—</span>;
                            if (days < 0) return <span className="text-red-400 text-xs font-semibold">Expirada há {Math.abs(days)}d</span>;
                            if (days === 0) return <span className="text-orange-400 text-xs font-semibold">Expira hoje</span>;
                            if (days <= 3) return <span className="text-orange-400 text-xs font-semibold">{days}d</span>;
                            if (days <= 7) return <span className="text-yellow-400 text-xs font-semibold">{days}d</span>;
                            return <span className="text-green-400 text-xs font-semibold">{days}d</span>;
                          })()}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2 flex-wrap">
                            {!sub || sub.status !== 'active' ? (
                              <Button
                                size="sm"
                                onClick={() => setAddForEmail(user.email)}
                                className="bg-[#E50914] hover:bg-[#FF3D3D] h-7 text-xs gap-1"
                              >
                                <Plus className="w-3 h-3" /> Ativar
                              </Button>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateMutation.mutate({ id: sub.id, status: 'cancelled' })}
                                  className="text-red-400 border-red-500/30 hover:bg-red-500/10 h-7 text-xs"
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingSub(sub)}
                                  className="text-blue-400 border-blue-500/30 hover:bg-blue-500/10 h-7 text-xs"
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                            {sub && sub.status !== 'active' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateMutation.mutate({ id: sub.id, status: 'active' })}
                                className="text-green-400 border-green-500/30 hover:bg-green-500/10 h-7 text-xs"
                              >
                                Reativar
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">Nenhum usuário encontrado.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>

    {addForEmail !== null && (
      <AddSubscriptionModal
        email={addForEmail}
        onClose={() => setAddForEmail(null)}
        onSuccess={() => {
          setAddForEmail(null);
          queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
        }}
      />
    )}
    {editingSub && (
      <EditExpiryModal
        subscription={editingSub}
        onClose={() => setEditingSub(null)}
        onSuccess={() => {
          setEditingSub(null);
          queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
        }}
      />
    )}
    </>
  );
}