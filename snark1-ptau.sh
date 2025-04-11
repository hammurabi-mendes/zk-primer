SIZE=16

mkdir -p ptau
cd ptau
snarkjs powersoftau new bn128 $SIZE pot${SIZE}_0000.ptau -v
snarkjs powersoftau contribute pot${SIZE}_0000.ptau pot${SIZE}_0001.ptau --name="First contribution" -v -e
snarkjs powersoftau prepare phase2 pot${SIZE}_0001.ptau pot${SIZE}_final.ptau -v
