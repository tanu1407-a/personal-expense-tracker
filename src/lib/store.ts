export type TxType = "income" | "expense";
export interface Tx {
  id: string;
  type: TxType;
  amount: number;
  category: string;
  note: string;
  date: string; // YYYY-MM-DD
}
export interface User {
  name: string;
  email: string;
  password: string;
}

export const INCOME_CATS = ["Salary", "Freelance", "Investment", "Gift", "Other"];
export const EXPENSE_CATS = ["Food", "Transport", "Shopping", "Bills", "Health", "Entertainment", "Education", "Rent", "Other"];

const USERS = "pet_users";
const SESSION = "pet_session";
const txKey = (email: string) => `pet_tx_${email}`;

const read = <T,>(k: string, d: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : d;
  } catch {
    return d;
  }
};
const write = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v));

export function register(name: string, email: string, password: string): string | null {
  const users = read<User[]>(USERS, []);
  const e = email.trim().toLowerCase();
  if (users.some((u) => u.email === e)) return "An account with this email already exists.";
  users.push({ name: name.trim(), email: e, password });
  write(USERS, users);
  localStorage.setItem(SESSION, e);
  return null;
}
export function login(email: string, password: string): string | null {
  const e = email.trim().toLowerCase();
  const u = read<User[]>(USERS, []).find((x) => x.email === e);
  if (!u || u.password !== password) return "Incorrect email or password.";
  localStorage.setItem(SESSION, e);
  return null;
}
export const logout = () => localStorage.removeItem(SESSION);
export function currentUser(): User | null {
  const e = localStorage.getItem(SESSION);
  if (!e) return null;
  return read<User[]>(USERS, []).find((u) => u.email === e) ?? null;
}
export const loadTx = (email: string) => read<Tx[]>(txKey(email), []);
export const saveTx = (email: string, tx: Tx[]) => write(txKey(email), tx);

export function totals(tx: Tx[]) {
  const income = tx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = tx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  return { income, expense, balance: income - expense };
}
export const money = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
