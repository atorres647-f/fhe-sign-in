// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title FHE Sign-in DApp Contract
/// @notice A simple contract that stores encrypted sign-in counter.
///         Each user has an encrypted counter that increments by 1 on each sign-in.
/// @author fhevm-hardhat-template
contract FHESignIn is SepoliaConfig {
    // Mapping from user address to encrypted sign-in counter
    mapping(address => euint32) private _userSignInCounter;

    /// @notice Event emitted when a user signs in
    /// @param user The address of the user who signed in
    event SignIn(address indexed user);

    /// @notice Sign in function - increments encrypted counter by 1
    /// @param increment The encrypted increment value (should be 1)
    /// @param incrementProof The proof for the encrypted increment
    /// @dev The increment should be 1. The counter will be incremented by this value.
    function signIn(
        externalEuint32 increment,
        bytes calldata incrementProof
    ) external {
        // Convert external encrypted data to internal encrypted data
        euint32 encryptedIncrement = FHE.fromExternal(increment, incrementProof);
        
        // Initialize counter to 0 if it doesn't exist, then add increment
        euint32 currentCounter = _userSignInCounter[msg.sender];
        _userSignInCounter[msg.sender] = FHE.add(currentCounter, encryptedIncrement);
        
        // Allow contract and user to access this encrypted counter
        FHE.allowThis(_userSignInCounter[msg.sender]);
        FHE.allow(_userSignInCounter[msg.sender], msg.sender);
        
        // Emit event
        emit SignIn(msg.sender);
    }

    /// @notice Get the encrypted sign-in counter for a user
    /// @param user The address of the user
    /// @return The encrypted counter value
    /// @dev The backend can decrypt this to get the actual count
    function getUserSignInCounter(address user) external view returns (euint32) {
        return _userSignInCounter[user];
    }

    /// @notice Get the encrypted sign-in counter for the caller
    /// @return The encrypted counter value
    function getMySignInCounter() external view returns (euint32) {
        return _userSignInCounter[msg.sender];
    }
}

