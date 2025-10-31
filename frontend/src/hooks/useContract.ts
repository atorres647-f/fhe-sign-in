import { useState, useEffect, useCallback } from 'react';
import { Contract, BrowserProvider } from 'ethers';

// Sepolia testnet contract address
export const CONTRACT_ADDRESS = '0x1B1eB7a176269e2Fd1949201d133896648bD5913';

// Contract ABI
const CONTRACT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "SignIn",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "getMySignInCounter",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserSignInCounter",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "protocolId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "externalEuint32",
        "name": "increment",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "incrementProof",
        "type": "bytes"
      }
    ],
    "name": "signIn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export function useContract(provider: BrowserProvider | null, address: string | null) {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (provider && address) {
      const initContract = async () => {
        try {
          const signer = await provider.getSigner();
          const signInContract = new Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            signer
          );
          
          setContract(signInContract);
          setIsReady(true);
        } catch (err: any) {
          setError(err.message);
          setIsReady(false);
        }
      };
      initContract();
    } else {
      setContract(null);
      setIsReady(false);
    }
  }, [provider, address]);

  const signIn = useCallback(async (
    encryptedIncrement: string,
    proof: string
  ) => {
    if (!contract) throw new Error('Contract not initialized');
    setLoading(true);
    setError(null);
    try {
      const tx = await contract.signIn(encryptedIncrement, proof);
      const receipt = await tx.wait();
      return { tx, receipt };
    } catch (err: any) {
      // User cancelled transaction - throw immediately, don't continue
      if (err.code === 4001 || err.message?.includes('rejected') || err.message?.includes('User denied')) {
        setError(null);
        throw new Error('USER_CANCELLED');
      }
      const message = err.reason || err.message || 'Sign-in failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [contract]);

  const getUserSignInCounter = useCallback(async (userAddress: string): Promise<string> => {
    if (!contract) throw new Error('Contract not initialized');
    try {
      return await contract.getUserSignInCounter(userAddress);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to get sign-in counter');
    }
  }, [contract]);

  const getMySignInCounter = useCallback(async (): Promise<string> => {
    if (!contract) throw new Error('Contract not initialized');
    try {
      return await contract.getMySignInCounter();
    } catch (err: any) {
      throw new Error(err.message || 'Failed to get sign-in counter');
    }
  }, [contract]);

  return {
    contract,
    loading,
    error,
    isReady,
    signIn,
    getUserSignInCounter,
    getMySignInCounter,
  };
}

