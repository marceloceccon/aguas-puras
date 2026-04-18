// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {WaterSampleRegistry} from "../src/WaterSampleRegistry.sol";
import {WaterSampleRegistryHandler} from "./handlers/WaterSampleRegistryHandler.sol";

/// @notice Protocol-wide invariants. The Foundry fuzzer drives random sequences
///         of publish / review / updateReadings; these functions must hold
///         after every sequence.
contract WaterSampleRegistryInvariants is Test {
    WaterSampleRegistry internal registry;
    WaterSampleRegistryHandler internal handler;

    address internal admin = address(this);
    address internal publisher = address(0xB0B);
    address internal reviewer = address(0xCAFE);
    address internal dataOwner = address(0xDEAD);

    function setUp() public {
        registry = new WaterSampleRegistry(admin);
        registry.grantRole(registry.PUBLISHER_ROLE(), publisher);
        registry.grantRole(registry.REVIEWER_ROLE(), reviewer);
        registry.grantRole(registry.DATA_OWNER_ROLE(), dataOwner);
        handler = new WaterSampleRegistryHandler(registry, publisher, reviewer, dataOwner);
        targetContract(address(handler));

        bytes4[] memory selectors = new bytes4[](3);
        selectors[0] = WaterSampleRegistryHandler.publish.selector;
        selectors[1] = WaterSampleRegistryHandler.review.selector;
        selectors[2] = WaterSampleRegistryHandler.updateReadings.selector;
        targetSelector(FuzzSelector({addr: address(handler), selectors: selectors}));
    }

    /// @dev reviewed ⇒ published (reviewedAt nonzero ⇒ publishedAt nonzero)
    ///      reviewed ⇒ reviewer ≠ address(0)
    ///      reviewed ⇒ reviewer ≠ publisher (separation of duties)
    function invariant_ReviewedImpliesPublishedAndSeparated() public view {
        uint256 len = handler.uidsLength();
        for (uint256 i = 0; i < len; i++) {
            bytes32 uid = handler.uidAt(i);
            WaterSampleRegistry.Sample memory s = registry.getSample(uid);
            if (s.reviewed) {
                assertGt(s.publishedAt, 0, "reviewed without publishedAt");
                assertGt(s.reviewedAt, 0, "reviewed without reviewedAt");
                assertTrue(s.reviewer != address(0), "reviewed without reviewer");
                assertTrue(s.reviewer != s.publisher, "reviewer == publisher (SoD violated)");
            }
        }
    }

    /// @dev every uid recorded by the handler resolves to a published sample
    ///      (the handler never pushes uids without a successful publishSample).
    function invariant_HandlerUidsAreAllPublished() public view {
        uint256 len = handler.uidsLength();
        for (uint256 i = 0; i < len; i++) {
            assertTrue(registry.exists(handler.uidAt(i)));
        }
    }

    /// @dev uids array is append-only: monotonically non-decreasing length.
    function invariant_UidsArrayMonotonic() public view {
        // handler.uids only grows inside `publish`; no function removes from it.
        // We check that publishCalls >= uids.length (every push follows a call).
        assertGe(handler.publishCalls(), handler.uidsLength());
    }
}
