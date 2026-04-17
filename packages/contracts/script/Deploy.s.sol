// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {WaterSampleRegistry} from "../src/WaterSampleRegistry.sol";
import {CollectorRegistry} from "../src/CollectorRegistry.sol";

/// @notice Deploy both registries. Reads LAB_WALLET and OWNER from env, falling back to the
///         broadcasting account for local anvil runs.
contract Deploy is Script {
    function run() external returns (WaterSampleRegistry sampleRegistry, CollectorRegistry collectorRegistry) {
        address deployer = msg.sender;
        address labWallet = vm.envOr("LAB_WALLET", deployer);
        address registryOwner = vm.envOr("OWNER", deployer);

        vm.startBroadcast();
        sampleRegistry = new WaterSampleRegistry(labWallet);
        collectorRegistry = new CollectorRegistry(registryOwner);
        vm.stopBroadcast();

        console2.log("WaterSampleRegistry deployed:", address(sampleRegistry));
        console2.log("  labWallet:", labWallet);
        console2.log("CollectorRegistry deployed:", address(collectorRegistry));
        console2.log("  owner:", registryOwner);
    }
}
