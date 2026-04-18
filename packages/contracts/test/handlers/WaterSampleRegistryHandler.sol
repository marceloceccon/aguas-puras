// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {WaterSampleRegistry} from "../../src/WaterSampleRegistry.sol";

/// @notice Handler for Foundry invariant testing. The fuzzer calls these
///         wrappers in random sequences; the invariant test contract asserts
///         protocol-wide properties after every sequence.
contract WaterSampleRegistryHandler is Test {
    WaterSampleRegistry public registry;
    address public publisher;
    address public reviewer;
    address public dataOwner;

    bytes32[] public uids;
    uint256 public publishCalls;
    uint256 public reviewCalls;
    uint256 public updateCalls;

    constructor(
        WaterSampleRegistry _registry,
        address _publisher,
        address _reviewer,
        address _dataOwner
    ) {
        registry = _registry;
        publisher = _publisher;
        reviewer = _reviewer;
        dataOwner = _dataOwner;
    }

    function publish(address fieldAgent, bytes32 seed, bytes32 dataHash) external {
        publishCalls++;
        if (fieldAgent == address(0)) return;
        bytes32 uid = keccak256(abi.encode(seed, uids.length));
        if (uid == bytes32(0)) return;
        if (registry.exists(uid)) return;
        vm.prank(publisher);
        registry.publishSample(fieldAgent, uid, dataHash, "bafy-stub", "{}");
        uids.push(uid);
    }

    function review(uint256 i) external {
        reviewCalls++;
        if (uids.length == 0) return;
        bytes32 uid = uids[i % uids.length];
        if (registry.isReviewed(uid)) return;
        vm.prank(reviewer);
        registry.reviewAndSign(uid);
    }

    function updateReadings(uint256 i, string calldata readings) external {
        updateCalls++;
        if (uids.length == 0) return;
        bytes32 uid = uids[i % uids.length];
        if (!registry.isReviewed(uid)) return;
        vm.prank(dataOwner);
        registry.updateLabReadings(uid, readings);
    }

    function uidsLength() external view returns (uint256) {
        return uids.length;
    }

    function uidAt(uint256 i) external view returns (bytes32) {
        return uids[i];
    }
}
