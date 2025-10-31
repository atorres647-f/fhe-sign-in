import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, Eip1193Provider } from 'ethers';

export interface WalletState {
  address: string | null;
  provider: BrowserProvider | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    provider: null,
    chainId: null,
    isConnecting: false,
    error: null,
  });

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setWalletState(prev => ({
        ...prev,
        error: 'Please install MetaMask wallet',
      }));
      return;
    }

    setWalletState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      let ethereum = window.ethereum as any;
      
      if (ethereum.providers?.length) {
        ethereum = ethereum.providers.find((p: any) => p.isMetaMask) || ethereum.providers[0];
      }
      
      if (!ethereum.isMetaMask) {
        setWalletState(prev => ({
          ...prev,
          isConnecting: false,
          error: 'Please use MetaMask wallet',
        }));
        return;
      }
      
      const provider = new BrowserProvider(ethereum as Eip1193Provider);
      
      await provider.send('eth_requestAccounts', []);
      const network = await provider.getNetwork();
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setWalletState({
        address,
        provider,
        chainId: Number(network.chainId),
        isConnecting: false,
        error: null,
      });
    } catch (error: any) {
      // User cancelled connection
      if (error.code === 4001 || error.message?.includes('rejected')) {
        setWalletState(prev => ({
          ...prev,
          isConnecting: false,
          error: null, // User cancellation is not an error
        }));
      } else {
        setWalletState(prev => ({
          ...prev,
          isConnecting: false,
          error: error.message || 'Failed to connect wallet',
        }));
      }
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletState({
      address: null,
      provider: null,
      chainId: null,
      isConnecting: false,
      error: null,
    });
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const ethereum = window.ethereum as Eip1193Provider & {
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else {
        connectWallet();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [connectWallet, disconnectWallet]);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
  };
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider & {
      isMetaMask?: boolean;
      providers?: Array<Eip1193Provider & { isMetaMask?: boolean }>;
    };
  }
}


