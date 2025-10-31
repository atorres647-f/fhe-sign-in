import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider } from 'ethers';

// Define global Relayer SDK types
declare global {
  interface Window {
    [key: string]: any;
    RelayerSDK?: any;
    relayerSDK?: any;
  }
  
  interface ImportMeta {
    env: {
      VITE_GATEWAY_URL?: string;
      [key: string]: any;
    };
  }
}

// Smart SDK search - prioritize common UMD global variable names
const findSDKGlobal = (): any => {
  // UMD approach typically mounts SDK to window object
  // Possible global variable names:
  const possibleNames = [
    'RelayerSDK',      // Most likely UMD global variable name
    'relayerSDK',
    'RelayerSDKJS',
    'relayerSDKJS',
    'FhevmSDK',
    'ZamaSDK',
    'fhevmjs',
    'fhevm',
    'FHEVM',
  ];

  // First try to directly find possible global variable names
  for (const name of possibleNames) {
    const sdk = window[name];
    if (sdk && typeof sdk === 'object' && 
        typeof sdk.initSDK === 'function' && 
        typeof sdk.createInstance === 'function') {
      console.log(`✅ Found SDK global variable: window.${name}`);
      return sdk;
    }
  }

  // If not found above, iterate through window object
  for (const key in window) {
    try {
      const obj = window[key];
      if (obj && typeof obj === 'object' && 
          typeof obj.initSDK === 'function' && 
          typeof obj.createInstance === 'function') {
        console.log(`✅ Found SDK: window.${key}`);
        return obj;
      }
    } catch (e) {
      // Ignore access errors (some properties may not be accessible)
    }
  }

  console.error('❌ SDK global variable not found');
  console.log('Please ensure SDK is loaded via CDN: https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs');
  return null;
};

interface FhevmConfig {
  network: any;
  networkUrl?: string;
  gatewayUrl?: string;
  aclAddress?: string;
  kmsVerifierAddress?: string;
}

interface Keypair {
  publicKey: string;
  privateKey: string;
}

interface EIP712 {
  domain: any;
  types: any;
  message: any;
}

interface HandleContractPair {
  handle: string;
  contractAddress: string;
}

interface FhevmInstance {
  createEncryptedInput(contractAddress: string, userAddress: string): EncryptedInputBuilder;
  generateKeypair(): Keypair;
  createEIP712(
    publicKey: string,
    contractAddresses: string[],
    startTimeStamp: string,
    durationDays: string
  ): EIP712;
  userDecrypt(
    handleContractPairs: HandleContractPair[],
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimeStamp: string,
    durationDays: string
  ): Promise<Record<string, bigint>>;
}

interface EncryptedInputBuilder {
  add32(value: number): EncryptedInputBuilder;
  add64(value: number | bigint): EncryptedInputBuilder;
  addAddress(address: string): EncryptedInputBuilder;
  addBool(value: boolean): EncryptedInputBuilder;
  encrypt(): Promise<{
    handles: string[];
    inputProof: string;
  }>;
}

export function useRelayerSDK(provider: BrowserProvider | null) {
  const [fhevmInstance, setFhevmInstance] = useState<FhevmInstance | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initFhevm = async () => {
      if (!provider) return;
      
      // Wait for SDK to finish loading
      // UMD scripts may load asynchronously on page load, need to wait
      let SDK = findSDKGlobal();
      let retries = 0;
      const maxRetries = 10;
      
      while (!SDK && retries < maxRetries) {
        console.log(`Waiting for SDK to load... (${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 500));
        SDK = findSDKGlobal();
        retries++;
      }
      
      if (!SDK) {
        setError('SDK not found. Please ensure Relayer SDK is loaded via CDN.');
        return;
      }

      try {
        // Step 1: Initialize SDK (load WASM)
        console.log('🔄 Initializing SDK (loading WASM)...');
        await SDK.initSDK();
        console.log('✅ SDK initialized');

        // Step 2: Get network info
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);

        // Step 3: Configure network
        let config: FhevmConfig;

        // Get MetaMask provider
        let ethereum = window.ethereum;
        
        if (ethereum && (ethereum as any).providers?.length) {
          ethereum = (ethereum as any).providers.find((p: any) => p.isMetaMask) || ethereum;
        }
        
        if (!ethereum || !(ethereum as any).isMetaMask) {
          throw new Error('Please use MetaMask wallet');
        }

        if (chainId === 31337) {
          // Local Hardhat network config
          config = {
            network: ethereum,
          };
        } else if (chainId === 11155111) {
          // Sepolia testnet config
          const SepoliaConfig = SDK.SepoliaConfig;
          
          if (!SepoliaConfig) {
            throw new Error('SDK does not provide Sepolia config, please check SDK version');
          }
          
          config = {
            ...SepoliaConfig,
            network: ethereum,
          };
          
          if (!(config as any).gatewayUrl) {
            if (import.meta.env.VITE_GATEWAY_URL) {
              (config as any).gatewayUrl = import.meta.env.VITE_GATEWAY_URL;
            }
          }
        } else {
          throw new Error(`Unsupported network: Chain ID ${chainId}`);
        }

        // Step 4: Create FHEVM instance (60 second timeout)
        console.log('🔄 Creating FHEVM instance...');
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Instance creation timeout (60 seconds)')), 60000);
        });
        
        const instance = await Promise.race([
          SDK.createInstance(config),
          timeoutPromise
        ]);
        
        if (!instance) {
          throw new Error('Instance creation failed');
        }
        
        setFhevmInstance(instance);
        setIsInitialized(true);
        setError(null);
        console.log('✅ FHEVM instance created successfully');
      } catch (err: any) {
        console.error('❌ FHEVM initialization failed:', err);
        setError(err.message || 'Initialization failed');
        setIsInitialized(false);
      }
    };

    initFhevm();
  }, [provider]);

  const createEncryptedValue = useCallback(
    async (contractAddress: string, userAddress: string, value: number) => {
      if (!fhevmInstance || !isInitialized) {
        throw new Error('FHEVM instance not initialized');
      }

      try {
        console.log(`🔐 Encrypting value: ${value}`);
        const input = fhevmInstance.createEncryptedInput(contractAddress, userAddress);
        const encrypted = await input.add32(value).encrypt();
        console.log('✅ Encryption successful');
        return encrypted;
      } catch (err: any) {
        console.error('❌ Encryption failed:', err);
        throw new Error(err.message || 'Encryption failed');
      }
    },
    [fhevmInstance, isInitialized]
  );

  // Maintain backward compatibility
  const createEncryptedTimestamp = createEncryptedValue;

  const decryptValue = useCallback(
    async (handle: string, contractAddress: string, userAddress: string): Promise<bigint> => {
      if (!fhevmInstance || !isInitialized) {
        throw new Error('FHEVM instance not initialized');
      }

      if (!provider) {
        throw new Error('Provider not initialized');
      }

      try {
        console.log(`🔓 Starting decryption...`);
        
        // Step 1: Generate keypair
        const keypair = fhevmInstance.generateKeypair();
        
        // Step 2: Prepare decryption parameters
        const handleContractPairs: HandleContractPair[] = [{
          handle: handle,
          contractAddress: contractAddress,
        }];
        
        const startTimeStamp = Math.floor(Date.now() / 1000).toString();
        const durationDays = '10';
        const contractAddresses = [contractAddress];
        
        // Step 3: Create EIP712 signature request
        const eip712 = fhevmInstance.createEIP712(
          keypair.publicKey,
          contractAddresses,
          startTimeStamp,
          durationDays
        );
        
        // Step 4: Get signer and sign
        const signer = await provider.getSigner();
        const signature = await signer.signTypedData(
          eip712.domain,
          { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
          eip712.message
        );
        
        // Step 5: Call userDecrypt to decrypt
        const result = await fhevmInstance.userDecrypt(
          handleContractPairs,
          keypair.privateKey,
          keypair.publicKey,
          signature.replace('0x', ''),
          contractAddresses,
          userAddress,
          startTimeStamp,
          durationDays
        );
        
        const decryptedValue = result[handle];
        console.log('✅ Decryption successful:', decryptedValue);
        
        return decryptedValue;
      } catch (err: any) {
        console.error('❌ Decryption failed:', err);
        throw new Error(err.message || 'Decryption failed');
      }
    },
    [fhevmInstance, isInitialized, provider]
  );

  return {
    fhevmInstance,
    isInitialized,
    error,
    createEncryptedTimestamp,
    createEncryptedValue,
    decryptValue,
  };
}

