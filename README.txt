npm install
npm install -g snarkjs
sh snark2-compile-genverification.sh PreimageVerifier
cd PreimageVerifier_js
snarkjs zkey export solidityverifier preimageverifier_0001.zkey ../contracts/Verifier.sol
# IMPORTANT: Go in contracts/Verifier and change its name to Verifier

npx hardhat compile

# Launch blockchain, deploy
npx hardhat node

# In another tab..
node scripts/deploy.sh
node index.mjs generateHash 42 132
node index.mjs proveOwnershipPreimage 42 132
