"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/utils/auth-client";
import toast from "react-hot-toast";

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error("Parolele nu se potrivesc"); return; }
    if (form.password.length < 8) { toast.error("Parola trebuie să aibă minim 8 caractere"); return; }
    setLoading(true);
    const { error } = await signUp.email({
      name: form.name,
      email: form.email,
      password: form.password,
      callbackURL: "/dashboard",
    });
    if (error) {
      toast.error(error.message ?? "Eroare la înregistrare");
      setLoading(false);
      return;
    }
    toast.success("Cont creat cu succes!");
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
          justify-content: center;
          align-items: center;
          padding: 3rem;
        }

        .wine-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 70% 30%, rgba(120, 20, 40, 0.55) 0%, transparent 60%),
            radial-gradient(ellipse at 20% 80%, rgba(60, 10, 20, 0.7) 0%, transparent 50%),
            linear-gradient(160deg, #1f0a12 0%, #0d0608 50%, #1a0810 100%);
        }

        .wine-orbs { position: absolute; inset: 0; overflow: hidden; }
        .orb { position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.35; animation: float 9s ease-in-out infinite; }
        .orb-1 { width: 350px; height: 350px; background: radial-gradient(circle, #8b1a2e, transparent); top: -80px; right: -80px; animation-delay: 0s; }
        .orb-2 { width: 280px; height: 280px; background: radial-gradient(circle, #5c0e1c, transparent); bottom: 60px; left: -40px; animation-delay: -4s; }
        .orb-3 { width: 180px; height: 180px; background: radial-gradient(circle, #c44569, transparent); top: 55%; right: 30%; animation-delay: -2s; opacity: 0.18; }

        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-25px) scale(1.04); }
        }

        /* Bottles illustration */
        .bottles-art {
          position: relative;
          z-index: 2;
          margin-bottom: 3rem;
          opacity: 0.85;
        }

        .wine-left-content { position: relative; z-index: 2; text-align: center; }

        .wine-tagline {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2rem, 3.5vw, 3.5rem);
          font-weight: 300;
          color: #f5e6e8;
          line-height: 1.15;
          margin-bottom: 1.2rem;
          letter-spacing: -0.02em;
        }
        .wine-tagline em { font-style: italic; color: #c44569; }

        .wine-desc {
          font-size: 0.85rem;
          color: rgba(245, 230, 232, 0.45);
          font-weight: 300;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 2.5rem;
          line-height: 1.8;
        }

        .feature-list { display: flex; flex-direction: column; gap: 0.9rem; align-items: flex-start; }
        .feature-item { display: flex; align-items: center; gap: 0.75rem; }
        .feature-dot { width: 6px; height: 6px; border-radius: 50%; background: #c44569; flex-shrink: 0; box-shadow: 0 0 8px rgba(196,69,105,0.6); }
        .feature-text { font-size: 0.8rem; color: rgba(245, 230, 232, 0.5); letter-spacing: 0.06em; font-weight: 300; }

        /* RIGHT */
        .wine-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: #0d0608;
          position: relative;
          overflow-y: auto;
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
          padding: 1rem 0;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .form-container.mounted { opacity: 1; transform: translateY(0); }

        .form-logo { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 2.5rem; }
        .logo-icon { width: 36px; height: 36px; background: linear-gradient(135deg, #8b1a2e, #c44569); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
        .logo-text { font-family: 'Cormorant Garamond', serif; font-size: 1.4rem; font-weight: 600; color: #f5e6e8; letter-spacing: 0.15em; text-transform: uppercase; }

        .form-title { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 300; color: #f5e6e8; margin-bottom: 0.4rem; line-height: 1.2; }
        .form-subtitle { font-size: 0.82rem; color: rgba(245, 230, 232, 0.4); font-weight: 300; letter-spacing: 0.05em; margin-bottom: 2rem; }

        .fields-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

        .field-group { margin-bottom: 1.1rem; }
        .field-group.full { grid-column: 1 / -1; }
        .field-label { display: block; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(245, 230, 232, 0.5); margin-bottom: 0.55rem; font-weight: 400; }
        .field-input {
          width: 100%; padding: 0.8rem 1rem;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(196, 69, 105, 0.2);
          border-radius: 8px; color: #f5e6e8;
          font-family: 'Jost', sans-serif; font-size: 0.88rem; font-weight: 300;
          outline: none; transition: all 0.3s ease;
        }
        .field-input::placeholder { color: rgba(245, 230, 232, 0.2); }
        .field-input:focus { border-color: rgba(196, 69, 105, 0.6); background: rgba(196, 69, 105, 0.05); box-shadow: 0 0 0 3px rgba(196, 69, 105, 0.08); }
        .field-input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #1a0810 inset; -webkit-text-fill-color: #f5e6e8; }

        /* Password strength */
        .pwd-strength { margin-top: 0.4rem; display: flex; gap: 3px; }
        .pwd-bar { height: 2px; flex: 1; border-radius: 2px; background: rgba(255,255,255,0.08); transition: background 0.3s; }
        .pwd-bar.weak { background: #e05555; }
        .pwd-bar.medium { background: #e0a055; }
        .pwd-bar.strong { background: #55c44e; }

        .submit-btn {
          width: 100%; padding: 0.95rem;
          background: linear-gradient(135deg, #8b1a2e 0%, #c44569 100%);
          border: none; border-radius: 8px; color: #f5e6e8;
          font-family: 'Jost', sans-serif; font-size: 0.85rem; font-weight: 500;
          letter-spacing: 0.15em; text-transform: uppercase;
          cursor: pointer; margin-top: 0.75rem;
          transition: all 0.3s ease; position: relative; overflow: hidden;
        }
        .submit-btn::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, #c44569 0%, #8b1a2e 100%); opacity: 0; transition: opacity 0.3s ease; }
        .submit-btn:hover::before { opacity: 1; }
        .submit-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 25px rgba(196, 69, 105, 0.35); }
        .submit-btn:active { transform: translateY(0); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .submit-btn span { position: relative; z-index: 1; }

        .terms-note { font-size: 0.72rem; color: rgba(245, 230, 232, 0.25); text-align: center; margin-top: 1rem; line-height: 1.6; font-weight: 300; }

        .form-footer { margin-top: 1.5rem; text-align: center; }
        .form-footer p { font-size: 0.8rem; color: rgba(245, 230, 232, 0.35); font-weight: 300; }
        .form-footer a { color: #c44569; text-decoration: none; font-weight: 400; transition: color 0.2s; }
        .form-footer a:hover { color: #e0607a; }

        .separator { display: flex; align-items: center; gap: 1rem; margin: 1.5rem 0; }
        .sep-line { flex: 1; height: 1px; background: rgba(196, 69, 105, 0.15); }
        .sep-text { font-size: 0.7rem; color: rgba(245, 230, 232, 0.25); text-transform: uppercase; letter-spacing: 0.1em; }

        .spinner { width: 16px; height: 16px; border: 2px solid rgba(245, 230, 232, 0.3); border-top-color: #f5e6e8; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; margin-right: 8px; vertical-align: middle; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .grain { position: fixed; inset: 0; pointer-events: none; z-index: 100; opacity: 0.025; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"); background-size: 128px; }

        @media (max-width: 900px) {
          .fields-row { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .wine-page { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
          .wine-left { padding: 2rem; min-height: 200px; justify-content: center; }
          .bottles-art { display: none; }
          .wine-tagline { font-size: 1.9rem; margin-bottom: 0.6rem; }
          .wine-desc { margin-bottom: 1.2rem; font-size: 0.75rem; }
          .feature-list { flex-direction: row; flex-wrap: wrap; justify-content: center; gap: 0.6rem 1.5rem; }
          .wine-right::before { display: none; }
          .wine-right { padding: 2rem 1.5rem; align-items: flex-start; }
          .form-logo { margin-bottom: 1.5rem; }
          .form-title { font-size: 1.7rem; }
          .fields-row { grid-template-columns: 1fr; gap: 0; }
        }
        @media (max-width: 480px) {
          .wine-left { min-height: 160px; padding: 1.5rem; }
          .wine-tagline { font-size: 1.5rem; }
          .feature-list { display: none; }
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

          {/* Bottles SVG illustration */}
          <svg className="bottles-art" width="220" height="280" viewBox="0 0 220 280" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Bottle 1 - left */}
            <g opacity="0.7">
              <rect x="38" y="80" width="28" height="140" rx="6" fill="rgba(139,26,46,0.4)" stroke="rgba(196,69,105,0.5)" strokeWidth="1"/>
              <rect x="42" y="60" width="20" height="25" rx="3" fill="rgba(139,26,46,0.3)" stroke="rgba(196,69,105,0.4)" strokeWidth="1"/>
              <rect x="47" y="50" width="10" height="14" rx="2" fill="rgba(196,69,105,0.5)" stroke="rgba(196,69,105,0.6)" strokeWidth="1"/>
              <rect x="42" y="140" width="20" height="40" rx="0" fill="rgba(196,69,105,0.15)"/>
              <line x1="42" y1="185" x2="62" y2="185" stroke="rgba(196,69,105,0.3)" strokeWidth="0.5"/>
            </g>
            {/* Bottle 2 - center (taller) */}
            <g opacity="0.9">
              <rect x="88" y="50" width="32" height="170" rx="7" fill="rgba(92,14,28,0.5)" stroke="rgba(196,69,105,0.7)" strokeWidth="1.2"/>
              <rect x="93" y="28" width="22" height="28" rx="4" fill="rgba(92,14,28,0.4)" stroke="rgba(196,69,105,0.5)" strokeWidth="1"/>
              <rect x="98" y="16" width="12" height="16" rx="3" fill="rgba(196,69,105,0.6)" stroke="rgba(196,69,105,0.8)" strokeWidth="1"/>
              <rect x="93" y="155" width="22" height="50" rx="0" fill="rgba(139,26,46,0.25)"/>
              <rect x="90" y="100" width="28" height="18" rx="2" fill="rgba(245,230,232,0.08)" stroke="rgba(245,230,232,0.15)" strokeWidth="0.5"/>
            </g>
            {/* Bottle 3 - right */}
            <g opacity="0.65">
              <rect x="152" y="90" width="26" height="130" rx="6" fill="rgba(139,26,46,0.35)" stroke="rgba(196,69,105,0.45)" strokeWidth="1"/>
              <rect x="156" y="70" width="18" height="24" rx="3" fill="rgba(139,26,46,0.25)" stroke="rgba(196,69,105,0.35)" strokeWidth="1"/>
              <rect x="160" y="60" width="10" height="13" rx="2" fill="rgba(196,69,105,0.45)" stroke="rgba(196,69,105,0.55)" strokeWidth="1"/>
              <rect x="156" y="160" width="18" height="35" rx="0" fill="rgba(196,69,105,0.12)"/>
            </g>
            {/* Glow under bottles */}
            <ellipse cx="110" cy="225" rx="75" ry="8" fill="rgba(196,69,105,0.12)"/>
          </svg>

          <div className="wine-left-content">
            <h1 className="wine-tagline">
              Începe să-ți<br />
              construiești<br />
              <em>pivnița perfectă</em>
            </h1>
            <p className="wine-desc">Înregistrare gratuită · Fără card</p>
            <div className="feature-list">
              {["Cataloghează orice vin", "Notițe de degustare", "Statistici colecție", "Acces de pe orice dispozitiv"].map((f) => (
                <div className="feature-item" key={f}>
                  <div className="feature-dot" />
                  <span className="feature-text">{f}</span>
                </div>
              ))}
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

            <h2 className="form-title">Creează-ți contul</h2>
            <p className="form-subtitle">Pivnița ta digitală te așteaptă</p>

            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <label className="field-label">Nume complet</label>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Ion Popescu"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

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
                  placeholder="Minim 8 caractere"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <div className="pwd-strength">
                  {[0,1,2].map((i) => {
                    const len = form.password.length;
                    const strength = len === 0 ? -1 : len < 6 ? 0 : len < 10 ? 1 : 2;
                    const cls = i <= strength ? (strength === 0 ? "weak" : strength === 1 ? "medium" : "strong") : "";
                    return <div key={i} className={`pwd-bar ${cls}`} />;
                  })}
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Confirmă parola</label>
                <input
                  type="password"
                  className="field-input"
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading
                  ? <span><span className="spinner" />Se creează contul...</span>
                  : <span>Deschide pivnița</span>
                }
              </button>
            </form>

            <p className="terms-note">
              Creând un cont, ești de acord cu stocarea datelor tale în condiții de siguranță.
            </p>

            <div className="separator">
              <div className="sep-line" />
              <span className="sep-text">sau</span>
              <div className="sep-line" />
            </div>

            <div className="form-footer">
              <p>Ai deja cont? <Link href="/sign-in">Autentifică-te</Link></p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
