// SPDX-License-Identifier: MIT
pragma solidity >=0.8 <0.9.0;

import "@openzeppelin/contracts/interfaces/IERC20.sol";

import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// import "hardhat/console.sol";

interface IHasher {
	// "pure" ensures that the function does not read or modify state
	function poseidon(bytes32[2] calldata input) pure external returns (bytes32);
	function poseidon(uint256[2] calldata input) pure external returns (uint256);
}

// Signature comes from the generated Solidity verifier
interface IVerifier {
	function verifyProof(
			uint[2] memory a,
			uint[2][2] memory b,
			uint[2] memory c,
			uint[1] memory input
		) external view returns (bool r);
}

contract PreimageVerifier is Context, ReentrancyGuard {
	IERC20 public immutable token;
	IHasher public immutable hasher;
	IVerifier public immutable verifier;

	uint256 hashImage;

	event Withdraw(uint256 hashImage, uint256 timestamp);

	constructor(address _token, address _hasher, address _verifier) {
		token = IERC20(_token);
		hasher = IHasher(_hasher);
		verifier = IVerifier(_verifier);
	}

	function commitImage(uint256 _hashImage) external nonReentrant {
		hashImage = _hashImage;
	}

	function proveOwnershipPreimage(
			uint[2] memory a,
			uint[2][2] memory b,
			uint[2] memory c,
			uint _hashImage
	) external nonReentrant {
		require(_hashImage == hashImage, "Not verifying the previously commited hash image");
		require(verifier.verifyProof(a, b, c, [uint(_hashImage)]), "Proof verification failed");

		// Grant access to the escrowed funds, ... or whatever else

		emit Withdraw(_hashImage, block.timestamp);
	}
}
