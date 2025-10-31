import { Lock, Unlock, Loader } from 'lucide-react';
import './DecryptPanel.css';

interface DecryptPanelProps {
  onDecrypt: () => Promise<void>;
  isLoading: boolean;
  decryptedCount: number | null;
  hasDecrypted: boolean;
}

export function DecryptPanel({
  onDecrypt,
  isLoading,
  decryptedCount,
  hasDecrypted,
}: DecryptPanelProps) {
  return (
    <div className="decrypt-panel card">
      <h3 className="panel-title">Sign-In Statistics</h3>
      
      <div className="stats-grid">
        <div className="stat-item glass-container">
          {hasDecrypted && decryptedCount !== null ? (
            <div className="stat-content">
              <div className="stat-label">Sign-In Count</div>
              <div className="stat-value highlight">{decryptedCount}</div>
            </div>
          ) : (
            <div className="stat-content glass-blur">
              <div className="stat-label">Sign-In Count</div>
              <div className="stat-value glass-text">
                <Lock size={20} style={{ marginRight: '0.5rem' }} />
                <span>Data Encrypted</span>
              </div>
              <div className="glass-overlay">
                <div className="glass-pattern"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <button
        className="decrypt-btn"
        onClick={onDecrypt}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader size={18} className="spin" />
            <span>Decrypting...</span>
          </>
        ) : (
          <>
            <Unlock size={18} />
            <span>{hasDecrypted ? 'Decrypt Again' : 'Decrypt Sign-In Counter'}</span>
          </>
        )}
      </button>

      {hasDecrypted && decryptedCount !== null && (
        <div className="success-message">
          ✅ Decryption successful! Current sign-in count: {decryptedCount}
        </div>
      )}
    </div>
  );
}

