// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title WaterSampleRegistry
/// @notice Immutable on-chain index of water samples, keyed by their EAS attestation UID.
///         Collectors self-register samples after attesting off-chain. A designated lab wallet
///         can append lab readings to a sample post-registration without touching the attestation.
/// @dev Gas target: < 150k for `registerSample`. No external imports; minimal surface area.
contract WaterSampleRegistry {
    struct Sample {
        bytes32 dataHash;
        address attester;
        uint64 blockTimestamp;
        string labReadingsJson;
    }

    /// @notice Wallet authorized to append lab readings. Immutable for gas and auditability.
    address public immutable labWallet;

    mapping(bytes32 => Sample) private _samples;

    event SampleRegistered(
        bytes32 indexed attestationUID,
        address indexed attester,
        bytes32 dataHash,
        uint64 timestamp
    );

    event LabReadingsUpdated(
        bytes32 indexed attestationUID,
        address indexed updater,
        string newReadings
    );

    error InvalidAttestationUID();
    error SampleAlreadyRegistered();
    error SampleNotFound();
    error NotLabWallet();
    error ZeroAddress();

    constructor(address _labWallet) {
        if (_labWallet == address(0)) revert ZeroAddress();
        labWallet = _labWallet;
    }

    /// @notice Register a previously-signed EAS attestation on-chain.
    /// @param attestationUID EAS attestation UID (unique; cannot be re-registered).
    /// @param dataHash keccak256 of the canonical attestation payload, for integrity cross-check.
    function registerSample(bytes32 attestationUID, bytes32 dataHash) external {
        if (attestationUID == bytes32(0)) revert InvalidAttestationUID();
        Sample storage s = _samples[attestationUID];
        if (s.attester != address(0)) revert SampleAlreadyRegistered();

        uint64 ts = uint64(block.timestamp);
        s.dataHash = dataHash;
        s.attester = msg.sender;
        s.blockTimestamp = ts;

        emit SampleRegistered(attestationUID, msg.sender, dataHash, ts);
    }

    /// @notice Append or replace lab readings for a registered sample. Lab wallet only.
    function updateLabReadings(bytes32 attestationUID, string calldata newReadings) external {
        if (msg.sender != labWallet) revert NotLabWallet();
        Sample storage s = _samples[attestationUID];
        if (s.attester == address(0)) revert SampleNotFound();
        s.labReadingsJson = newReadings;
        emit LabReadingsUpdated(attestationUID, msg.sender, newReadings);
    }

    function getSample(bytes32 attestationUID) external view returns (Sample memory) {
        Sample memory s = _samples[attestationUID];
        if (s.attester == address(0)) revert SampleNotFound();
        return s;
    }

    function exists(bytes32 attestationUID) external view returns (bool) {
        return _samples[attestationUID].attester != address(0);
    }
}
