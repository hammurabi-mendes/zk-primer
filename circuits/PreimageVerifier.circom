pragma circom 2.0.4;

include "../node_modules/circomlib/circuits/poseidon.circom";

template PreimageVerifier() {
	signal input firstInput;
	signal input secondInput;
	signal input hashImage;

	component hasher = Poseidon(2);
	hasher.inputs[0] <== firstInput;
	hasher.inputs[1] <== secondInput;

	hasher.out === hashImage;
}

component main { public [ hashImage ] } = PreimageVerifier();