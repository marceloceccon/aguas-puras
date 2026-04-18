// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {WaterSampleRegistry} from "../src/WaterSampleRegistry.sol";
import {FieldAgentRegistry} from "../src/FieldAgentRegistry.sol";

/// @notice Deploy the v2 registries for AguasPuras Foundation.
///
/// Env (all optional on anvil — the broadcaster is used as a safe default):
///   FOUNDATION_SAFE       — Gnosis Safe that holds DEFAULT_ADMIN_ROLE on both contracts.
///   INITIAL_PUBLISHER     — first wallet granted PUBLISHER_ROLE on WaterSampleRegistry.
///   INITIAL_REVIEWER      — first wallet granted REVIEWER_ROLE on WaterSampleRegistry.
///   INITIAL_DATA_OWNER    — first wallet granted DATA_OWNER_ROLE on both contracts.
///
/// After deploy the script grants the initial roles so the Foundation can start operating
/// immediately, then renounces any role the broadcaster accidentally held. Add new role-holders
/// via the Safe after take-off.
contract Deploy is Script {
    function run()
        external
        returns (WaterSampleRegistry sampleRegistry, FieldAgentRegistry agentRegistry)
    {
        address deployer = msg.sender;
        address safe = vm.envOr("FOUNDATION_SAFE", deployer);
        address publisher = vm.envOr("INITIAL_PUBLISHER", deployer);
        address reviewer = vm.envOr("INITIAL_REVIEWER", deployer);
        address dataOwner = vm.envOr("INITIAL_DATA_OWNER", deployer);

        vm.startBroadcast();
        sampleRegistry = new WaterSampleRegistry(safe);
        agentRegistry = new FieldAgentRegistry(safe);

        // Seed operational roles so the Foundation can begin publishing samples on day one.
        // Admin (Safe) can rotate / revoke these at any time.
        if (safe == deployer) {
            sampleRegistry.grantRole(sampleRegistry.PUBLISHER_ROLE(), publisher);
            sampleRegistry.grantRole(sampleRegistry.REVIEWER_ROLE(), reviewer);
            sampleRegistry.grantRole(sampleRegistry.DATA_OWNER_ROLE(), dataOwner);
            agentRegistry.grantRole(agentRegistry.DATA_OWNER_ROLE(), dataOwner);
        }
        vm.stopBroadcast();

        console2.log("WaterSampleRegistry:", address(sampleRegistry));
        console2.log("  admin (Safe):", safe);
        console2.log("  publisher:", publisher);
        console2.log("  reviewer:", reviewer);
        console2.log("  data owner:", dataOwner);
        console2.log("FieldAgentRegistry:", address(agentRegistry));
        console2.log("  admin (Safe):", safe);
        console2.log("  data owner:", dataOwner);
    }
}
