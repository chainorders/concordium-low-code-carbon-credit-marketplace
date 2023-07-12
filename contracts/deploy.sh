## Call using ./deploy.sh <sender>
export CONNCORDIUM_NODE_ENDPOINT=node.testnet.concordium.com
cargo concordium build --out module.wasm --schema-out schema.bin --schema-base64-out ./schema.base64 --schema-embed
concordium-client --grpc-ip $CONNCORDIUM_NODE_ENDPOINT module deploy ./module.wasm --sender $1 --no-confirm
