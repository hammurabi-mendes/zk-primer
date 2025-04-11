#!/bin/sh
  
if [ $# -lt 1 ]; then
  echo "Must provide Circom filename prefix (without the .circom extension)"
  exit 1
fi

NAME=$1
ZKEY_NAME=$(echo "$NAME" | tr '[:upper:]' '[:lower:]')
INPUT="../input.json"

cd ${NAME}_js
ln ${INPUT}
node generate_witness.js ${NAME}.wasm ${INPUT} output.wtns
snarkjs groth16 prove ${ZKEY_NAME}_0001.zkey output.wtns proof.json public.json
snarkjs groth16 verify verification_key.json public.json proof.json
