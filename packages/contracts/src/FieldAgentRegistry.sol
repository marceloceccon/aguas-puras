// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title FieldAgentRegistry
/// @notice On-chain directory of active AguasPuras field agents. Field agents self-register
///         with an IPFS CID pointing at an ECIES-encrypted JSON blob containing their personal
///         details (name, CPF, contact, kit serial). Only `DATA_OWNER_ROLE` holders can decrypt
///         that blob off-chain — the chain never sees the plaintext.
/// @dev LGPD + GDPR posture: "right to be forgotten" is realised by (a) deactivating the agent
///      on-chain (emits an event the indexer uses to stop surfacing the record) and (b) the
///      Data Owner rotating the published `dataOwnerPublicKey` so old blobs become unrecoverable
///      after existing copies are purged from pinning services.
contract FieldAgentRegistry is AccessControl {
    bytes32 public constant DATA_OWNER_ROLE = keccak256("DATA_OWNER_ROLE");

    struct Agent {
        bool registered;
        bool active;
        uint64 registeredAt;
        uint64 updatedAt;
        string encryptedPersonalDataCid;
    }

    mapping(address => Agent) private _agents;

    /// @notice Uncompressed secp256k1 public key (65 bytes, leading 0x04) of the current Data Owner.
    ///         Field agents encrypt their personal data to this key via ECIES. Rotating this key
    ///         revokes future reads from anyone not holding the old private key.
    bytes public dataOwnerPublicKey;

    event AgentRegistered(address indexed agent, string encryptedPersonalDataCid, uint64 timestamp);
    event AgentPersonalDataUpdated(address indexed agent, string encryptedPersonalDataCid, uint64 timestamp);
    event AgentDeactivated(address indexed agent, address indexed by, uint64 timestamp);
    event DataOwnerPublicKeyUpdated(address indexed by, bytes pubkey);

    error AlreadyRegistered();
    error NotRegistered();
    error NotActive();
    error InvalidPublicKey();
    error ZeroAddress();

    constructor(address admin) {
        if (admin == address(0)) revert ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /// @notice Data Owner publishes the current ECIES public key. Field agents read this before
    ///         encrypting personal-data blobs. MUST be uncompressed (65 bytes, leading 0x04).
    function setDataOwnerPublicKey(bytes calldata pubkey) external onlyRole(DATA_OWNER_ROLE) {
        if (pubkey.length != 65 || pubkey[0] != 0x04) revert InvalidPublicKey();
        dataOwnerPublicKey = pubkey;
        emit DataOwnerPublicKeyUpdated(msg.sender, pubkey);
    }

    /// @notice Field agent self-registration. Callable once per address; updates go through
    ///         `updatePersonalData`. CID points at ECIES-ciphertext JSON encrypted to the current
    ///         `dataOwnerPublicKey`.
    function register(string calldata encryptedPersonalDataCid) external {
        Agent storage a = _agents[msg.sender];
        if (a.registered) revert AlreadyRegistered();
        uint64 ts = uint64(block.timestamp);
        a.registered = true;
        a.active = true;
        a.registeredAt = ts;
        a.updatedAt = ts;
        a.encryptedPersonalDataCid = encryptedPersonalDataCid;
        emit AgentRegistered(msg.sender, encryptedPersonalDataCid, ts);
    }

    /// @notice Field agent updates their encrypted personal-data CID (e.g. after contact change).
    function updatePersonalData(string calldata encryptedPersonalDataCid) external {
        Agent storage a = _agents[msg.sender];
        if (!a.registered) revert NotRegistered();
        if (!a.active) revert NotActive();
        uint64 ts = uint64(block.timestamp);
        a.updatedAt = ts;
        a.encryptedPersonalDataCid = encryptedPersonalDataCid;
        emit AgentPersonalDataUpdated(msg.sender, encryptedPersonalDataCid, ts);
    }

    /// @notice Data Owner deactivates an agent (doesn't purge the CID; the indexer + dashboards
    ///         honour `active=false` to stop surfacing the agent).
    function deactivate(address agent) external onlyRole(DATA_OWNER_ROLE) {
        Agent storage a = _agents[agent];
        if (!a.registered) revert NotRegistered();
        if (!a.active) revert NotActive();
        uint64 ts = uint64(block.timestamp);
        a.active = false;
        a.updatedAt = ts;
        emit AgentDeactivated(agent, msg.sender, ts);
    }

    function getAgent(address agent) external view returns (Agent memory) {
        Agent memory a = _agents[agent];
        if (!a.registered) revert NotRegistered();
        return a;
    }

    function isActive(address agent) external view returns (bool) {
        Agent memory a = _agents[agent];
        return a.registered && a.active;
    }
}
