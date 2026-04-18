// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title WaterSampleRegistry v2
/// @notice Two-step institutional workflow for on-chain publication of water-sample attestations.
///         Field agents sign their attestation envelope off-chain (no gas). A laboratory
///         `PUBLISHER_ROLE` publishes the sample on-chain; a distinct `REVIEWER_ROLE` signs off
///         on it as a second pair of eyes. Post-review, a `DATA_OWNER_ROLE` can append or replace
///         lab readings (e.g. after instrument analysis).
/// @dev Roles are granted and revoked by `DEFAULT_ADMIN_ROLE` (the Foundation's Safe). Field-agent
///      personal data is stored in FieldAgentRegistry; this contract stores only public sample
///      metadata.
contract WaterSampleRegistry is AccessControl {
    bytes32 public constant PUBLISHER_ROLE = keccak256("PUBLISHER_ROLE");
    bytes32 public constant REVIEWER_ROLE = keccak256("REVIEWER_ROLE");
    bytes32 public constant DATA_OWNER_ROLE = keccak256("DATA_OWNER_ROLE");

    struct Sample {
        bytes32 dataHash;
        address fieldAgent;
        address publisher;
        address reviewer;
        uint64 publishedAt;
        uint64 reviewedAt;
        string imageCid;
        string labReadingsJson;
        bool reviewed;
    }

    mapping(bytes32 => Sample) private _samples;

    event SamplePublished(
        bytes32 indexed attestationUID,
        address indexed fieldAgent,
        address indexed publisher,
        bytes32 dataHash,
        string imageCid,
        string labReadingsJson,
        uint64 timestamp
    );

    event SampleReviewed(
        bytes32 indexed attestationUID,
        address indexed reviewer,
        uint64 timestamp
    );

    event LabReadingsUpdated(
        bytes32 indexed attestationUID,
        address indexed updater,
        string newReadings
    );

    error InvalidAttestationUID();
    error SampleAlreadyPublished();
    error SampleNotFound();
    error SampleAlreadyReviewed();
    error SampleNotReviewed();
    error ZeroAddress();

    constructor(address admin) {
        if (admin == address(0)) revert ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    /// @notice Publish a field-agent-signed attestation on-chain. Caller must hold PUBLISHER_ROLE.
    ///         The signature of the field agent is verified off-chain before this call; this
    ///         function records the semantic attester (fieldAgent) alongside the msg.sender
    ///         (publisher) for provenance.
    function publishSample(
        address fieldAgent,
        bytes32 attestationUID,
        bytes32 dataHash,
        string calldata imageCid,
        string calldata labReadingsJson
    ) external onlyRole(PUBLISHER_ROLE) {
        if (attestationUID == bytes32(0)) revert InvalidAttestationUID();
        if (fieldAgent == address(0)) revert ZeroAddress();
        Sample storage s = _samples[attestationUID];
        if (s.publishedAt != 0) revert SampleAlreadyPublished();

        uint64 ts = uint64(block.timestamp);
        s.dataHash = dataHash;
        s.fieldAgent = fieldAgent;
        s.publisher = msg.sender;
        s.publishedAt = ts;
        s.imageCid = imageCid;
        s.labReadingsJson = labReadingsJson;

        emit SamplePublished(
            attestationUID,
            fieldAgent,
            msg.sender,
            dataHash,
            imageCid,
            labReadingsJson,
            ts
        );
    }

    /// @notice Second-pair-of-eyes sign-off. Caller must hold REVIEWER_ROLE and must not be the
    ///         original publisher (separation of duties).
    function reviewAndSign(bytes32 attestationUID) external onlyRole(REVIEWER_ROLE) {
        Sample storage s = _samples[attestationUID];
        if (s.publishedAt == 0) revert SampleNotFound();
        if (s.reviewed) revert SampleAlreadyReviewed();
        if (msg.sender == s.publisher) revert SeparationOfDutiesViolated();

        uint64 ts = uint64(block.timestamp);
        s.reviewer = msg.sender;
        s.reviewedAt = ts;
        s.reviewed = true;

        emit SampleReviewed(attestationUID, msg.sender, ts);
    }

    error SeparationOfDutiesViolated();

    /// @notice Append or replace lab readings post-review. Caller must hold DATA_OWNER_ROLE.
    ///         Only callable after REVIEWER_ROLE has signed the sample.
    function updateLabReadings(bytes32 attestationUID, string calldata newReadings)
        external
        onlyRole(DATA_OWNER_ROLE)
    {
        Sample storage s = _samples[attestationUID];
        if (s.publishedAt == 0) revert SampleNotFound();
        if (!s.reviewed) revert SampleNotReviewed();
        s.labReadingsJson = newReadings;
        emit LabReadingsUpdated(attestationUID, msg.sender, newReadings);
    }

    function getSample(bytes32 attestationUID) external view returns (Sample memory) {
        Sample memory s = _samples[attestationUID];
        if (s.publishedAt == 0) revert SampleNotFound();
        return s;
    }

    function exists(bytes32 attestationUID) external view returns (bool) {
        return _samples[attestationUID].publishedAt != 0;
    }

    function isReviewed(bytes32 attestationUID) external view returns (bool) {
        return _samples[attestationUID].reviewed;
    }
}
