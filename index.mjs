import { randomBytes  } from 'crypto';
import { buildPoseidon } from 'circomlibjs';
import { wtns, groth16 } from 'snarkjs';
import { program } from 'commander';
import { utils } from 'ffjavascript';
import fs from 'fs';

import { Wallet } from 'ethers';

import { MerkleTree } from './merkle_tree.mjs';
import * as blockchainInterface from './blockchainInterface.mjs';

const PROVIDER = "http://127.0.0.1:8545/";

const HASHER_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const VERIFIER_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const TEST_TOKEN_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
const PREIMAGE_VERIFIER_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

let provider = blockchainInterface.getProvider(PROVIDER);
let contractJson;

contractJson = blockchainInterface.readJSON("./artifacts/contracts/TestToken.sol/TestToken.json");
let testToken = blockchainInterface.getContract(provider, TEST_TOKEN_ADDRESS, contractJson.abi);

// We don't need to interact directly with this one
// contractJson = blockchainInterface.readJSON("./artifacts/contracts/Verifier.sol/Verifier.json");
// let verifier = blockchainInterface.getContract(provider, VERIFIER_ADDRESS, contractJson.abi);

contractJson = blockchainInterface.readJSON("./artifacts/contracts/PreimageVerifier.sol/PreimageVerifier.json");
let preimageVerifier = blockchainInterface.getContract(provider, PREIMAGE_VERIFIER_ADDRESS, contractJson.abi);

// We don't need to interact directly with this one
// contractJson = blockchainInterface.readJSON("Poseidon.json");
// let hasher = blockchainInterface.getContract(provider, HASHER_ADDRESS, contractJson.abi);

// You can create a Wallet from a private key
// let wallet = new Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");

// You can create a Wallet by asking for a private key if you blockchain is a local development network
let wallet = await blockchainInterface.getSignerEmbedded(provider, 0)

async function generateHash(firstParam, secondParam) {
	let poseidon = await buildPoseidon();

	let hasher = (a, b) => {
		return poseidon.F.toObject(poseidon([a, b]));
	}

	let hashImage = hasher(firstParam, secondParam);

	let hashingCertificate = {
		firstParam: firstParam.toString(),
		secondParam: secondParam.toString(),
		hashImage: hashImage.toString(),
	};

	console.log("Hash certificate: " + JSON.stringify(hashingCertificate));

	let resultDeposit = await preimageVerifier.connect(wallet).commitImage(hashImage);
	let t1 = await resultDeposit.wait();

	console.log(resultDeposit);
	console.log(t1);
}

async function proveOwnershipPreimage(firstParam, secondParam) {
	let poseidon = await buildPoseidon();

	let hasher = (a, b) => {
		return poseidon.F.toObject(poseidon([a, b]));
	}

	let hashImage = hasher(firstParam, secondParam);

	const circuitInput = {
		firstInput: firstParam,
		secondInput: secondParam,
		hashImage: hashImage
	};

	console.log(circuitInput);

	let witness = {type: "mem"};
	await wtns.calculate(circuitInput, "./PreimageVerifier_js/PreimageVerifier.wasm", witness);

	const proofResponse = await groth16.prove("./PreimageVerifier_js/preimageverifier_0001.zkey", witness);

	let proof = utils.unstringifyBigInts(proofResponse.proof);
	let publicSignals = utils.unstringifyBigInts(proofResponse.publicSignals);

	// (optional) Prints proof, public part, and Solidity calldata

	console.log("Proof:");
	console.log(proof);
	console.log("Public:");
	console.log(publicSignals);
	console.log("Solidity calldata:");
	console.log(await groth16.exportSolidityCallData(proof, publicSignals));

	// (optional) Verifies proof locally

	let verificationKey = JSON.parse(fs.readFileSync("./PreimageVerifier_js/verification_key.json"));

	const verificationResponse = await groth16.verify(verificationKey, publicSignals, proof);

	console.log("Local verification response: " + verificationResponse);

	// Calls the verification on the contract

	let resultWithdraw = await preimageVerifier.connect(wallet).proveOwnershipPreimage(
		[proof.pi_a[0], proof.pi_a[1]],
		[[proof.pi_b[0][1], proof.pi_b[0][0]], [proof.pi_b[1][1], proof.pi_b[1][0]]],
		[proof.pi_c[0], proof.pi_c[1]],
		hashImage
	);
	
	let t1 = await resultWithdraw.wait();

	console.log(resultWithdraw);
	console.log(t1);
}

async function main() {
	program.option("-r, --rpc", "Node RPC endpoint", "'http://localhost:8545");

	program
		.command("generateHash <firstParam> <secondParam>")
		.action(generateHash);

	program
		.command("proveOwnershipPreimage <firstParam> <secondParam>")
		.action(proveOwnershipPreimage)

	await program.parseAsync();
}

await main();