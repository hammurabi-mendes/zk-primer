#!/bin/sh
  
if [ $# -lt 1 ]; then
  echo "Must provide Circom filename prefix (without the .circom extension)"
  exit 1
fi

NAME=$1
ZKEY_NAME=$(echo "$NAME" | tr '[:upper:]' '[:lower:]')
PTAU_FINAL="../ptau/pot16_final.ptau"
DIRECTORY="circuits"

circom ${DIRECTORY}/${NAME}.circom --r1cs --wasm --sym && \
cd ${NAME}_js && \
snarkjs groth16 setup ../${NAME}.r1cs $PTAU_FINAL ${ZKEY_NAME}_0000.zkey && \
snarkjs zkey contribute ${ZKEY_NAME}_0000.zkey ${ZKEY_NAME}_0001.zkey --name="First contributor" -v -e && \
snarkjs zkey export verificationkey ${ZKEY_NAME}_0001.zkey verification_key.json