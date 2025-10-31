import { useState, useEffect, useCallback, useMemo } from 'react';
import { Wallet, TrendingUp } from 'lucide-react';
import './App.css';
import { useWallet } from './hooks/useWallet';
import { useContract, CONTRACT_ADDRESS } from './hooks/useContract';
import { useRelayerSDK } from './hooks/useRelayerSDK';
import { SignInButton } from './components/SignInButton';
import { DecryptPanel } from './components/DecryptPanel';
import { Calendar } from './components/Calendar';
import { Tutorial } from './components/Tutorial';

function App() {
  const wallet = useWallet();
  const contract = useContract(wallet.provider, wallet.address);
  const relayerSDK = useRelayerSDK(wallet.provider);
  
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInSuccess, setSignInSuccess] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedCount, setDecryptedCount] = useState<number | null>(null);
  const [hasDecrypted, setHasDecrypted] = useState(false);
  const [signedDates, setSignedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!wallet.address) return;
    
    const storageKey = `signedDates_${wallet.address}`;
    const savedDates = localStorage.getItem(storageKey);
    if (savedDates) {
      try {
        const datesArray = JSON.parse(savedDates);
        setSignedDates(new Set(datesArray));
      } catch (err) {
        console.error('Failed to load signed dates:', err);
      }
    }
  }, [wallet.address]);
  const saveSignedDate = useCallback((date: string) => {
    if (!wallet.address) return;
    
    const storageKey = `signedDates_${wallet.address}`;
    setSignedDates(prevDates => {
      const updatedDates = new Set(prevDates);
      updatedDates.add(date);
      
      localStorage.setItem(storageKey, JSON.stringify(Array.from(updatedDates)));
      
      return updatedDates;
    });
  }, [wallet.address]);

  const loadSignInCounter = useCallback(async () => {
    if (!contract.isReady || !wallet.address) return;

    try {
      // Cannot get unencrypted counter value directly
      // Only available after decryption
    } catch (err: any) {
      console.error('Failed to load sign-in counter:', err);
    }
  }, [contract, wallet.address]);

  useEffect(() => {
    loadSignInCounter();
  }, [loadSignInCounter]);

  const handleSignIn = useCallback(async () => {
    if (!wallet.address || !contract.isReady || !relayerSDK.isInitialized) {
      return;
    }

    // Check if already signed in today
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (signedDates.has(todayStr)) {
      alert('You have already signed in today!');
      return;
    }

    if (isSigningIn) {
      return;
    }

    setIsSigningIn(true);
    setSignInSuccess(false);

    try {
      console.log('🔐 Encrypting increment value...');
      const encrypted = await relayerSDK.createEncryptedValue(
        CONTRACT_ADDRESS,
        wallet.address,
        1
      );

      console.log('📝 Calling contract sign-in...');
      const { receipt } = await contract.signIn(
        encrypted.handles[0],
        encrypted.inputProof
      );

      if (receipt && receipt.status === 1) {
        setSignInSuccess(true);
        setDecryptedCount(null);
        setHasDecrypted(false);
        
        saveSignedDate(todayStr);
        
        setTimeout(() => setSignInSuccess(false), 3000);
      } else {
        throw new Error('Transaction failed');
      }
    } catch (err: any) {
      if (err.message === 'USER_CANCELLED') {
        console.log('User cancelled transaction');
        return;
      } else {
        console.error('❌ Sign-in failed:', err);
        alert(`Sign-in failed: ${err.message}`);
      }
    } finally {
      setIsSigningIn(false);
    }
  }, [wallet.address, contract, relayerSDK, isSigningIn, signedDates, saveSignedDate]);

  const handleDecrypt = useCallback(async () => {
    if (!wallet.address || !contract.isReady || !relayerSDK.isInitialized) {
      return;
    }

    setIsDecrypting(true);
    setDecryptedCount(null);
    setHasDecrypted(false);

    try {
      const encryptedCounter = await contract.getMySignInCounter();
      
      const count = await relayerSDK.decryptValue(
        encryptedCounter,
        CONTRACT_ADDRESS,
        wallet.address!
      );

      setDecryptedCount(Number(count));
      setHasDecrypted(true);
    } catch (err: any) {
      console.error('❌ Decryption failed:', err);
      alert(`Decryption failed: ${err.message}`);
      setHasDecrypted(false);
    } finally {
      setIsDecrypting(false);
    }
  }, [wallet.address, contract, relayerSDK]);

  // Calculate network name and sign-in status at the top level (before any returns)
  const networkName = wallet.chainId === 31337 ? 'Localhost' : 
                       wallet.chainId === 11155111 ? 'Sepolia' : 
                       `Chain ${wallet.chainId}`;

  // Check if already signed in today
  const isAlreadySignedToday = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return signedDates.has(todayStr);
  }, [signedDates]);

  if (!wallet.address) {
    return (
      <div className="app">
        <div className="header">
          <div className="header-content">
            <div className="logo">
              <TrendingUp className="logo-icon" size={32} />
              <span>FHE Sign-In System</span>
            </div>
          </div>
        </div>
        <div className="main-content wallet-connect-container">
          <div className="wallet-connect-content">
            <h1 className="wallet-connect-title">
              Welcome to FHE Sign-In System
            </h1>
            <p className="wallet-connect-description">
              Please connect your wallet to get started
            </p>
            {wallet.error && (
              <div className="error" style={{ marginBottom: '1.5rem' }}>
                {wallet.error}
              </div>
            )}
            <button
              className="btn btn-primary wallet-connect-btn"
              onClick={wallet.connectWallet}
              disabled={wallet.isConnecting}
            >
              <Wallet size={22} />
              {wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="header">
        <div className="header-content">
            <div className="logo">
              <TrendingUp className="logo-icon" size={32} />
              <span>FHE Sign-In System</span>
            </div>
          <div className="wallet-section">
            <div className="wallet-info">
              <div className="wallet-address">
                {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
              </div>
              <div className="badge-container">
                <div className="network-badge">{networkName}</div>
                {relayerSDK.error && (
                  <div className="network-badge error-badge">
                    SDK Error
                  </div>
                )}
                {!relayerSDK.isInitialized && !relayerSDK.error && (
                  <div className="network-badge initializing-badge">
                    SDK Initializing...
                  </div>
                )}
                {relayerSDK.isInitialized && !relayerSDK.error && (
                  <div className="network-badge success-badge">
                    SDK Ready
                  </div>
                )}
              </div>
            </div>
            <button className="btn btn-secondary" onClick={wallet.disconnectWallet}>
              Disconnect
            </button>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="center-panel">
          <div className="card calendar-card">
            <Calendar signedDates={signedDates} />
          </div>
          
          <div className="card signin-card">
            <SignInButton
              onSignIn={handleSignIn}
              isLoading={isSigningIn}
              isDisabled={!contract.isReady || !relayerSDK.isInitialized || isAlreadySignedToday}
            />
            
            {signInSuccess && (
              <div className="success" style={{ marginTop: '1rem' }}>
                ✅ Sign-in successful! Counter updated
              </div>
            )}
            
            {contract.error && (
              <div className="error" style={{ marginTop: '1rem' }}>
                {contract.error}
              </div>
            )}
          </div>
        </div>

        <div className="right-panel">
          <DecryptPanel
            onDecrypt={handleDecrypt}
            isLoading={isDecrypting}
            decryptedCount={decryptedCount}
            hasDecrypted={hasDecrypted}
          />
          
          <div style={{ marginTop: '1.5rem' }}>
            <Tutorial />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

