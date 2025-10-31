# FHE Sign-In System

A decentralized application (DApp) demonstrating Fully Homomorphic Encryption (FHE) enabled Solidity smart contracts using the FHEVM protocol by Zama. This project features an encrypted sign-in system where users can sign in daily, with their sign-in count stored and computed in an encrypted state on-chain.

## Quick Start

For detailed instructions see:
[FHEVM Hardhat Quick Start Tutorial](https://docs.zama.ai/protocol/solidity-guides/getting-started/quick-start-tutorial)

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm or yarn/pnpm**: Package manager

### Installation

1. **Install dependencies**

   ```bash
   npm install
   cd frontend
   npm install
   cd ..
   ```

2. **Set up environment variables**

   ```bash
   npx hardhat vars set MNEMONIC

   # Set your Infura API key for network access
   npx hardhat vars set INFURA_API_KEY

   # Optional: Set Etherscan API key for contract verification
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

3. **Compile contracts**

   ```bash
   npm run compile
   ```

4. **Deploy to local network**

   ```bash
   # Start a local FHEVM-ready node
   npm run chain
   # In another terminal, deploy to local network
   npm run deploy:localhost
   ```

5. **Deploy to Sepolia Testnet**

   ```bash
   # Deploy to Sepolia
   npm run deploy:sepolia
   # Verify contract on Etherscan
   npm run verify:sepolia <CONTRACT_ADDRESS>
   ```

6. **Run the frontend**

   ```bash
   cd frontend
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173` (or the port shown in the terminal).

   **Note**: Make sure you have deployed the contract and updated the contract address in the frontend configuration before using the application.

## 📁 Project Structure

```
fhevm-hardhat-template/
├── contracts/              # Smart contract source files
│   └── FHESignIn.sol      # FHE sign-in contract with encrypted counter
├── deploy/                # Deployment scripts
│   └── deployFHESignIn.ts # Deployment script for FHESignIn contract
├── tasks/                 # Hardhat custom tasks
│   ├── accounts.ts        # Account management tasks
│   └── FHESignIn.ts       # FHESignIn contract interaction tasks
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── Calendar.tsx      # Calendar display component
│   │   │   ├── DecryptPanel.tsx  # Decryption panel component
│   │   │   ├── SignInButton.tsx  # Sign-in button component
│   │   │   └── Tutorial.tsx      # Tutorial component
│   │   ├── hooks/        # Custom React hooks
│   │   │   ├── useContract.ts    # Contract interaction hook
│   │   │   ├── useRelayerSDK.ts  # Relayer SDK hook
│   │   │   └── useWallet.ts      # Wallet connection hook
│   │   ├── App.tsx        # Main application component
│   │   └── main.tsx       # Application entry point
│   └── package.json       # Frontend dependencies
├── utils/                 # Utility functions
│   └── fhevm.ts          # FHEVM SDK helper functions
├── hardhat.config.ts      # Hardhat configuration
└── package.json           # Dependencies and scripts
```

## 📜 Available Scripts

### Backend (Hardhat)

| Script                  | Description                          |
| ----------------------- | ------------------------------------ |
| `npm run compile`       | Compile all contracts                |
| `npm run test`          | Run all tests                        |
| `npm run test:sepolia`  | Run tests on Sepolia testnet         |
| `npm run coverage`      | Generate coverage report             |
| `npm run lint`          | Run linting checks                   |
| `npm run clean`         | Clean build artifacts                |
| `npm run chain`         | Start local Hardhat node             |
| `npm run deploy:localhost` | Deploy contracts to local network  |
| `npm run deploy:sepolia`  | Deploy contracts to Sepolia testnet |
| `npm run verify:sepolia`  | Verify contract on Etherscan         |

### Frontend

| Script              | Description                    |
| ------------------- | ------------------------------ |
| `npm run dev`       | Start development server       |
| `npm run build`     | Build for production           |
| `npm run preview`   | Preview production build       |

## 🔧 Features

- **Encrypted Sign-In Counter**: Each user's sign-in count is stored as an encrypted value (`euint32`) on-chain
- **Daily Sign-In**: Users can sign in once per day
- **Privacy-Preserving**: Sign-in counts remain encrypted during computation
- **Decryption**: Users can decrypt their own encrypted sign-in count using their private key
- **Modern UI**: Beautiful React-based frontend with calendar visualization
- **Wallet Integration**: Seamless MetaMask wallet connection
- **Relayer SDK**: Uses `@zama-fhe/relayer-sdk` for FHE operations on the frontend

## 🏗️ Architecture

### Smart Contract

The `FHESignIn` contract:
- Stores encrypted sign-in counters for each user address
- Allows users to increment their encrypted counter by 1
- Provides functions to retrieve encrypted counters
- Uses FHE operations to perform encrypted arithmetic

### Frontend

The React frontend:
- Connects to MetaMask wallet
- Initializes the Relayer SDK for FHE operations
- Allows users to sign in with encrypted input
- Decrypts and displays the user's sign-in count
- Shows a calendar visualization of sign-in history

## 📚 Documentation

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Setup Guide](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup)
- [FHEVM Testing Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)
- [FHEVM Hardhat Plugin](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)
- [Relayer SDK Documentation](https://docs.zama.ai/protocol/solidity-guides/getting-started/quick-start-tutorial)

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/zama-ai/fhevm/issues)
- **Documentation**: [FHEVM Docs](https://docs.zama.ai)
- **Community**: [Zama Discord](https://discord.gg/zama)

## 🚀 Usage

1. **Connect Wallet**: Click "Connect Wallet" to connect your MetaMask wallet
2. **Sign In**: Click the "Sign In" button to increment your encrypted sign-in counter
3. **View Count**: The decryption panel will show your current sign-in count
4. **Calendar**: View your sign-in history on the calendar

## ⚠️ Important Notes

- This project uses the **Sepolia testnet** configuration by default
- Make sure you have Sepolia ETH in your wallet for gas fees
- The contract address must be configured in the frontend before use
- FHE operations require the Relayer SDK to be properly initialized

## 🔐 Security

- Encrypted values remain private on-chain
- Only the user with the corresponding private key can decrypt their own data
- The contract uses FHE operations to ensure privacy during computation

---

**Built with ❤️ using FHEVM by Zama**
