export default function WinePourLoader({ label = "Se încarcă imaginea..." }) {
  return (
    <div className="wine-pour-loader" role="status" aria-label={label}>
      <div className="wine-pour-scene" aria-hidden="true">
        <div className="wine-bottle">
          <div className="wine-bottle-neck" />
          <div className="wine-bottle-body" />
        </div>
        <div className="wine-stream" />
        <div className="wine-glass">
          <div className="wine-glass-bowl">
            <div className="wine-glass-liquid" />
          </div>
          <div className="wine-glass-stem" />
          <div className="wine-glass-foot" />
        </div>
      </div>
      <span className="wine-pour-label">{label}</span>
      <style>{`
        .wine-pour-loader {
          position: absolute;
          inset: 0;
          z-index: 4;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.55rem;
          background: rgba(13, 6, 8, 0.88);
          color: rgba(245, 230, 232, 0.7);
        }
        .wine-pour-scene { position: relative; width: 112px; height: 92px; }
        .wine-bottle {
          position: absolute;
          top: 14px;
          left: 17px;
          width: 42px;
          height: 62px;
          transform: rotate(-34deg);
          transform-origin: 80% 20%;
          animation: wine-pour-tilt 1.8s ease-in-out infinite;
          filter: drop-shadow(0 5px 8px rgba(0, 0, 0, 0.35));
        }
        .wine-bottle-body {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 38px;
          height: 46px;
          border-radius: 9px 9px 7px 7px;
          background: linear-gradient(90deg, #350912, #8b1a2e 55%, #4b0d19);
          border: 1px solid rgba(245, 230, 232, 0.25);
        }
        .wine-bottle-neck {
          position: absolute;
          top: 0;
          right: 4px;
          width: 14px;
          height: 29px;
          border-radius: 4px 4px 1px 1px;
          background: #5c1020;
          border: 1px solid rgba(245, 230, 232, 0.2);
        }
        .wine-stream {
          position: absolute;
          top: 17px;
          left: 65px;
          width: 3px;
          height: 38px;
          border-radius: 50%;
          background: #c44569;
          transform: rotate(-4deg);
          transform-origin: top;
          animation: wine-pour-stream 1.8s ease-in-out infinite;
          box-shadow: 0 0 7px rgba(196, 69, 105, 0.7);
        }
        .wine-glass { position: absolute; right: 9px; bottom: 2px; width: 42px; height: 68px; }
        .wine-glass-bowl {
          position: absolute;
          top: 0;
          left: 2px;
          width: 36px;
          height: 43px;
          overflow: hidden;
          border: 1px solid rgba(245, 230, 232, 0.65);
          border-top: 2px solid rgba(245, 230, 232, 0.8);
          border-radius: 4px 4px 18px 18px;
          background: rgba(245, 230, 232, 0.05);
        }
        .wine-glass-liquid {
          position: absolute;
          right: 0;
          bottom: 0;
          left: 0;
          height: 14px;
          background: linear-gradient(#c44569, #8b1a2e);
          animation: wine-pour-fill 1.8s ease-in-out infinite;
        }
        .wine-glass-stem { position: absolute; top: 42px; left: 20px; width: 2px; height: 19px; background: rgba(245, 230, 232, 0.65); }
        .wine-glass-foot { position: absolute; bottom: 0; left: 9px; width: 24px; height: 2px; border-radius: 50%; background: rgba(245, 230, 232, 0.65); }
        .wine-pour-label { font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase; }
        @keyframes wine-pour-tilt { 0%, 100% { transform: rotate(-30deg); } 50% { transform: rotate(-39deg); } }
        @keyframes wine-pour-stream { 0%, 18%, 82%, 100% { opacity: 0; transform: scaleY(0.35) rotate(-4deg); } 32%, 68% { opacity: 1; transform: scaleY(1) rotate(-4deg); } }
        @keyframes wine-pour-fill { 0%, 18% { height: 8px; } 68%, 100% { height: 18px; } }
        @media (prefers-reduced-motion: reduce) {
          .wine-bottle, .wine-stream, .wine-glass-liquid { animation: none; }
        }
      `}</style>
    </div>
  );
}
