import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthScreen } from "@/components/AuthScreen";
import { Dashboard } from "@/components/Dashboard";
import { currentUser, logout, type User } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Money – Personal Expense Tracker" },
      { name: "description", content: "Track daily income, expenses and monthly savings with charts and reports." },
      { property: "og:title", content: "Smart Money – Personal Expense Tracker" },
      { property: "og:description", content: "Track daily income, expenses and monthly savings with charts and reports." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setUser(currentUser());
    setDark(localStorage.getItem("pet_theme") === "dark");
    setReady(true);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    if (ready) localStorage.setItem("pet_theme", dark ? "dark" : "light");
  }, [dark, ready]);

  if (!ready) return <div className="min-h-screen" />;
  if (!user) return <AuthScreen onAuth={() => setUser(currentUser())} />;
  return (
    <Dashboard key={user.email} user={user} dark={dark} toggleDark={() => setDark((d) => !d)}
      onLogout={() => { logout(); setUser(null); }} />
  );
}
