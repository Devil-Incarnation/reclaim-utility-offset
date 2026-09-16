// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VeriChainReceipt
 * @notice An ERC-20 token where 1 token = 1 ton of CO2. Burning = retiring carbon credits.
 */
contract VeriChainReceipt is ERC20, Ownable {

    // Tracks which zkTLS proof hashes have already been used (prevents replay attacks)
    mapping(string => bool) public proofHashUsed;

    // Emitted when a user retires carbon credits
    event CarbonRetired(
        address indexed retirer,
        uint256 tonnage,
        string zktlsProofHash,
        string verraSerial
    );

    constructor() ERC20("VeriChain Receipt", "VCR") Ownable(msg.sender) {
        // Mint 1,000,000 test tokens to the deployer for testing
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    /**
     * @notice Burn tokens to represent retiring carbon credits.
     * @param amount The tonnage to retire (in whole tokens).
     * @param zktlsProofHash A hash of the zkTLS proof generated off-chain.
     * @param verraSerial The real-world Verra/Gold Standard serial number.
     */
    function burnReceipt(
        uint256 amount,
        string memory zktlsProofHash,
        string memory verraSerial
    ) external {
        require(!proofHashUsed[zktlsProofHash], "VeriChain: proof already used");
        require(balanceOf(msg.sender) >= amount, "VeriChain: insufficient balance");
        require(amount > 0, "VeriChain: amount must be > 0");

        proofHashUsed[zktlsProofHash] = true;

        _burn(msg.sender, amount);

        emit CarbonRetired(msg.sender, amount, zktlsProofHash, verraSerial);
    }

    /**
     * @notice Owner-only minting (for testing / bridging).
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}