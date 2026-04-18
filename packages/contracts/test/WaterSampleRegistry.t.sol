// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {WaterSampleRegistry} from "../src/WaterSampleRegistry.sol";

contract WaterSampleRegistryTest is Test {
    WaterSampleRegistry internal registry;

    address internal admin = address(0xA11CE);
    address internal publisher = address(0xB0B);
    address internal reviewer = address(0xCAFE);
    address internal dataOwner = address(0xDEAD);
    address internal fieldAgent = address(0xF1E1D);
    address internal stranger = address(0x5711);

    bytes32 internal constant UID = bytes32(uint256(0x1234));
    bytes32 internal constant DATA_HASH = keccak256("canonical-payload");
    string internal constant IMAGE_CID = "bafybeigdyrzt";
    string internal constant READINGS = "{\"ecoli\":120,\"lead\":0.005}";

    event SamplePublished(
        bytes32 indexed attestationUID,
        address indexed fieldAgent,
        address indexed publisher,
        bytes32 dataHash,
        string imageCid,
        string labReadingsJson,
        uint64 timestamp
    );
    event SampleReviewed(bytes32 indexed attestationUID, address indexed reviewer, uint64 timestamp);
    event LabReadingsUpdated(bytes32 indexed attestationUID, address indexed updater, string newReadings);

    function setUp() public {
        registry = new WaterSampleRegistry(admin);
        vm.startPrank(admin);
        registry.grantRole(registry.PUBLISHER_ROLE(), publisher);
        registry.grantRole(registry.REVIEWER_ROLE(), reviewer);
        registry.grantRole(registry.DATA_OWNER_ROLE(), dataOwner);
        vm.stopPrank();
    }

    function test_Constructor_RevertsOnZeroAdmin() public {
        vm.expectRevert(WaterSampleRegistry.ZeroAddress.selector);
        new WaterSampleRegistry(address(0));
    }

    function test_Publish_HappyPath() public {
        vm.warp(1_700_000_000);
        vm.expectEmit(true, true, true, true);
        emit SamplePublished(UID, fieldAgent, publisher, DATA_HASH, IMAGE_CID, READINGS, uint64(block.timestamp));

        vm.prank(publisher);
        registry.publishSample(fieldAgent, UID, DATA_HASH, IMAGE_CID, READINGS);

        WaterSampleRegistry.Sample memory s = registry.getSample(UID);
        assertEq(s.fieldAgent, fieldAgent);
        assertEq(s.publisher, publisher);
        assertEq(s.dataHash, DATA_HASH);
        assertEq(s.imageCid, IMAGE_CID);
        assertEq(s.labReadingsJson, READINGS);
        assertEq(s.publishedAt, uint64(block.timestamp));
        assertFalse(s.reviewed);
    }

    function test_Publish_OnlyPublisherRole() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                IAccessControl.AccessControlUnauthorizedAccount.selector,
                stranger,
                registry.PUBLISHER_ROLE()
            )
        );
        vm.prank(stranger);
        registry.publishSample(fieldAgent, UID, DATA_HASH, IMAGE_CID, READINGS);
    }

    function test_Publish_RevertsOnZeroUID() public {
        vm.prank(publisher);
        vm.expectRevert(WaterSampleRegistry.InvalidAttestationUID.selector);
        registry.publishSample(fieldAgent, bytes32(0), DATA_HASH, IMAGE_CID, READINGS);
    }

    function test_Publish_RevertsOnZeroFieldAgent() public {
        vm.prank(publisher);
        vm.expectRevert(WaterSampleRegistry.ZeroAddress.selector);
        registry.publishSample(address(0), UID, DATA_HASH, IMAGE_CID, READINGS);
    }

    function test_Publish_RevertsOnDuplicate() public {
        vm.prank(publisher);
        registry.publishSample(fieldAgent, UID, DATA_HASH, IMAGE_CID, READINGS);

        vm.prank(publisher);
        vm.expectRevert(WaterSampleRegistry.SampleAlreadyPublished.selector);
        registry.publishSample(fieldAgent, UID, DATA_HASH, IMAGE_CID, READINGS);
    }

    function test_Publish_GasUnderBudget() public {
        vm.prank(publisher);
        uint256 before = gasleft();
        registry.publishSample(fieldAgent, UID, DATA_HASH, IMAGE_CID, READINGS);
        uint256 used = before - gasleft();
        emit log_named_uint("publishSample gas", used);
        assertLt(used, 300_000);
    }

    function test_Review_HappyPath() public {
        vm.prank(publisher);
        registry.publishSample(fieldAgent, UID, DATA_HASH, IMAGE_CID, READINGS);

        vm.expectEmit(true, true, false, true);
        emit SampleReviewed(UID, reviewer, uint64(block.timestamp));

        vm.prank(reviewer);
        registry.reviewAndSign(UID);

        WaterSampleRegistry.Sample memory s = registry.getSample(UID);
        assertTrue(s.reviewed);
        assertEq(s.reviewer, reviewer);
        assertEq(s.reviewedAt, uint64(block.timestamp));
    }

    function test_Review_OnlyReviewerRole() public {
        vm.prank(publisher);
        registry.publishSample(fieldAgent, UID, DATA_HASH, IMAGE_CID, READINGS);
        vm.expectRevert();
        vm.prank(stranger);
        registry.reviewAndSign(UID);
    }

    function test_Review_RevertsIfNotPublished() public {
        vm.prank(reviewer);
        vm.expectRevert(WaterSampleRegistry.SampleNotFound.selector);
        registry.reviewAndSign(UID);
    }

    function test_Review_RevertsIfAlreadyReviewed() public {
        vm.prank(publisher);
        registry.publishSample(fieldAgent, UID, DATA_HASH, IMAGE_CID, READINGS);
        vm.prank(reviewer);
        registry.reviewAndSign(UID);
        vm.prank(reviewer);
        vm.expectRevert(WaterSampleRegistry.SampleAlreadyReviewed.selector);
        registry.reviewAndSign(UID);
    }

    function test_Review_SeparationOfDuties() public {
        // grant publisher the reviewer role to exercise separation-of-duties guard
        bytes32 reviewerRole = registry.REVIEWER_ROLE();
        vm.prank(admin);
        registry.grantRole(reviewerRole, publisher);

        vm.prank(publisher);
        registry.publishSample(fieldAgent, UID, DATA_HASH, IMAGE_CID, READINGS);

        vm.prank(publisher);
        vm.expectRevert(WaterSampleRegistry.SeparationOfDutiesViolated.selector);
        registry.reviewAndSign(UID);
    }

    function test_UpdateLabReadings_HappyPath() public {
        vm.prank(publisher);
        registry.publishSample(fieldAgent, UID, DATA_HASH, IMAGE_CID, READINGS);
        vm.prank(reviewer);
        registry.reviewAndSign(UID);

        string memory enriched = "{\"ecoli\":120,\"lead\":0.005,\"_imageCid\":\"bafy...\"}";
        vm.expectEmit(true, true, false, true);
        emit LabReadingsUpdated(UID, dataOwner, enriched);

        vm.prank(dataOwner);
        registry.updateLabReadings(UID, enriched);

        assertEq(registry.getSample(UID).labReadingsJson, enriched);
    }

    function test_UpdateLabReadings_OnlyDataOwner() public {
        vm.prank(publisher);
        registry.publishSample(fieldAgent, UID, DATA_HASH, IMAGE_CID, READINGS);
        vm.prank(reviewer);
        registry.reviewAndSign(UID);
        vm.expectRevert();
        vm.prank(stranger);
        registry.updateLabReadings(UID, "{}");
    }

    function test_UpdateLabReadings_RevertsIfNotReviewed() public {
        vm.prank(publisher);
        registry.publishSample(fieldAgent, UID, DATA_HASH, IMAGE_CID, READINGS);
        vm.prank(dataOwner);
        vm.expectRevert(WaterSampleRegistry.SampleNotReviewed.selector);
        registry.updateLabReadings(UID, "{}");
    }

    // ---- fuzz ----

    function testFuzz_Publish_ArbitraryInputs(
        address fuzzFieldAgent,
        bytes32 fuzzUid,
        bytes32 fuzzHash,
        string calldata fuzzCid,
        string calldata fuzzReadings
    ) public {
        vm.assume(fuzzFieldAgent != address(0));
        vm.assume(fuzzUid != bytes32(0));
        vm.assume(bytes(fuzzCid).length < 256);
        vm.assume(bytes(fuzzReadings).length < 1024);

        vm.prank(publisher);
        registry.publishSample(fuzzFieldAgent, fuzzUid, fuzzHash, fuzzCid, fuzzReadings);

        assertTrue(registry.exists(fuzzUid));
        WaterSampleRegistry.Sample memory s = registry.getSample(fuzzUid);
        assertEq(s.fieldAgent, fuzzFieldAgent);
        assertEq(s.dataHash, fuzzHash);
        assertEq(s.publisher, publisher);
        assertFalse(s.reviewed);
    }

    function testFuzz_Publish_DuplicateAlwaysReverts(bytes32 fuzzUid) public {
        vm.assume(fuzzUid != bytes32(0));
        vm.prank(publisher);
        registry.publishSample(fieldAgent, fuzzUid, DATA_HASH, IMAGE_CID, READINGS);
        vm.prank(publisher);
        vm.expectRevert(WaterSampleRegistry.SampleAlreadyPublished.selector);
        registry.publishSample(fieldAgent, fuzzUid, DATA_HASH, IMAGE_CID, READINGS);
    }

    function testFuzz_ReviewAndSign_NotTwice(bytes32 fuzzUid) public {
        vm.assume(fuzzUid != bytes32(0));
        vm.prank(publisher);
        registry.publishSample(fieldAgent, fuzzUid, DATA_HASH, IMAGE_CID, READINGS);
        vm.prank(reviewer);
        registry.reviewAndSign(fuzzUid);
        vm.prank(reviewer);
        vm.expectRevert(WaterSampleRegistry.SampleAlreadyReviewed.selector);
        registry.reviewAndSign(fuzzUid);
    }
}
