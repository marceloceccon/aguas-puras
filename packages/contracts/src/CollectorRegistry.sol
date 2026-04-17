// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/// @title CollectorRegistry
/// @notice Owner-gated allowlist of approved sample collectors / labs. Off-chain clients read this
///         to filter WaterSampleRegistry submissions before surfacing them publicly.
/// @dev Pairs with the EAS `CollectorApproval` schema. Kept minimal; no transferable roles yet.
contract CollectorRegistry {
    address public owner;
    mapping(address => bool) public isApproved;

    event CollectorApproved(address indexed collector);
    event CollectorRevoked(address indexed collector);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error ZeroAddress();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _owner) {
        if (_owner == address(0)) revert ZeroAddress();
        owner = _owner;
        emit OwnershipTransferred(address(0), _owner);
    }

    function approveCollector(address collector) external onlyOwner {
        if (collector == address(0)) revert ZeroAddress();
        isApproved[collector] = true;
        emit CollectorApproved(collector);
    }

    function revokeCollector(address collector) external onlyOwner {
        isApproved[collector] = false;
        emit CollectorRevoked(collector);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        address prev = owner;
        owner = newOwner;
        emit OwnershipTransferred(prev, newOwner);
    }
}
