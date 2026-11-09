import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  EXPENSE_CATS, INCOME_CATS, loadTx, money, saveTx, totals, type Tx, type TxType, type User,
} from "@/lib/store";

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const PALETTE = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6", "#f97316", "#84cc16", "#64748b"];
const today = () => new Date().toISOString().slice(0, 10);
const monthLabel = (ym: string) =>
  new Date(ym + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" });

type Tab = "dashboard" | "transactions" | "reports";

export function Dashboard({ user, onLogout, dark, toggleDark }: {
  user: User; onLogout: () => void; dark: boolean; toggleDark: () => void;
}) {
  const [tx, setTx] = useState<Tx[]>(() => loadTx(user.email));
  const [tab, setTab] = useState<Tab>("dashboard");
  const [editing, setEditing] = useState<Tx | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [month, setMonth] = useState(today().slice(0, 7));

  useEffect(() => saveTx(user.email, tx), [tx, user.email]);

  const all = totals(tx);
  const sorted = useMemo(() => [...tx].sort((a, b) => b.date.localeCompare(a.date)), [tx]);
  const textColor = dark ? "#cbd5e1" : "#475569";
  const gridColor = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";

  // last 6 months
  const months = useMemo(() => {
    const out: string[] = [];
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      out.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`);
    }
    return out;
  }, []);
  const barData = {
    labels: months.map(monthLabel),
    datasets: [
      { label: "Income", backgroundColor: "#10b981", borderRadius: 6,
        data: months.map((m) => totals(tx.filter((t) => t.date.startsWith(m))).income) },
      { label: "Expense", backgroundColor: "#f43f5e", borderRadius: 6,
        data: months.map((m) => totals(tx.filter((t) => t.date.startsWith(m))).expense) },
    ],
  };
  const catTotals = (list: Tx[]) => {
    const map: Record<string, number> = {};
    list.filter((t) => t.type === "expense").forEach((t) => (map[t.category] = (map[t.category] || 0) + t.amount));
    return map;
  };
  const pie = (list: Tx[]) => {
    const m = catTotals(list);
    return { labels: Object.keys(m), datasets: [{ data: Object.values(m), backgroundColor: PALETTE, borderWidth: 0 }] };
  };
  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: textColor } } },
    scales: { x: { ticks: { color: textColor }, grid: { color: gridColor } }, y: { ticks: { color: textColor }, grid: { color: gridColor } } },
  };
  const pieOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" as const, labels: { color: textColor } } } };

  const monthTx = sorted.filter((t) => t.date.startsWith(month));
  const mt = totals(monthTx);

  const upsert = (t: Tx) => {
    setTx((prev) => (prev.some((p) => p.id === t.id) ? prev.map((p) => (p.id === t.id ? t : p)) : [...prev, t]));
    setShowForm(false); setEditing(null);
  };
  const remove = (id: string) => { if (confirm("Delete this transaction?")) setTx((p) => p.filter((t) => t.id !== id)); };
  const openEdit = (t: Tx) => { setEditing(t); setShowForm(true); };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-display text-primary-foreground">₹</div>
          <span className="hidden font-display text-lg font-bold sm:block">Smart Money</span>
          <nav className="ml-auto flex gap-1 rounded-xl bg-muted p-1 text-sm font-medium">
            {(["dashboard", "transactions", "reports"] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`rounded-lg px-3 py-1.5 capitalize transition ${tab === t ? "bg-card shadow" : "text-muted-foreground"}`}>
                {t === "transactions" ? "History" : t}
              </button>
            ))}
          </nav>
          <button onClick={toggleDark} className="btn-ghost" aria-label="Toggle theme">{dark ? "☀️" : "🌙"}</button>
          <button onClick={onLogout} className="btn-ghost text-sm">Logout</button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h2 className="font-display text-2xl font-bold">{user.name}</h2>
          </div>
          <button className="btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>+ Add transaction</button>
        </div>

        {tab === "dashboard" && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="balance-card p-6 sm:col-span-1">
                <p className="text-sm opacity-80">Total Balance</p>
                <p className="mt-2 font-display text-3xl font-bold">{money(all.balance)}</p>
              </div>
              <Stat label="Total Income" value={money(all.income)} tone="text-income" />
              <Stat label="Total Expenses" value={money(all.expense)} tone="text-expense" />
            </div>
            <div className="grid gap-4 lg:grid-cols-5">
              <div className="card-surface p-5 lg:col-span-3">
                <h3 className="mb-4 font-semibold">Monthly Income vs Expense</h3>
                <div className="h-72"><Bar data={barData} options={chartOpts} /></div>
              </div>
              <div className="card-surface p-5 lg:col-span-2">
                <h3 className="mb-4 font-semibold">Expenses by Category</h3>
                <div className="h-72">
                  {Object.keys(catTotals(tx)).length ? <Doughnut data={pie(tx)} options={pieOpts} /> : <Empty />}
                </div>
              </div>
            </div>
            <div className="card-surface p-5">
              <h3 className="mb-3 font-semibold">Recent Transactions</h3>
              <TxList list={sorted.slice(0, 5)} onEdit={openEdit} onDelete={remove} />
            </div>
          </>
        )}

        {tab === "transactions" && (
          <div className="card-surface p-5">
            <h3 className="mb-3 font-semibold">All Transactions ({tx.length})</h3>
            <TxList list={sorted} onEdit={openEdit} onDelete={remove} />
          </div>
        )}

        {tab === "reports" && (
          <>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Month</label>
              <input type="month" className="field w-auto" value={month} onChange={(e) => setMonth(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Income" value={money(mt.income)} tone="text-income" />
              <Stat label="Expenses" value={money(mt.expense)} tone="text-expense" />
              <Stat label="Savings" value={money(mt.balance)} tone={mt.balance >= 0 ? "text-income" : "text-expense"}
                sub={mt.income ? `${Math.round((mt.balance / mt.income) * 100)}% savings rate` : undefined} />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="card-surface p-5">
                <h3 className="mb-4 font-semibold">Category breakdown – {monthLabel(month)}</h3>
                <div className="h-72">{Object.keys(catTotals(monthTx)).length ? <Doughnut data={pie(monthTx)} options={pieOpts} /> : <Empty />}</div>
              </div>
              <div className="card-surface p-5">
                <h3 className="mb-4 font-semibold">Top spending</h3>
                <ul className="space-y-3">
                  {Object.entries(catTotals(monthTx)).sort((a, b) => b[1] - a[1]).map(([c, v], i) => (
                    <li key={c}>
                      <div className="flex justify-between text-sm"><span>{c}</span><span className="font-semibold">{money(v)}</span></div>
                      <div className="mt-1 h-2 rounded-full bg-muted">
                        <div className="h-2 rounded-full" style={{ width: `${(v / mt.expense) * 100}%`, background: PALETTE[i % PALETTE.length] }} />
                      </div>
                    </li>
                  ))}
                  {!mt.expense && <Empty />}
                </ul>
              </div>
            </div>
            <div className="card-surface p-5">
              <h3 className="mb-3 font-semibold">Transactions in {monthLabel(month)}</h3>
              <TxList list={monthTx} onEdit={openEdit} onDelete={remove} />
            </div>
          </>
        )}
      </main>

      {showForm && <TxForm initial={editing} onSave={upsert} onClose={() => { setShowForm(false); setEditing(null); }} />}
    </div>
  );
}

function Stat({ label, value, tone, sub }: { label: string; value: string; tone: string; sub?: string | undefined }) {
  return (
    <div className="card-surface p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-2 font-display text-2xl font-bold ${tone}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
const Empty = () => <p className="grid h-full place-items-center py-8 text-sm text-muted-foreground">No data yet</p>;

function TxList({ list, onEdit, onDelete }: { list: Tx[]; onEdit: (t: Tx) => void; onDelete: (id: string) => void }) {
  if (!list.length) return <Empty />;
  return (
    <ul className="divide-y">
      {list.map((t) => (
        <li key={t.id} className="flex items-center gap-3 py-3">
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl font-bold ${t.type === "income" ? "bg-income/15 text-income" : "bg-expense/15 text-expense"}`}>
            {t.type === "income" ? "↑" : "↓"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{t.note || t.category}</p>
            <p className="text-xs text-muted-foreground">{t.category} · {t.date}</p>
          </div>
          <p className={`font-semibold ${t.type === "income" ? "text-income" : "text-expense"}`}>
            {t.type === "income" ? "+" : "-"}{money(t.amount)}
          </p>
          <button className="btn-ghost text-xs" onClick={() => onEdit(t)}>Edit</button>
          <button className="btn-ghost text-xs text-destructive" onClick={() => onDelete(t.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}

function TxForm({ initial, onSave, onClose }: { initial: Tx | null; onSave: (t: Tx) => void; onClose: () => void }) {
  const [type, setType] = useState<TxType>(initial?.type ?? "expense");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [category, setCategory] = useState<string>(initial?.category ?? "Food");
  const [note, setNote] = useState(initial?.note ?? "");
  const [date, setDate] = useState(initial?.date ?? today());
  const cats = type === "income" ? INCOME_CATS : EXPENSE_CATS;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!(amt > 0)) return;
    onSave({ id: initial?.id ?? crypto.randomUUID(), type, amount: amt, category, note: note.trim(), date });
  };

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="card-surface w-full max-w-md space-y-4 p-6">
        <h3 className="font-display text-xl font-bold">{initial ? "Edit" : "Add"} transaction</h3>
        <div className="grid grid-cols-2 gap-2">
          {(["income", "expense"] as TxType[]).map((t) => (
            <button type="button" key={t}
              onClick={() => { setType(t); setCategory(t === "income" ? "Salary" : "Food"); }}
              className={`rounded-xl border py-2 font-semibold capitalize transition ${type === t ? (t === "income" ? "border-income bg-income/15 text-income" : "border-expense bg-expense/15 text-expense") : "text-muted-foreground"}`}>
              {t}
            </button>
          ))}
        </div>
        <input required type="number" min="0.01" step="0.01" className="field" placeholder="Amount (₹)" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <select className="field" value={category} onChange={(e) => setCategory(e.target.value)}>
          {cats.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input className="field" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <input required type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} />
        <div className="flex gap-2">
          <button type="button" className="btn-ghost flex-1 border" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1">Save</button>
        </div>
      </form>
    </div>
  );
}
