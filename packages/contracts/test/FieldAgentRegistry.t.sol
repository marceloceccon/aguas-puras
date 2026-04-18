// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Test} from "forge-std/Test.sol";
import {FieldAgentRegistry} from "../src/FieldAgentRegistry.sol";

contract FieldAgentRegistryTest is Test {
    FieldAgentRegistry internal registry;

    address internal admin = address(0xA11CE);
    address internal dataOwner = address(0xDEAD);
    address internal agent = address(0xB0B);
    address internal stranger = address(0x5711);

    string internal constant CID = "bafybeigenc";
    bytes internal constant PUBKEY =
        hex"04"
        hex"1111111111111111111111111111111111111111111111111111111111111111"
        hex"2222222222222222222222222222222222222222222222222222222222222222";

    event AgentRegistered(address indexed agent, string encryptedPersonalDataCid, uint64 timestamp);
    event AgentPersonalDataUpdated(address indexed agent, string encryptedPersonalDataCid, uint64 timestamp);
    event AgentDeactivated(address indexed agent, address indexed by, uint64 timestamp);
    event DataOwnerPublicKeyUpdated(address indexed by, bytes pubkey);

    function setUp() public {
        registry = new FieldAgentRegistry(admin);
        bytes32 dataOwnerRole = registry.DATA_OWNER_ROLE();
        vm.prank(admin);
        registry.grantRole(dataOwnerRole, dataOwner);
    }

    function test_Constructor_RevertsOnZeroAdmin() public {
        vm.expectRevert(FieldAgentRegistry.ZeroAddress.selector);
        new FieldAgentRegistry(address(0));
    }

    function test_Register_HappyPath() public {
        vm.warp(1_700_000_000);
        vm.expectEmit(true, false, false, true);
        emit AgentRegistered(agent, CID, uint64(block.timestamp));

        vm.prank(agent);
        registry.register(CID);

        FieldAgentRegistry.Agent memory a = registry.getAgent(agent);
        assertTrue(a.registered);
        assertTrue(a.active);
        assertEq(a.encryptedPersonalDataCid, CID);
        assertEq(a.registeredAt, uint64(block.timestamp));
    }

    function test_Register_RevertsOnDoubleRegister() public {
        vm.prank(agent);
        registry.register(CID);
        vm.prank(agent);
        vm.expectRevert(FieldAgentRegistry.AlreadyRegistered.selector);
        registry.register(CID);
    }

    function test_UpdatePersonalData_HappyPath() public {
        vm.prank(agent);
        registry.register(CID);

        string memory cid2 = "bafybeigenc2";
        vm.warp(block.timestamp + 3600);
        vm.expectEmit(true, false, false, true);
        emit AgentPersonalDataUpdated(agent, cid2, uint64(block.timestamp));

        vm.prank(agent);
        registry.updatePersonalData(cid2);

        assertEq(registry.getAgent(agent).encryptedPersonalDataCid, cid2);
    }

    function test_UpdatePersonalData_RevertsIfNotRegistered() public {
        vm.prank(agent);
        vm.expectRevert(FieldAgentRegistry.NotRegistered.selector);
        registry.updatePersonalData(CID);
    }

    function test_Deactivate_OnlyDataOwner() public {
        vm.prank(agent);
        registry.register(CID);
        vm.expectRevert();
        vm.prank(stranger);
        registry.deactivate(agent);
    }

    function test_Deactivate_HappyPath() public {
        vm.prank(agent);
        registry.register(CID);

        vm.expectEmit(true, true, false, false);
        emit AgentDeactivated(agent, dataOwner, uint64(block.timestamp));

        vm.prank(dataOwner);
        registry.deactivate(agent);

        assertFalse(registry.isActive(agent));
        assertFalse(registry.getAgent(agent).active);
    }

    function test_Deactivate_PreventsFurtherUpdates() public {
        vm.prank(agent);
        registry.register(CID);
        vm.prank(dataOwner);
        registry.deactivate(agent);
        vm.prank(agent);
        vm.expectRevert(FieldAgentRegistry.NotActive.selector);
        registry.updatePersonalData("bafybeigenc2");
    }

    function test_SetDataOwnerPublicKey_HappyPath() public {
        vm.expectEmit(true, false, false, true);
        emit DataOwnerPublicKeyUpdated(dataOwner, PUBKEY);

        vm.prank(dataOwner);
        registry.setDataOwnerPublicKey(PUBKEY);

        assertEq(registry.dataOwnerPublicKey(), PUBKEY);
    }

    function test_SetDataOwnerPublicKey_OnlyDataOwner() public {
        vm.expectRevert();
        vm.prank(stranger);
        registry.setDataOwnerPublicKey(PUBKEY);
    }

    function test_SetDataOwnerPublicKey_RejectsWrongLength() public {
        vm.prank(dataOwner);
        vm.expectRevert(FieldAgentRegistry.InvalidPublicKey.selector);
        registry.setDataOwnerPublicKey(hex"0411");
    }

    function test_SetDataOwnerPublicKey_RejectsCompressedPrefix() public {
        bytes memory compressed = new bytes(65);
        compressed[0] = 0x02;
        vm.prank(dataOwner);
        vm.expectRevert(FieldAgentRegistry.InvalidPublicKey.selector);
        registry.setDataOwnerPublicKey(compressed);
    }
}
