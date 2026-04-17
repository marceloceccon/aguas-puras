// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {WaterSampleRegistry} from "../src/WaterSampleRegistry.sol";

contract WaterSampleRegistryTest is Test {
    WaterSampleRegistry internal registry;

    address internal lab = address(0xBEEF);
    address internal collector = address(0xCAFE);
    address internal stranger = address(0xDEAD);

    bytes32 internal constant UID = bytes32(uint256(0x1234));
    bytes32 internal constant DATA_HASH = keccak256("canonical-payload");

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

    function setUp() public {
        registry = new WaterSampleRegistry(lab);
    }

    function test_Constructor_RevertsOnZeroLabWallet() public {
        vm.expectRevert(WaterSampleRegistry.ZeroAddress.selector);
        new WaterSampleRegistry(address(0));
    }

    function test_RegisterSample_HappyPath() public {
        vm.warp(1_700_000_000);

        vm.expectEmit(true, true, false, true);
        emit SampleRegistered(UID, collector, DATA_HASH, uint64(block.timestamp));

        vm.prank(collector);
        registry.registerSample(UID, DATA_HASH);

        WaterSampleRegistry.Sample memory s = registry.getSample(UID);
        assertEq(s.dataHash, DATA_HASH);
        assertEq(s.attester, collector);
        assertEq(s.blockTimestamp, uint64(block.timestamp));
        assertEq(bytes(s.labReadingsJson).length, 0);
        assertTrue(registry.exists(UID));
    }

    function test_RegisterSample_RevertsOnDuplicate() public {
        vm.prank(collector);
        registry.registerSample(UID, DATA_HASH);

        vm.expectRevert(WaterSampleRegistry.SampleAlreadyRegistered.selector);
        vm.prank(collector);
        registry.registerSample(UID, DATA_HASH);
    }

    function test_RegisterSample_RevertsOnZeroUID() public {
        vm.expectRevert(WaterSampleRegistry.InvalidAttestationUID.selector);
        vm.prank(collector);
        registry.registerSample(bytes32(0), DATA_HASH);
    }

    function test_GetSample_RevertsIfMissing() public {
        vm.expectRevert(WaterSampleRegistry.SampleNotFound.selector);
        registry.getSample(UID);
    }

    function test_UpdateLabReadings_OnlyLabWallet() public {
        vm.prank(collector);
        registry.registerSample(UID, DATA_HASH);

        vm.expectRevert(WaterSampleRegistry.NotLabWallet.selector);
        vm.prank(stranger);
        registry.updateLabReadings(UID, "{\"ecoli\":10}");
    }

    function test_UpdateLabReadings_HappyPath() public {
        vm.prank(collector);
        registry.registerSample(UID, DATA_HASH);

        string memory readings = "{\"ecoli\":120,\"lead\":0.005,\"ph\":7.2}";

        vm.expectEmit(true, true, false, true);
        emit LabReadingsUpdated(UID, lab, readings);

        vm.prank(lab);
        registry.updateLabReadings(UID, readings);

        assertEq(registry.getSample(UID).labReadingsJson, readings);
    }

    function test_UpdateLabReadings_RevertsIfSampleMissing() public {
        vm.expectRevert(WaterSampleRegistry.SampleNotFound.selector);
        vm.prank(lab);
        registry.updateLabReadings(UID, "{}");
    }

    /// @dev Gas budget check: registerSample must stay under 150k gas per spec §4.
    function test_RegisterSample_GasUnderBudget() public {
        vm.prank(collector);
        uint256 gasBefore = gasleft();
        registry.registerSample(UID, DATA_HASH);
        uint256 gasUsed = gasBefore - gasleft();
        emit log_named_uint("registerSample gas", gasUsed);
        assertLt(gasUsed, 150_000);
    }

    function testFuzz_RegisterSample(bytes32 uid, bytes32 hash, address who) public {
        vm.assume(uid != bytes32(0));
        vm.assume(who != address(0));
        vm.prank(who);
        registry.registerSample(uid, hash);
        WaterSampleRegistry.Sample memory s = registry.getSample(uid);
        assertEq(s.attester, who);
        assertEq(s.dataHash, hash);
    }
}
