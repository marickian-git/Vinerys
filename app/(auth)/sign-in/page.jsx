"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/utils/auth-client";
import toast from "react-hot-toast";

export default function SignInPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn.email({
      email: form.email,
      password: form.password,
      callbackURL: "/dashboard",
    });
    if (error) {
      toast.error(error.message ?? "Eroare la autentificare");
      setLoading(false);
      return;
    }
    toast.success("Bine ai venit!");
    router.push("/dashboard");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .wine-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'Jost', sans-serif;
          background: #0d0608;
          overflow: hidden;
        }

        .wine-left {
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 3rem;
        }

        .wine-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 30% 20%, rgba(120, 20, 40, 0.6) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 80%, rgba(60, 10, 20, 0.8) 0%, transparent 50%),
            linear-gradient(160deg, #1a0810 0%, #0d0608 50%, #1f0a12 100%);
        }

        .wine-orbs { position: absolute; inset: 0; overflow: hidden; }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.4;
          animation: float 8s ease-in-out infinite;
        }
        .orb-1 { width: 400px; height: 400px; background: radial-gradient(circle, #8b1a2e, transparent); top: -100px; left: -100px; animation-delay: 0s; }
        .orb-2 { width: 300px; height: 300px; background: radial-gradient(circle, #5c0e1c, transparent); bottom: 100px; right: -50px; animation-delay: -3s; }
        .orb-3 { width: 200px; height: 200px; background: radial-gradient(circle, #c44569, transparent); top: 40%; left: 40%; animation-delay: -5s; opacity: 0.2; }

        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }

        .wine-glass-art { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.12; width: 280px; }

        .wine-left-content { position: relative; z-index: 2; }

        .wine-tagline {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2.5rem, 4vw, 4rem);
          font-weight: 300;
          color: #f5e6e8;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          letter-spacing: -0.02em;
        }
        .wine-tagline em { font-style: italic; color: #c44569; }

        .wine-desc {
          font-size: 0.9rem;
          color: rgba(245, 230, 232, 0.5);
          font-weight: 300;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 3rem;
        }

        .wine-stats { display: flex; gap: 2rem; }
        .stat { display: flex; flex-direction: column; gap: 0.3rem; }
        .stat-num { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 600; color: #c44569; line-height: 1; }
        .stat-label { font-size: 0.7rem; color: rgba(245, 230, 232, 0.4); text-transform: uppercase; letter-spacing: 0.12em; }
        .divider-vert { width: 1px; background: rgba(196, 69, 105, 0.3); align-self: stretch; }

        .wine-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: #0d0608;
          position: relative;
        }
        .wine-right::before {
          content: '';
          position: absolute;
          left: 0; top: 10%; bottom: 10%;
          width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(196, 69, 105, 0.3), transparent);
        }

        .form-container {
          width: 100%;
          max-width: 400px;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .form-container.mounted { opacity: 1; transform: translateY(0); }

        .form-logo { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 3rem; }
        .logo-icon { width: 36px; height: 36px; background: linear-gradient(135deg, #8b1a2e, #c44569); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
        .logo-text { font-family: 'Cormorant Garamond', serif; font-size: 1.4rem; font-weight: 600; color: #f5e6e8; letter-spacing: 0.15em; text-transform: uppercase; }

        .form-title { font-family: 'Cormorant Garamond', serif; font-size: 2.2rem; font-weight: 300; color: #f5e6e8; margin-bottom: 0.5rem; line-height: 1.2; }
        .form-subtitle { font-size: 0.82rem; color: rgba(245, 230, 232, 0.4); font-weight: 300; letter-spacing: 0.05em; margin-bottom: 2.5rem; }

        .field-group { margin-bottom: 1.25rem; }
        .field-label { display: block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(245, 230, 232, 0.5); margin-bottom: 0.6rem; font-weight: 400; }
        .field-input {
          width: 100%; padding: 0.85rem 1rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(196, 69, 105, 0.2);
          border-radius: 8px; color: #f5e6e8;
          font-family: 'Jost', sans-serif; font-size: 0.9rem; font-weight: 300;
          outline: none; transition: all 0.3s ease;
        }
        .field-input::placeholder { color: rgba(245, 230, 232, 0.2); }
        .field-input:focus { border-color: rgba(196, 69, 105, 0.6); background: rgba(196, 69, 105, 0.05); box-shadow: 0 0 0 3px rgba(196, 69, 105, 0.08); }
        .field-input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #1a0810 inset; -webkit-text-fill-color: #f5e6e8; }

        .submit-btn {
          width: 100%; padding: 0.95rem;
          background: linear-gradient(135deg, #8b1a2e 0%, #c44569 100%);
          border: none; border-radius: 8px; color: #f5e6e8;
          font-family: 'Jost', sans-serif; font-size: 0.85rem; font-weight: 500;
          letter-spacing: 0.15em; text-transform: uppercase;
          cursor: pointer; margin-top: 0.5rem;
          transition: all 0.3s ease; position: relative; overflow: hidden;
        }
        .submit-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, #c44569 0%, #8b1a2e 100%); opacity: 0; transition: opacity 0.3s ease; }
        .submit-btn:hover::before { opacity: 1; }
        .submit-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(196, 69, 105, 0.35); }
        .submit-btn:active { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .submit-btn span { position: relative; z-index: 1; }

        .form-footer { margin-top: 2rem; text-align: center; }
        .form-footer p { font-size: 0.8rem; color: rgba(245, 230, 232, 0.35); font-weight: 300; }
        .form-footer a { color: #c44569; text-decoration: none; font-weight: 400; transition: color 0.2s; }
        .form-footer a:hover { color: #e0607a; }

        .separator { display: flex; align-items: center; gap: 1rem; margin: 1.75rem 0; }
        .sep-line { flex: 1; height: 1px; background: rgba(196, 69, 105, 0.15); }
        .sep-text { font-size: 0.7rem; color: rgba(245, 230, 232, 0.25); text-transform: uppercase; letter-spacing: 0.1em; }

        .spinner { width: 16px; height: 16px; border: 2px solid rgba(245, 230, 232, 0.3); border-top-color: #f5e6e8; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; margin-right: 8px; vertical-align: middle; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .grain { position: fixed; inset: 0; pointer-events: none; z-index: 100; opacity: 0.025; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"); background-size: 128px; }

        @media (max-width: 768px) {
          .wine-page { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
          .wine-left { padding: 2rem; min-height: 220px; justify-content: center; }
          .wine-glass-art { display: none; }
          .wine-tagline { font-size: 2rem; margin-bottom: 0.75rem; }
          .wine-desc { margin-bottom: 1.5rem; font-size: 0.75rem; }
          .wine-stats { gap: 1.5rem; }
          .stat-num { font-size: 1.5rem; }
          .wine-right::before { display: none; }
          .wine-right { padding: 2rem 1.5rem; align-items: flex-start; }
          .form-logo { margin-bottom: 2rem; }
          .form-title { font-size: 1.8rem; }
        }
        @media (max-width: 480px) {
          .wine-left { min-height: 180px; padding: 1.5rem; }
          .wine-tagline { font-size: 1.6rem; }
          .wine-stats { display: none; }
        }
      `}</style>

      <div className="grain" />

      <div className="wine-page">
        {/* LEFT */}
        <div className="wine-left">
          <div className="wine-bg" />
          <div className="wine-orbs">
            <div className="orb orb-1" />
            <div className="orb orb-2" />
            <div className="orb orb-3" />
          </div>

          <svg className="wine-glass-art" viewBox="0 0 200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M60 20 L140 20 L160 120 Q170 180 100 200 Q30 180 40 120 Z" stroke="rgba(196,69,105,0.8)" strokeWidth="1.5" fill="none"/>
            <path d="M40 120 Q30 180 100 200 Q170 180 160 120" fill="rgba(139,26,46,0.3)" />
            <line x1="100" y1="200" x2="100" y2="340" stroke="rgba(196,69,105,0.6)" strokeWidth="1.5"/>
            <ellipse cx="100" cy="340" rx="50" ry="8" stroke="rgba(196,69,105,0.6)" strokeWidth="1.5" fill="none"/>
          </svg>

          <div className="wine-left-content">
            <h1 className="wine-tagline">
              Colecția ta,<br />
              <em>perfectă</em> în<br />
              fiecare detaliu.
            </h1>
            <p className="wine-desc">Pivnița digitală personală</p>
            <div className="wine-stats">
              <div className="stat">
                <span className="stat-num">∞</span>
                <span className="stat-label">Vinuri</span>
              </div>
              <div className="divider-vert" />
              <div className="stat">
                <span className="stat-num">100%</span>
                <span className="stat-label">Privat</span>
              </div>
              <div className="divider-vert" />
              <div className="stat">
                <span className="stat-num">0€</span>
                <span className="stat-label">Gratuit</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="wine-right">
          <div className={`form-container ${mounted ? "mounted" : ""}`}>
            <div className="form-logo">
              <div className="logo-icon">🍷</div>
              <span className="logo-text">Vinerys</span>
            </div>

            <h2 className="form-title">Bine ai revenit</h2>
            <p className="form-subtitle">Autentifică-te pentru a-ți accesa colecția</p>

            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <label className="field-label">Adresă email</label>
                <input
                  type="email"
                  className="field-input"
                  placeholder="email@exemplu.ro"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div className="field-group">
                <label className="field-label">Parolă</label>
                <input
                  type="password"
                  className="field-input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading
                  ? <span><span className="spinner" />Se autentifică...</span>
                  : <span>Intră în colecție</span>
                }
              </button>
            </form>

            <div className="separator">
              <div className="sep-line" />
              <span className="sep-text">sau</span>
              <div className="sep-line" />
            </div>

            <div className="form-footer">
              <p>Nu ai cont? <Link href="/sign-up">Creează-ți pivnița</Link></p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}