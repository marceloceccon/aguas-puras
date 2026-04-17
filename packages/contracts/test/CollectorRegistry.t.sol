// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {CollectorRegistry} from "../src/CollectorRegistry.sol";

contract CollectorRegistryTest is Test {
    CollectorRegistry internal registry;

    address internal ownerAddr = address(0xA11CE);
    address internal collector = address(0xB0B);
    address internal stranger = address(0xDEAD);

    event CollectorApproved(address indexed collector);
    event CollectorRevoked(address indexed collector);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    function setUp() public {
        registry = new CollectorRegistry(ownerAddr);
    }

    function test_Constructor_RevertsOnZeroOwner() public {
        vm.expectRevert(CollectorRegistry.ZeroAddress.selector);
        new CollectorRegistry(address(0));
    }

    function test_Constructor_EmitsOwnershipTransferred() public {
        vm.expectEmit(true, true, false, false);
        emit OwnershipTransferred(address(0), ownerAddr);
        new CollectorRegistry(ownerAddr);
    }

    function test_ApproveCollector_OnlyOwner() public {
        vm.expectRevert(CollectorRegistry.NotOwner.selector);
        vm.prank(stranger);
        registry.approveCollector(collector);
    }

    function test_ApproveCollector_HappyPath() public {
        vm.expectEmit(true, false, false, false);
        emit CollectorApproved(collector);

        vm.prank(ownerAddr);
        registry.approveCollector(collector);

        assertTrue(registry.isApproved(collector));
    }

    function test_ApproveCollector_RevertsOnZeroAddress() public {
        vm.expectRevert(CollectorRegistry.ZeroAddress.selector);
        vm.prank(ownerAddr);
        registry.approveCollector(address(0));
    }

    function test_RevokeCollector_HappyPath() public {
        vm.prank(ownerAddr);
        registry.approveCollector(collector);

        vm.expectEmit(true, false, false, false);
        emit CollectorRevoked(collector);

        vm.prank(ownerAddr);
        registry.revokeCollector(collector);

        assertFalse(registry.isApproved(collector));
    }

    function test_RevokeCollector_OnlyOwner() public {
        vm.expectRevert(CollectorRegistry.NotOwner.selector);
        vm.prank(stranger);
        registry.revokeCollector(collector);
    }

    function test_TransferOwnership_HappyPath() public {
        address newOwner = address(0xCAFE);

        vm.expectEmit(true, true, false, false);
        emit OwnershipTransferred(ownerAddr, newOwner);

        vm.prank(ownerAddr);
        registry.transferOwnership(newOwner);

        assertEq(registry.owner(), newOwner);
    }

    function test_TransferOwnership_RevertsOnZeroAddress() public {
        vm.expectRevert(CollectorRegistry.ZeroAddress.selector);
        vm.prank(ownerAddr);
        registry.transferOwnership(address(0));
    }

    function test_TransferOwnership_OnlyOwner() public {
        vm.expectRevert(CollectorRegistry.NotOwner.selector);
        vm.prank(stranger);
        registry.transferOwnership(stranger);
    }
}
