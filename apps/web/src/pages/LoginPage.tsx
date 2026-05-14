import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { useAuth } from "../context/AuthContext";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export const LoginPage = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("cashier@corecart.dev");
  const [password, setPassword] = useState("Cashier@123");
  const [error, setError] = useState("");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/pos");
    } catch (error) {
      if (isAxiosError(error)) {
        if (!error.response) {
          setError(`Cannot reach API server at ${apiBaseUrl}. Start backend first.`);
          return;
        }

        const message = (error.response.data as { message?: string } | undefined)?.message;
        setError(message || "Login failed. Check email/password.");
        return;
      }

      setError("Login failed. Check email/password.");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#f59e0b_0,_#fde68a_20%,_#f8fafc_55%,_#e0f2fe_100%)] p-6">
      <div className="mx-auto grid min-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/70 bg-white/70 shadow-2xl backdrop-blur lg:grid-cols-2">
        <section className="flex flex-col justify-between bg-slate-900 p-8 text-white">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-orange-300">CoreCart</p>
            <h1 className="mt-3 text-4xl font-black leading-tight">Retail sync that never sleeps.</h1>
            <p className="mt-4 text-slate-300">
              Billing, inventory, and omnichannel sync in one fast system.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4">
            <p className="text-sm text-slate-300">Demo Accounts</p>
            <p className="mt-2 text-sm">Admin: admin@corecart.dev / Admin@123</p>
            <p className="text-sm">Manager: manager@corecart.dev / Manager@123</p>
            <p className="text-sm">Cashier: cashier@corecart.dev / Cashier@123</p>
          </div>
        </section>

        <section className="flex items-center p-8">
          <form onSubmit={onSubmit} className="w-full space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">Welcome back</p>
              <h2 className="text-3xl font-black">Sign In</h2>
            </div>

            <label className="block">
              <span className="text-sm font-medium">Email</span>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">Password</span>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};
