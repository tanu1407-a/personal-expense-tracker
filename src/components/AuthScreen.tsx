import { useState } from "react";
import { login, register } from "@/lib/store";

export function AuthScreen({ onAuth }: { onAuth: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) return setError("Password must be at least 4 characters.");
    const err = mode === "login" ? login(email, password) : register(name, email, password);
    if (err) setError(err);
    else onAuth();
  };

  return (
    <div className="grid min-h-screen place-items-center px-4 hero-bg">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary font-display text-2xl text-primary-foreground shadow-glow">₹</div>
          <h1 className="font-display text-3xl font-bold">Smart Money</h1>
          <p className="mt-1 text-muted-foreground">Track income, expenses & savings</p>
        </div>
        <form onSubmit={submit} className="card-surface space-y-4 p-6">
          <div className="grid grid-cols-2 rounded-xl bg-muted p-1 text-sm font-semibold">
            {(["login", "register"] as const).map((m) => (
              <button type="button" key={m} onClick={() => { setMode(m); setError(""); }}
                className={`rounded-lg py-2 transition ${mode === m ? "bg-card shadow" : "text-muted-foreground"}`}>
                {m === "login" ? "Login" : "Register"}
              </button>
            ))}
          </div>
          {mode === "register" && (
            <input required className="field" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          )}
          <input required type="email" className="field" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input required type="password" className="field" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button className="btn-primary w-full">{mode === "login" ? "Login" : "Create account"}</button>
          <p className="text-center text-xs text-muted-foreground">Data is stored only in this browser.</p>
        </form>
      </div>
    </div>
  );
}
