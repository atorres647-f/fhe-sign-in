import { BookOpen, Lock } from 'lucide-react';
import './Tutorial.css';

export function Tutorial() {
  return (
    <div className="tutorial-card">
      <div className="tutorial-header">
        <BookOpen className="tutorial-icon" size={20} />
        <h3>Tutorial</h3>
      </div>
      
      <div className="tutorial-content">
        <div className="tutorial-step">
          <div className="step-number">1</div>
          <div className="step-content">
            <h4>Connect Wallet</h4>
            <p>Click the connect wallet button in the top right corner, select your wallet and authorize the connection</p>
          </div>
        </div>
        
        <div className="tutorial-step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h4>View Calendar</h4>
            <p>View your sign-in records in the calendar. Signed dates will show a green marker</p>
          </div>
        </div>
        
        <div className="tutorial-step">
          <div className="step-number">3</div>
          <div className="step-content">
            <h4>Daily Sign-In</h4>
            <p>Click the sign-in button below the calendar to complete daily sign-in. Sign-in count is stored encrypted</p>
          </div>
        </div>
        
        <div className="tutorial-step">
          <div className="step-number">4</div>
          <div className="step-content">
            <h4>View Statistics</h4>
            <p>Click the "Decrypt Sign-In Counter" button to view your total sign-in count (requires decryption)</p>
          </div>
        </div>
        
        <div className="tutorial-note">
          <Lock size={16} />
          <span>All sign-in data is protected by Fully Homomorphic Encryption (FHE) to ensure privacy and security</span>
        </div>
      </div>
    </div>
  );
}

