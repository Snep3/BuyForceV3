import { useState } from "react";
import axios from "axios";
import { API_URL } from "../config/api";
import { useRouter } from "next/router";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await axios.post(`${API_URL}/api/users/signup`, { username, email, password });
      const res = await axios.post(`${API_URL}/api/users/login`, { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      router.push("/");
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(" | ") : (msg || "Registration failed. Please check your details."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">BuyForce</div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Join the group buying revolution</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="johndoe"
              required
            />
          </div>

          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link href="/login">Sign in</Link>
        </p>
      </div>

      <style jsx>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
          padding: 2rem;
        }
        .auth-card {
          background: #fff;
          border-radius: 20px;
          padding: 2.5rem 2rem;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.4);
        }
        .auth-logo {
          font-size: 1.6rem;
          font-weight: 900;
          letter-spacing: -0.5px;
          color: #228be6;
          margin-bottom: 1.5rem;
        }
        .auth-title {
          font-size: 1.8rem;
          font-weight: 800;
          color: #111;
          margin: 0 0 0.25rem;
        }
        .auth-sub {
          color: #868e96;
          margin: 0 0 2rem;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.2rem;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .field label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #495057;
        }
        .field input {
          padding: 0.75rem 1rem;
          border: 1.5px solid #dee2e6;
          border-radius: 10px;
          font-size: 1rem;
          outline: none;
          transition: border-color 0.2s;
          font-family: inherit;
        }
        .field input:focus {
          border-color: #228be6;
        }
        .auth-error {
          background: #fff5f5;
          color: #c92a2a;
          border: 1px solid #ffa8a8;
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-size: 0.9rem;
          font-weight: 500;
        }
        .auth-btn {
          padding: 0.9rem;
          background: #228be6;
          color: #fff;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, opacity 0.2s;
          font-family: inherit;
          margin-top: 0.5rem;
        }
        .auth-btn:hover:not(:disabled) {
          background: #1971c2;
        }
        .auth-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .auth-switch {
          text-align: center;
          margin-top: 1.5rem;
          color: #868e96;
          font-size: 0.9rem;
        }
        .auth-switch a {
          color: #228be6;
          font-weight: 600;
          text-decoration: none;
        }
        .auth-switch a:hover {
          text-decoration: underline;
        }
      `}</style>
    </main>
  );
}
