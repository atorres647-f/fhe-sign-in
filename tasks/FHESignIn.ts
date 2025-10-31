import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";
import { initializeFhevm, userDecryptEuint } from "../utils/fhevm";

/**
 * Tutorial: Deploy and Interact Locally (--network localhost)
 * ===========================================================
 *
 * 1. From a separate terminal window:
 *
 *   npx hardhat node
 *
 * 2. Deploy the FHESignIn contract
 *
 *   npx hardhat --network localhost deploy
 *
 * 3. Interact with the FHESignIn contract
 *
 *   npx hardhat --network localhost task:sign-in
 *   npx hardhat --network localhost task:get-sign-in-count
 *   npx hardhat --network localhost task:decrypt-timestamp --index 0
 *
 *
 * Tutorial: Deploy and Interact on Sepolia (--network sepolia)
 * ===========================================================
 *
 * 1. Deploy the FHESignIn contract
 *
 *   npx hardhat --network sepolia deploy
 *
 * 2. Interact with the FHESignIn contract
 *
 *   npx hardhat --network sepolia task:sign-in
 *   npx hardhat --network sepolia task:get-sign-in-count
 *   npx hardhat --network sepolia task:decrypt-timestamp --index 0
 *
 */

/**
 * Example:
 *   - npx hardhat --network localhost task:address
 *   - npx hardhat --network sepolia task:address
 */
task("task:address", "Prints the FHESignIn address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;

  const fheSignIn = await deployments.get("FHESignIn");

  console.log("FHESignIn address is " + fheSignIn.address);
});

/**
 * Example:
 *   - npx hardhat --network localhost task:sign-in
 *   - npx hardhat --network sepolia task:sign-in
 */
task("task:sign-in", "Signs in with the current timestamp")
  .addOptionalParam("address", "Optionally specify the FHESignIn contract address")
  .addOptionalParam("user", "Optionally specify the user address (default: first signer)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const fhevmInstance = await initializeFhevm(hre);

    const FHESignInDeployement = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("FHESignIn");
    console.log(`FHESignIn: ${FHESignInDeployement.address}`);

    const signers = await ethers.getSigners();
    const user = taskArguments.user
      ? await ethers.getSigner(taskArguments.user)
      : signers[0];
    console.log(`User: ${user.address}`);

    const fheSignInContract = await ethers.getContractAt("FHESignIn", FHESignInDeployement.address);

    // Get current Unix timestamp (seconds since epoch)
    const currentTimestamp = Math.floor(Date.now() / 1000);
    console.log(`Current timestamp: ${currentTimestamp}`);

    // Encrypt the timestamp
    const encryptedTimestamp = await fhevmInstance
      .createEncryptedInput(FHESignInDeployement.address, user.address)
      .add32(currentTimestamp)
      .encrypt();

    const tx = await fheSignInContract
      .connect(user)
      .signIn(encryptedTimestamp.handles[0], encryptedTimestamp.inputProof);
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    console.log(`FHESignIn signIn() succeeded!`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:get-sign-in-count
 *   - npx hardhat --network sepolia task:get-sign-in-count
 */
task("task:get-sign-in-count", "Gets the sign-in count for a user")
  .addOptionalParam("address", "Optionally specify the FHESignIn contract address")
  .addOptionalParam("user", "Optionally specify the user address (default: first signer)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const FHESignInDeployement = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("FHESignIn");
    console.log(`FHESignIn: ${FHESignInDeployement.address}`);

    const signers = await ethers.getSigners();
    const user = taskArguments.user
      ? await ethers.getSigner(taskArguments.user)
      : signers[0];
    console.log(`User: ${user.address}`);

    const fheSignInContract = await ethers.getContractAt("FHESignIn", FHESignInDeployement.address);

    const count = await fheSignInContract.getUserSignInCount(user.address);
    console.log(`Sign-in count: ${count}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:decrypt-timestamp --index 0
 *   - npx hardhat --network sepolia task:decrypt-timestamp --index 0
 */
task("task:decrypt-timestamp", "Decrypts a sign-in timestamp at a specific index")
  .addOptionalParam("address", "Optionally specify the FHESignIn contract address")
  .addOptionalParam("user", "Optionally specify the user address (default: first signer)")
  .addParam("index", "The index of the sign-in record to decrypt")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const index = parseInt(taskArguments.index);
    if (!Number.isInteger(index) || index < 0) {
      throw new Error(`Argument --index must be a non-negative integer`);
    }

    const fhevmInstance = await initializeFhevm(hre);

    const FHESignInDeployement = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("FHESignIn");
    console.log(`FHESignIn: ${FHESignInDeployement.address}`);

    const signers = await ethers.getSigners();
    const user = taskArguments.user
      ? await ethers.getSigner(taskArguments.user)
      : signers[0];
    console.log(`User: ${user.address}`);

    const fheSignInContract = await ethers.getContractAt("FHESignIn", FHESignInDeployement.address);

    const encryptedTimestamp = await fheSignInContract.getUserSignInTimestamp(user.address, index);
    console.log(`Encrypted timestamp: ${encryptedTimestamp}`);

    const decryptedTimestamp = await userDecryptEuint(
      fhevmInstance,
      32,
      encryptedTimestamp,
      FHESignInDeployement.address,
      user,
    );
    console.log(`Decrypted timestamp: ${decryptedTimestamp}`);
    console.log(`Date: ${new Date(Number(decryptedTimestamp) * 1000).toISOString()}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:get-all-timestamps
 *   - npx hardhat --network sepolia task:get-all-timestamps
 */
task("task:get-all-timestamps", "Decrypts all sign-in timestamps for a user")
  .addOptionalParam("address", "Optionally specify the FHESignIn contract address")
  .addOptionalParam("user", "Optionally specify the user address (default: first signer)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const fhevmInstance = await initializeFhevm(hre);

    const FHESignInDeployement = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("FHESignIn");
    console.log(`FHESignIn: ${FHESignInDeployement.address}`);

    const signers = await ethers.getSigners();
    const user = taskArguments.user
      ? await ethers.getSigner(taskArguments.user)
      : signers[0];
    console.log(`User: ${user.address}`);

    const fheSignInContract = await ethers.getContractAt("FHESignIn", FHESignInDeployement.address);

    const count = await fheSignInContract.getUserSignInCount(user.address);
    console.log(`Total sign-in records: ${count}\n`);

    if (count === 0) {
      console.log("No sign-in records found.");
      return;
    }

    const timestamps: number[] = [];
    for (let i = 0; i < count; i++) {
      const encryptedTimestamp = await fheSignInContract.getUserSignInTimestamp(user.address, i);
      const decryptedTimestamp = await userDecryptEuint(
        fhevmInstance,
        32,
        encryptedTimestamp,
        FHESignInDeployement.address,
        user,
      );
      timestamps.push(Number(decryptedTimestamp));
      console.log(`Index ${i}: ${decryptedTimestamp} (${new Date(Number(decryptedTimestamp) * 1000).toISOString()})`);
    }

    console.log(`\nAll timestamps: [${timestamps.join(", ")}]`);
  });

