import { createInstance, SepoliaConfig, FhevmInstance, type FhevmInstanceConfig, generateKeypair, type EncryptionTypes } from "@zama-fhe/relayer-sdk/node";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers } from "ethers";

// Store keypairs per user address
const keypairCache = new Map<string, { publicKey: string; privateKey: string }>();

/**
 * Get or create a keypair for a user
 */
function getUserKeypair(userAddress: string): { publicKey: string; privateKey: string } {
  if (!keypairCache.has(userAddress)) {
    console.log(`[FHEVM SDK] Generating new keypair for user ${userAddress}...`);
    const keypair = generateKeypair();
    keypairCache.set(userAddress, keypair);
    console.log(`[FHEVM SDK] ✓ Keypair generated and cached`);
    console.log(`[FHEVM SDK]   Public Key: ${keypair.publicKey.substring(0, 20)}...`);
  } else {
    console.log(`[FHEVM SDK] Using cached keypair (user: ${userAddress})`);
  }
  return keypairCache.get(userAddress)!;
}

/**
 * Initialize FhevmInstance using Relayer SDK
 * @param hre Hardhat runtime environment
 * @returns FhevmInstance
 */
export async function initializeFhevm(hre: HardhatRuntimeEnvironment): Promise<FhevmInstance> {
  console.log("\n[FHEVM SDK] ========== SDK Initialization Start ==========");
  
  const { network } = hre;
  const chainId = network.config.chainId || 31337;
  
  console.log(`[FHEVM SDK] Detecting network configuration:`);
  console.log(`  - Network name: ${network.name}`);
  console.log(`  - Chain ID: ${chainId}`);

  // Check if we're running on Sepolia or use Sepolia config
  let config: FhevmInstanceConfig;
  
  if (chainId === 11155111) {
    // Sepolia network
    console.log(`[FHEVM SDK] Using Sepolia configuration`);
    config = SepoliaConfig;
    console.log(`[FHEVM SDK] Sepolia configuration details:`);
    console.log(`  - verifyingContractAddressDecryption: ${config.verifyingContractAddressDecryption}`);
    console.log(`  - verifyingContractAddressInputVerification: ${config.verifyingContractAddressInputVerification}`);
    console.log(`  - kmsContractAddress: ${config.kmsContractAddress}`);
    console.log(`  - inputVerifierContractAddress: ${config.inputVerifierContractAddress}`);
    console.log(`  - aclContractAddress: ${config.aclContractAddress}`);
    console.log(`  - gatewayChainId: ${config.gatewayChainId}`);
    console.log(`  - chainId: ${config.chainId}`);
  } else {
    // Local/hardhat network - use mock config
    console.log(`[FHEVM SDK] Using local/Mock configuration`);
    // For local development, we need to configure it differently
    // The plugin used to handle this automatically, but now we need to set it up manually
    config = {
      verifyingContractAddressDecryption: "0x0000000000000000000000000000000000000000",
      verifyingContractAddressInputVerification: "0x0000000000000000000000000000000000000000",
      kmsContractAddress: "0x0000000000000000000000000000000000000000",
      inputVerifierContractAddress: "0x0000000000000000000000000000000000000000",
      aclContractAddress: "0x0000000000000000000000000000000000000000",
      gatewayChainId: chainId,
      chainId: chainId,
      network: hre.network.name === "hardhat" ? "http://localhost:8545" : undefined,
    };
    console.log(`[FHEVM SDK] Mock configuration details:`);
    console.log(`  - gatewayChainId: ${config.gatewayChainId}`);
    console.log(`  - chainId: ${config.chainId}`);
    console.log(`  - network: ${config.network || "undefined"}`);
  }

  console.log(`\n[FHEVM SDK] ========== SDK Loading Phase ==========`);
  console.log(`[FHEVM SDK] Note: In Node.js environment, createInstance() automatically loads required WASM modules`);
  console.log(`[FHEVM SDK] (Frontend needs to call initSDK() first to load WASM, Node.js handles it automatically)`);
  
  const createStartTime = Date.now();
  console.log(`[FHEVM SDK] Creating FhevmInstance...`);
  console.log(`[FHEVM SDK] Calling createInstance(config)...`);
  console.log(`[FHEVM SDK]   - This step loads FHE WASM modules (if not already loaded)`);
  console.log(`[FHEVM SDK]   - Initializes FHE runtime environment`);
  console.log(`[FHEVM SDK]   - Sets network configuration and contract addresses`);
  
  const instance = await createInstance(config);
  const createDuration = Date.now() - createStartTime;
  
  console.log(`[FHEVM SDK] ✓ FhevmInstance created successfully! (Time: ${createDuration}ms)`);
  console.log(`[FHEVM SDK] ========== SDK Loading Complete ==========`);
  
  console.log(`\n[FHEVM SDK] ========== Instance Information ==========`);
  console.log(`[FHEVM SDK] Instance type: ${instance.constructor.name}`);
  console.log(`[FHEVM SDK] Instance is ready to use`);
  console.log(`[FHEVM SDK] Available methods: createEncryptedInput, userDecrypt, createEIP712, etc.`);
  console.log(`[FHEVM SDK] ========== SDK Initialization Complete ==========\n`);

  return instance;
}

/**
 * Check if running in mock environment (local hardhat network)
 */
export function isMockEnvironment(hre: HardhatRuntimeEnvironment): boolean {
  const chainId = hre.network.config.chainId || 31337;
  return chainId === 31337 && hre.network.name === "hardhat";
}

/**
 * Decrypt an encrypted uint value (similar to plugin's userDecryptEuint)
 * @param fhevmInstance FhevmInstance instance
 * @param type Encryption type (8, 16, 32, 64, 128, 256)
 * @param encryptedValue Encrypted value as hex string
 * @param contractAddress Contract address
 * @param signer Signer instance
 * @returns Decrypted value as bigint
 */
export async function userDecryptEuint(
  fhevmInstance: FhevmInstance,
  type: EncryptionTypes,
  encryptedValue: string,
  contractAddress: string,
  signer: HardhatEthersSigner | ethers.Signer,
): Promise<bigint> {
  console.log(`[FHEVM SDK] ========== Decryption Process Start ==========`);
  
  const userAddress = await signer.getAddress();
  console.log(`[FHEVM SDK] User address: ${userAddress}`);
  console.log(`[FHEVM SDK] Contract address: ${contractAddress}`);
  console.log(`[FHEVM SDK] Encryption type: euint${type}`);
  
  const keypair = getUserKeypair(userAddress);
  
  // Get chain ID from the signer's provider
  const provider = signer.provider;
  if (!provider) {
    throw new Error("Signer must have a provider");
  }
  const network = await provider.getNetwork();
  const chainId = Number(network.chainId);
  console.log(`[FHEVM SDK] Chain ID: ${chainId}`);
  
  // Create EIP712 signature for decryption permission
  const startTimestamp = Math.floor(Date.now() / 1000).toString();
  const durationDays = '10'; // String for consistency
  const contractAddresses = [contractAddress];
  
  console.log(`[FHEVM SDK] Creating EIP712 signature structure...`);
  console.log(`[FHEVM SDK]   - Start timestamp: ${startTimestamp}`);
  console.log(`[FHEVM SDK]   - Duration (days): ${durationDays}`);
  
  const eip712 = fhevmInstance.createEIP712(
    keypair.publicKey,
    contractAddresses,
    startTimestamp,
    durationDays,
  );
  
  console.log(`[FHEVM SDK] Signing EIP712 message with user private key...`);
  // Sign the EIP712 message
  // Only include UserDecryptRequestVerification type (not EIP712Domain)
  const signature = await signer.signTypedData(
    eip712.domain,
    {
      UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
    },
    eip712.message,
  );
  console.log(`[FHEVM SDK] ✓ EIP712 signature completed`);
  
  // Use ciphertextHandle as string (not bytes)
  const ciphertextHandle = encryptedValue;
  console.log(`[FHEVM SDK] Preparing decryption parameters...`);
  console.log(`[FHEVM SDK]   Parameters:`);
  console.log(`[FHEVM SDK]     - ciphertextHandle: ${ciphertextHandle.substring(0, 40)}...`);
  console.log(`[FHEVM SDK]     - contractAddress: ${contractAddress}`);
  console.log(`[FHEVM SDK]     - userAddress: ${userAddress}`);
  
  // Call userDecrypt with handleContractPairs format
  const handleContractPairs = [
    {
      handle: ciphertextHandle,
      contractAddress: contractAddress,
    },
  ];
  
  console.log(`[FHEVM SDK] Calling userDecrypt for decryption...`);
  const results = await fhevmInstance.userDecrypt(
    handleContractPairs,
    keypair.privateKey,
    keypair.publicKey,
    signature.replace('0x', ''),
    contractAddresses,
    userAddress,
    startTimestamp,
    durationDays,
  );
  
  console.log(`[FHEVM SDK] ✓ Decryption request completed, received result`);
  
  // Debug: Print all decryption results
  console.log(`[FHEVM SDK] All decryption results:`);
  console.log(`[FHEVM SDK]   - Result count: ${Object.keys(results).length}`);
  for (const [key, value] of Object.entries(results)) {
    console.log(`[FHEVM SDK]   - Handle: ${key.substring(0, 40)}... => Value: ${value}`);
  }
  
  // Extract the decrypted value from results using ciphertextHandle as key
  // Results is a Record<string, bigint | boolean | string>
  const decryptedValue = results[ciphertextHandle];
  if (decryptedValue === undefined) {
    console.error(`[FHEVM SDK] ✗ Error: Decryption result not found for handle ${ciphertextHandle.substring(0, 40)}...`);
    console.error(`[FHEVM SDK] Available handle list:`);
    for (const key of Object.keys(results)) {
      console.error(`[FHEVM SDK]   - ${key.substring(0, 40)}...`);
    }
    throw new Error(`No decrypted value found for handle: ${ciphertextHandle.substring(0, 40)}...`);
  }
  let result: bigint;
  
  if (typeof decryptedValue === "bigint") {
    result = decryptedValue;
  } else if (typeof decryptedValue === "string") {
    result = BigInt(decryptedValue);
  } else if (typeof decryptedValue === "boolean") {
    result = decryptedValue ? BigInt(1) : BigInt(0);
  } else {
    throw new Error(`Unexpected decrypted value type: ${typeof decryptedValue}`);
  }
  
  console.log(`[FHEVM SDK] ✓ Decryption successful! Result: ${result}`);
  console.log(`[FHEVM SDK] ========== Decryption Process Complete ==========\n`);
  
  return result;
}

