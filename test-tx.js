#!/usr/bin/env node
//@ts-check
import fs from "fs";
import * as helios from "./helios.js"

const networkParams = new helios.NetworkParams(JSON.parse(fs.readFileSync("./network-parameters/preview.json").toString()));

const helios_ = helios.exportedForTesting;

async function testBasic() {
    // send 10 tAda on preview net from wallet1 to wallet 2
    // wallet1 address: addr_test1vzzcg26lxj3twnnx889lrn60pqn0z3km2yahhsz0fvpyxdcj5qp8w
    // wallet2 address: addr_test1vqzhgmkqsyyzxthk7vzxet4283wx8wwygu9nq0v94mdldxs0d56ku
    // input utxo: d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83#0
    // command: cardano-cli transaction build --tx-in d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83#0 --tx-out addr_test1vqzhgmkqsyyzxthk7vzxet4283wx8wwygu9nq0v94mdldxs0d56ku+10000000 --change-address addr_test1vzzcg26lxj3twnnx889lrn60pqn0z3km2yahhsz0fvpyxdcj5qp8w --testnet-magic 2 --out-file /data/preview/transactions/202209042119.tx --babbage-era --cddl-format
    // outputHex: 
    const unsignedHex = "84a30081825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000182a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b024337011b000000025370c627a200581d6005746ec08108232ef6f3046caeaa3c5c63b9c4470b303d85aedbf69a011a00989680021a00028759a0f5f6";

    const signedHex= "84a30081825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000182a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b024337011b000000025370c627a200581d6005746ec08108232ef6f3046caeaa3c5c63b9c4470b303d85aedbf69a011a00989680021a00028759a10081825820a0e006bbd52e9db2dcd904e90c335212d2968fcae92ee9dd01204543c314359b584073afc3d75355883cd9a83140ed6480354578148f861f905d65a75b773d004eca5869f7f2a580c6d9cc7d54da3b307aa6cb1b8d4eb57603e37eff83ca56ec620cf5f6";

    const unsignedBytes = helios_.hexToBytes(unsignedHex);

    const signedBytes = helios_.hexToBytes(signedHex);

    const unsignedTx = helios.Tx.fromCbor(unsignedBytes);

    const signedTx = helios.Tx.fromCbor(signedBytes);


    console.log("UNSIGNED:\n", JSON.stringify(unsignedTx.dump(), undefined, "    "));

    console.log("\nSIGNED:\n", JSON.stringify(signedTx.dump(), undefined, "    "));

	console.log("BODY BYTES: ", helios.bytesToHex(signedTx.body.toCbor()));

	//signedTx.witnesses.verifySignatures(signedTx.body.toCbor());

    console.log("UNSIGNED SIZE:", unsignedBytes.length.toString());
    console.log("SIGNED SIZE:", signedBytes.length.toString());
    console.log("ESTIMATED TX SIZE:", signedTx.estimateFee(networkParams));

    console.log("CBOR ENCODING:", helios_.bytesToHex(signedTx.toCbor()));

    console.log("INV:", JSON.stringify(helios_.Tx.fromCbor(signedTx.toCbor()).dump(), undefined, "    "));

    // build same transaction using helios only:
    let tx = new helios.Tx();

    tx.addInput(new helios.TxInput(
        helios.Hash.fromHex("d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83"),
        0n,
        new helios.TxOutput(
            helios.Address.fromBech32("addr_test1vzzcg26lxj3twnnx889lrn60pqn0z3km2yahhsz0fvpyxdcj5qp8w"),
            new helios.Value(10n*1000n*1000n*1000n),
        )
    ));

    tx.addOutput(new helios.TxOutput(
        helios.Address.fromBech32("addr_test1vqzhgmkqsyyzxthk7vzxet4283wx8wwygu9nq0v94mdldxs0d56ku"),
        new helios.Value(10n*1000n*1000n),
    ));

    tx.setChangeAddress(helios.Address.fromBech32("addr_test1vzzcg26lxj3twnnx889lrn60pqn0z3km2yahhsz0fvpyxdcj5qp8w"));

    await tx.finalize(networkParams);

    console.log(JSON.stringify(tx.dump(), undefined, "    "));

}

async function testMinting(optimized = false) {
    const src = `
	minting testnft

	func main() -> Bool {
		true
	}`;

	const program = helios.Program.new(src).compile(optimized)

	console.log("MINTING_PROGRAM:", program.serialize());

	const hash = program.hash();

	console.log("MINTING_POLICY_HASH:", helios_.bytesToHex(hash));

	// wallet1 address: addr_test1vzzcg26lxj3twnnx889lrn60pqn0z3km2yahhsz0fvpyxdcj5qp8w
	// submit minting transaction:
	//  MINTING_POLICY_HASH=$(cardano-cli transaction policyid --script-file /data/scripts/minting
	//    0b61cc751e9512fef62362f00e6db61e70d719a567c6d4eb68095957 # for unoptimized
    //    919d4c2c9455016289341b1a14dedf697687af31751170d56a31466e # for optimized
	//  cardano-cli transaction build \
	//    --tx-in d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83#0 \ # used for fee
	//    --tx-out addr_test1vzzcg26lxj3twnnx889lrn60pqn0z3km2yahhsz0fvpyxdcj5qp8w+"1 0b61cc751e9512fef62362f00e6db61e70d719a567c6d4eb68095957." \
	//    --change-address addr_test1vzzcg26lxj3twnnx889lrn60pqn0z3km2yahhsz0fvpyxdcj5qp8w \
	//    --tx-in-collateral d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83#0 \
	//    --mint "1 0b61cc751e9512fef62362f00e6db61e70d719a567c6d4eb68095957." \
	//    --mint-script-file /data/scripts/minting/simple.json \
	//    --mint-redeemer-value "42" \ # arbitrary
	//    --testnet-magic 2 \
	//    --out-file /data/preview/transactions/202209101515.tx
	//    --cddl-format \
	//    --babbage-era
	//    --protocol-params-file <PARAMS>

	const cliTxHex = (!optimized) ? "84a60081825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000d81825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000182a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b024337011b0000000253eaa6cca200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b02433701821a001e8480a1581c0b61cc751e9512fef62362f00e6db61e70d719a567c6d4eb68095957a14001021a0002b8b409a1581c0b61cc751e9512fef62362f00e6db61e70d719a567c6d4eb68095957a140010b5820af267b4418b11a9faa827f80301849ec4bd4565dbd95bae23f73918444eab395a206815453010000322233335734600693124c4c931251010581840100182a821909611a00094d78f5f6" : "84a60081825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000d81825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000182a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b024337011b0000000253eaa985a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b02433701821a001e8480a1581c919d4c2c9455016289341b1a14dedf697687af31751170d56a31466ea14001021a0002b5fb09a1581c919d4c2c9455016289341b1a14dedf697687af31751170d56a31466ea140010b5820686829109fc5e6342d9223537b91f804107c4dbfa8ba3288f80657be843acd51a2068147460100002249810581840100182a821903201a0002754cf5f6";

	const cliSignedTxHex = (!optimized) ? "84a60081825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000d81825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000182a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b024337011b0000000253eaa6cca200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b02433701821a001e8480a1581c0b61cc751e9512fef62362f00e6db61e70d719a567c6d4eb68095957a14001021a0002b8b409a1581c0b61cc751e9512fef62362f00e6db61e70d719a567c6d4eb68095957a140010b5820af267b4418b11a9faa827f80301849ec4bd4565dbd95bae23f73918444eab395a30081825820a0e006bbd52e9db2dcd904e90c335212d2968fcae92ee9dd01204543c314359b5840684649bbe18d47cc58963877e777da9c7dab6206b4833c676f6301d974418b574f0d169723d7cedbd33e2cbcc07fac4a8cf32769816f8dc3153f5bdf6e510c0406815453010000322233335734600693124c4c931251010581840100182a821909611a00094d78f5f6" : "84a60081825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000d81825820d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83000182a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b024337011b0000000253eaa985a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b02433701821a001e8480a1581c919d4c2c9455016289341b1a14dedf697687af31751170d56a31466ea14001021a0002b5fb09a1581c919d4c2c9455016289341b1a14dedf697687af31751170d56a31466ea140010b5820686829109fc5e6342d9223537b91f804107c4dbfa8ba3288f80657be843acd51a30081825820a0e006bbd52e9db2dcd904e90c335212d2968fcae92ee9dd01204543c314359b58409b4267e7691d160414f774f82942f08bbc3c64a19259a09b92350fe11ced5f73b64d99aa05f70cb68c730dc0d6ae718f739e5c2932eb843f2a9dcd69ff3c160c068147460100002249810581840100182a821903201a0002754cf5f6"

	console.log("SIGNED SIZE:", helios_.hexToBytes(cliSignedTxHex).length);

	const cliTxBytes = helios_.hexToBytes(cliTxHex);

	const cliTx = helios.Tx.fromCbor(cliTxBytes);

	console.log(`BUILT_BY_CARDANO_CLI (${cliTx.toCbor().length}):`, JSON.stringify(cliTx.dump(), undefined, 4));

	// build the same transaction using helios only
	const addr = helios.Address.fromBech32("addr_test1vzzcg26lxj3twnnx889lrn60pqn0z3km2yahhsz0fvpyxdcj5qp8w");
	let heliosTx = new helios.Tx();

	let mainInput = new helios.TxInput(
		helios.Hash.fromHex("d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83"),
		0n,
		new helios.TxOutput(
			addr,
            new helios.Value(10n*1000n*1000n*1000n),
		)
	);

	heliosTx.addInput(mainInput);

	let mph = new helios.Hash(program.hash());

	/**
	 * @type {[number[], bigint][]}
	 */
	let tokens = [[[], 1n]];

	heliosTx.addMint(mph, tokens, new helios.IntData(42n));

	heliosTx.addOutput(new helios.TxOutput(
		addr,
		new helios.Value(2n*1000n*1000n, new helios.Assets([[mph, tokens]]))
	));

	heliosTx.setChangeAddress(addr);

	heliosTx.setCollateralInput(mainInput);

	heliosTx.addScript(program);

	await heliosTx.finalize(networkParams);

	console.log(`BUILT_BY_HELIOS (${heliosTx.toCbor().length}):`, JSON.stringify(heliosTx.dump(), undefined, 4));
}

async function testInlineDatum() {
    const src = `
	spending always_succeeds

	func main() -> Bool {
		true
	}`;

	const program = helios.Program.new(src).compile(true);

	// wallet1 address: addr_test1vzzcg26lxj3twnnx889lrn60pqn0z3km2yahhsz0fvpyxdcj5qp8w
	// submit minting transaction:
	//  cardano-cli address build --payment-script-file /data/scripts/always_succeeds.json \
	//    --out-file /data/script/always_succeeds.addr \
	//    --testnet-magic $TESTNET_MAGIC
    //   addr_test1wpfvdtcvnd6yknhve6pc2w999n4325pck00x3c4m9750cdch6csfq
	//  cardano-cli transaction build \
	//    --tx-in d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83#0 \
	//    --tx-out $(cat /data/scripts/always_succeeds.addr)+2000000 \
	//    --tx-out-datum-file /data/scripts/datum_42.json \
	//    --change-address addr_test1vzzcg26lxj3twnnx889lrn60pqn0z3km2yahhsz0fvpyxdcj5qp8w \
	//    --tx-in-collateral d4b22d33611fb2b3764080cb349b3f12d353aef1d4319ee33e44594bbebe5e83#0 \
	//    --testnet-magic 2 \
	//    --out-file /data/preview/transactions/202209142346.tx
	//    --cddl-format \
	//    --babbage-era
	//    --protocol-params-file <PARAMS>

	const unsignedHex = "84a400818258205d4bc6456f3bc6ac9f0c36ac25b0a4a9c2d793aaa5344355fcd2c8f647f2b55c000d818258205d4bc6456f3bc6ac9f0c36ac25b0a4a9c2d793aaa5344355fcd2c8f647f2b55c000182a200581d6085842b5f34a2b74e6639cbf1cf4f0826f146db513b7bc04f4b024337011b0000000253c6daafa300581d7052c6af0c9b744b4eecce838538a52ceb155038b3de68e2bb2fa8fc37011a001e8480028201d81842182a021a0002a09da0f5f6";

	const unsignedBytes = helios.hexToBytes(unsignedHex);

	let inlineDatum = new helios.InlineDatum(new helios.IntData(42n));

	console.log(helios.bytesToHex(inlineDatum.toCbor()));
	
	console.log(helios.bytesToHex(helios.CborData.encodeHead(6, 24n)));

	let tx = helios.Tx.fromCbor(unsignedBytes);

	console.log(JSON.stringify(tx.dump(), undefined, 4));

}

async function testSubmitOwner() {
	const unsignedHex = "84a60082825820088ce1fbcfb1a3221ea274921759bf7adb30beec750cc3ae50657b70d5138a8d00825820e2b4ec8b1ffa64082238c8a8963fd2b56e5e7256d4ce45f0e21f33c696d44da8010d81825820e2b4ec8b1ffa64082238c8a8963fd2b56e5e7256d4ce45f0e21f33c696d44da8010182a200583900d0d62ed8c1582b2459bafdcd6fe4eabd4b5d836478e81fb05168112e6403bccce5e41e05f3b8dc3d23d71deeb2077a6bf7e62c5c274b58ed011b0000000253fbe141a200583900d0d62ed8c1582b2459bafdcd6fe4eabd4b5d836478e81fb05168112e6403bccce5e41e05f3b8dc3d23d71deeb2077a6bf7e62c5c274b58ed01821a00153e02a1581c919d4c2c9455016289341b1a14dedf697687af31751170d56a31466ea14001021a000395110e81581cc1585421b224463e11264c1411e9e3346a3d6fa99b2ffc449aa267dc0b58203c3888dfdaa574e916814ae22c3e8abb75885a4a3e32c6c423bf0b9a9635c7a4a2068159043159042e01000032323232323232323232323232323222233335734646666ae68cc034004c02c01092891980691919999ab9a3370e6aae74dd5000a40044494488cc048018c0400052600130070062332232330010013300f00300222333357346ae8c0049289191999ab9a3011332232330010013301500300222333357346ae8c0049289191999ab9a30173017337106602c00c0026602c00a00249408cc014014d5d100224c6ae84009263300f0060013300f00500124a046600a00a6ae880112635742004931bab323333001001323330010013758601200a4660224646666ae68cdc39aab9d37540029000119baf301300c30133333573466e1cd55ce9baa00248000800c992624a09318089808801119baf323333573466e1cd55ce800a400446ae84d55cf00112601014000498dd518058011aab9d3233300100137566ae84d5d11aba2301500823375e6aae78004d5d0980b8061111999ab9a357460044c46666ae68c008d5d080191aba10042333005005357440080069324c4446666ae68d5d1801125eb808cccd5cd18011aba100323357406ae84010ccc014014d5d100200191998028029aba20040034992622332232374c6660020026602400600497adef6c60222333357346ae8c00880088cc88c8cccd5cd1aba30012003233574066ec0010dd3001001a4c6644646660020026603400600497adef6c60222333357346ae8c00880088cc88c8cccd5cd19b8700148000800c8cd5d019bb000437500040069319b803301d0080023301d007002357420066660080086ae8800c009263301400800233014007002357420066660080086ae8800c0092637560046eacc02c00530101a0002222333357346ae8c00c80088cccc014014d5d1002001998018011aba1004498dd5980400324c60140024931324c46ae84c0300048d5d09806000911919800800801911999ab9a35746002497adef6c6023333573466ebcd55ce9aba1002004237566aae78d5d08019198020021aba2003499262232333001001003002222333357346ae8c0089200023333573466ebcd55ce9aba10030022375a6aae78d5d080211998028029aba2004003499262333573400294128911919191998008009998010010018020019111999ab9a357460024006466ae80d5d08011998020020019aba2002498888cccd5cd1aba300124bd701191999ab9a3301100623375e002004466600c00c00a6ae880108cd5d00011998030030029aba2004498d55ce9aba1002498c8cc00400400c88cccd5cd1aba300124bd70119aba035573a6ae84008cc00c00cd5d100124c46ae84c02000488cccd5cd180124c4600493125049888cc020dd61aba1300300223375e00200446ae88d5d11aba2357446ae88c0080048d5d1180100091aba23002001235744600400246aae78dd500091191998008008018011111999ab9a3574600449408cccd5cd18011aba100324a2466600a00a6ae8801000d264990581840000182a821956e51a0070986af5f6";

	const unsignedBytes = helios.hexToBytes(unsignedHex);

	let tx = helios.Tx.fromCbor(unsignedBytes);

	console.log(JSON.stringify(tx.dump(), undefined, 4));
}

async function testSwap() {
	const unsignedHex = "84a500828258204b990cce71c5d4f26ccfe1e81700fe553c43011023c07e701c66eef9b283c4c400825820821d62443a04403b78db4d2a9a3d33f221b8d285de1494f5afb5f4efbf9d464a000d818258204b990cce71c5d4f26ccfe1e81700fe553c43011023c07e701c66eef9b283c4c4000183a200583900df5399cc94ba8f9a63ff674f48611909dee0446c52972b7e455ef6266d50eace9b7c8d7043564ddadfa401b6a7916763e6d256ef71ff7a94011a3aeac9b6a300581d606ae964d974097462671b07a129d58a5b6ae79703ef5c22341bd055b6011a00abdb6e028200582014e0da399acd577bc713b0828fd42aaf7637d767966c3fe454ea2b54e95ab669a200583900df5399cc94ba8f9a63ff674f48611909dee0446c52972b7e455ef6266d50eace9b7c8d7043564ddadfa401b6a7916763e6d256ef71ff7a9401821a001344eea1581c919d4c2c9455016289341b1a14dedf697687af31751170d56a31466ea14001021a000424dc0b5820afa40ee1c23492dfefa8dbc9ac90594e6c39e25a05504e980caa461be4e7040fa2068159057e59057b010000323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323222233335734660080060024931324c44646608c46600e00800446608c46600e00a00646600c00a0066082002446606866660280026010004600a004940c01c00888c8cc8cccd5cd19b8700148008892891198070029806800a4c6aae74dd500080098028011119804800980300100201001301c91aba1300b001037223303437586006004466ebc0040080048d5d0980100091aba23002001235744600400246ae88c0080048d5d1180100091aba23002001235744602a00244446034666600a00800600400244446666ae680048ccc02801401000c8ccc01801401000d26222323301200423303223300d0020052330080020033004001237526e50dd98009119baf3300300249800488c8cccd5cd19b8735573a002900111aba135573c00446ea5220100498dd518028011111980680191981691980400100211980300100191191999ab9a3370e6aae74005200423375e0066ae84d55cf0011250498dd5180180100511191999ab9a300900123375e0066012600e004494126300430030020230222330020014800088cccd5cd19b8735573a6ea8008004800c992601f23370e6aae74dd5000a4000446e9ccc018dd6180180100080091aba13002001235744601000244666006004002030444646660020020080064446666ae68d5d1801100291999ab9a300235742006466ae80d5d08021998028029aba20040032333005005357440080069324c46660120024466010004600a0020046e98dd924c00246ae84c0080048d5d1180a800911998019119b80002001002001222332232374c666002002660200060046ec926222333357346ae8c00880088cc88c8cccd5cd1aba30012003233574066ec0010dd3001001a4c666018016660220100046602200e0046ae8400cccc010010d5d100180124c6eac008dd580091119199800800998068018011bb2498888cccd5cd1aba3002200223322323333573466e1c00520002003233574066ec0010dd4001001a4c66012660200100046602000e0046ae8400cccc010010d5d100180124c4644466600a0060040026eb0004888c8cccc00400401000c0088888cccd5cd1aba300320022333300500535744008006660060046ae840112622333003223009337100040020040024446644646600200266016006004446666ae68d5d1800925123233335734601a6660160126601400c0026601400a00249408cc014014d5d100224c6ae840092637560046eac00488c8cc00400400c88cccd5cd1aba3001237649311999ab9a3375e6aae74d5d080100211bab35573c6ae8400c8cc010010d5d1001a4c93111191980080099803801801111999ab9a3574600249448c8cccd5cd1804998039980400300099804002800925023300500535744008931aba100249888c8ccc00400400c008888cccd5cd1aba30022480008cccd5cd19baf35573a6ae8400c0088dd69aab9e35742008466600a00a6ae8801000d264988ccd5cd000a504a244646464660140060026660020020040064446666ae68d5d180090059191999ab9a3300a006001233300600600535744008466ae80008ccc018018014d5d100224c6aae74d5d080124c600600446466002002004446666ae68d5d18009003919aba035573a6ae84008cc00c00cd5d100124c4466006004466ebc00400888c8ccc00400400c008888cccd5cd1aba300224a046666ae68c008d5d080192512333005005357440080069324c6ec5262232333001001002003222333357346ae8c004800c8cd5d01aba1002333004004003357440049300091aba13002001235573c6ea800488cccd5cd180124c4600493125049888cccd5cd180124c49448c0092649810581840001182a821a0004dfea1a0694e7e9f5f6";

	const unsignedBytes = helios.hexToBytes(unsignedHex);

	let tx = helios.Tx.fromCbor(unsignedBytes);

	console.log(JSON.stringify(tx.dump(), undefined, 4));
}

async function testCancelSwap() {
	const unsignedHex = "84a60082825820034969f024144c81a2898b9c1d38cca487e7667134c0e5ba4b7d043d85010ea100825820034969f024144c81a2898b9c1d38cca487e7667134c0e5ba4b7d043d85010ea1010d81825820034969f024144c81a2898b9c1d38cca487e7667134c0e5ba4b7d043d85010ea1010182a200583900a9b05c5ba18239548c16b26cf1d4291dd1b30ff544f62bbe52e600356403bccce5e41e05f3b8dc3d23d71deeb2077a6bf7e62c5c274b58ed011a002b997fa200583900a9b05c5ba18239548c16b26cf1d4291dd1b30ff544f62bbe52e600356403bccce5e41e05f3b8dc3d23d71deeb2077a6bf7e62c5c274b58ed01821a001344eea1581c919d4c2c9455016289341b1a14dedf697687af31751170d56a31466ea14001021a000389b80e81581cd06c41bec7a285eae37c4f06b1922f0f64d7a1e17a39fe10f989efd20b5820b3e0cfd0eeabe5ab4f7643b9a8d9a452a05974e4f80046a4a3d6f596c240038ba206815903f05903ed010000323232323232323232323232323222233335734646666ae68cc014004c04001092891980991919999ab9a3370e6aae74dd5000a40044494488cc028018c0540052600130090062332232330010013301300300222333357346ae8c0049289191999ab9a3015332232330010013301900300222333357346ae8c0049289191999ab9a301b301b337106603400c0026603400a00249408cc014014d5d100224c6ae8400926330130060013301300500124a046600a00a6ae880112635742004931bab323333001001323330010013758601600a46602e4646666ae68cdc39aab9d37540029000119baf301800c30183333573466e1cd55ce9baa00248000800c992624a093180b180b001119baf323333573466e1cd55ce800a400446ae84d55cf00112601014000498dd518068011ba937286eccd5d098060051111999ab9a35746004497ae023333573460046ae8400c8cd5d01aba100433300500535744008006466600a00a6ae8801000d2649888cc88c8dd31998008009980b00180125eb7bdb180888cccd5cd1aba300220022332232333357346ae8c004800c8cd5d019bb0004374c004006931991191998008009980f00180125eb7bdb180888cccd5cd1aba3002200223322323333573466e1c00520002003233574066ec0010dd4001001a4c66e00cc084020008cc08401c008d5d08019998020021aba2003002498cc060020008cc06001c008d5d08019998020021aba2003002498dd58011bab300e0014c0101a0002222333357346ae8c00c80088cccc014014d5d1002001998018011aba1004498dd5980580324c601e0024931324c44660186eb0d5d09aba2357446ae88d5d11aba2300300223375e00200446ae88c00c0048d5d0980100091aba23003001235742600400246ae88c02000488c8cc00400400c88cccd5cd1aba300124bd6f7b63011999ab9a3375e6aae74d5d080100211bab35573c6ae8400c8cc010010d5d1001a4c9311191998008008018011111999ab9a357460044900011999ab9a3375e6aae74d5d080180111bad35573c6ae840108ccc014014d5d1002001a4c931199ab9a0014a094488c8c8c8ccc004004ccc00800800c01000c888cccd5cd1aba3001200323357406ae84008ccc01001000cd5d100124c4446666ae68d5d1800925eb808c8cccd5cd19804803119baf001002233300600600535744008466ae80008ccc018018014d5d100224c6aae74d5d080124c6466002002006446666ae68d5d1800925eb808cd5d01aab9d35742004660060066ae88009262232333001001003002222333357346ae8c00892811999ab9a30023574200649448ccc014014d5d1002001a4c9311aba13002001235573c6ea800488cccd5cd180124c460049312504990581840000182a8219548d1a006e7d5af5f6";

	const unsignedBytes = helios.hexToBytes(unsignedHex);

	let tx = helios.Tx.fromCbor(unsignedBytes);

	console.log(JSON.stringify(tx.dump(), undefined, 4));
}

async function writeBin() {
	const hex = "010000333323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323222233335734660080060024931324c44646608c46600e00800446608c46600e00a00646600c00a0066082002446606866660280026010004600a004940c01c00888c8cc8cccd5cd19b8700148008892891198070029806800a4c6aae74dd500080098028011119804800980300100201001301c91aba1300b001037223303437586006004466ebc0040080048d5d0980100091aba23002001235744600400246ae88c0080048d5d1180100091aba23002001235744602a00244446034666600a00800600400244446666ae680048ccc02801401000c8ccc01801401000d26222323301200423303223300d0020052330080020033004001237526e50dd98009119baf3300300249800488c8cccd5cd19b8735573a002900111aba135573c00446ea522100498dd518028011111980680191981691980400100211980300100191191999ab9a3370e6aae74005200423375e0066ae84d55cf0011250498dd5180180100511191999ab9a300900123375e0066012600e004494126300430030020230222330020014800088cccd5cd19b8735573a6ea8008004800c992601f23370e6aae74dd5000a4000446e9ccc018dd6180180100080091aba13002001235744601000244666006004002030444646660020020080064446666ae68d5d1801100291999ab9a300235742006466ae80d5d08021998028029aba20040032333005005357440080069324c46660120024466010004600a0020046e98dd924c00246ae84c0080048d5d1180a800911998019119b80002001002001222332232374c666002002660200060046ec926222333357346ae8c00880088cc88c8cccd5cd1aba30012003233574066ec0010dd3001001a4c666018016660220100046602200e0046ae8400cccc010010d5d100180124c6eac008dd580091119199800800998068018011bb2498888cccd5cd1aba3002200223322323333573466e1c00520002003233574066ec0010dd4001001a4c66012660200100046602000e0046ae8400cccc010010d5d100180124c4644466600a0060040026eb0004888c8cccc00400401000c0088888cccd5cd1aba300320022333300500535744008006660060046ae840112622333003223009337100040020040024446644646600200266016006004446666ae68d5d1800925123233335734601a6660160126601400c0026601400a00249408cc014014d5d100224c6ae840092637560046eac00488c8cc00400400c88cccd5cd1aba3001237649311999ab9a3375e6aae74d5d080100211bab35573c6ae8400c8cc010010d5d1001a4c93111191980080099803801801111999ab9a3574600249448c8cccd5cd1804998039980400300099804002800925023300500535744008931aba100249888c8ccc00400400c008888cccd5cd1aba30022480008cccd5cd19baf35573a6ae8400c0088dd69aab9e35742008466600a00a6ae8801000d264988ccd5cd000a504a244646464660140060026660020020040064446666ae68d5d180090059191999ab9a3300a006001233300600600535744008466ae80008ccc018018014d5d100224c6aae74d5d080124c600600446466002002004446666ae68d5d18009003919aba035573a6ae84008cc00c00cd5d100124c4466006004466ebc00400888c8ccc00400400c008888cccd5cd1aba300224a046666ae68c008d5d080192512333005005357440080069324c6ec5262232333001001002003222333357346ae8c004800c8cd5d01aba1002333004004003357440049300091aba13002001235573c6ea800488cccd5cd180124c4600493125049888cccd5cd180124c49448c0092649930134d8799f581c64d0e11d7d32e345cf20a2bbde09b1884087c439bef1531b87b3e83ba140a1401a00abdb6ed87a9fff1a0034c1a0ff004c0102182a004c01ffd8799fd8799f9fd8799fd8799fd8799f582029ba4bd98298e60542cc0ba83e4d38f0319011b258a7dedeae89ceace39f6a31ff00ffd8799fd8799fd87a9f581c0bc5231c5597583c47bc767ec06b7c4bbec4b606f347695acd143a6cffd87a9fffffa240a1401a001344ee581c919d4c2c9455016289341b1a14dedf697687af31751170d56a31466ea14001d87b9fd8799f581c64d0e11d7d32e345cf20a2bbde09b1884087c439bef1531b87b3e83ba140a1401a00abdb6ed87a9fff1a0034c1a0ffffd87a9fffffffd8799fd8799fd8799f58204b990cce71c5d4f26ccfe1e81700fe553c43011023c07e701c66eef9b283c4c4ff00ffd8799fd8799fd8ff799f581cebda61d967aab7c4211599106a42e0631fb3ede04d3d832fad866ec4ffd8799fd8799fd8799f581c6d50eace9b7c8d7043564ddadfa401b6a7916763e6d256ef71ff7a94ffffffffa140a1401a3b9aca00d8799fffd87a9fffffffff9fff9fd8799fd8799fd8799f581c64d0e11d7d32e345cf20a2bbde09b1884087c439bef1531b87b3e83bffd87a9fffffa140a1401a00abdb6ed87a9f582017bfb8c00dd15c3edf2e1a39865990d16e32bad62aecaeb8a04395009f679982ffd87a9fffffd8799fd8799fd8799f581cdf5399cc94ba8f9a63ff674f48611909dee0446c52972b7e455ef626ffd8799fd8799fd8799f581c6d50eace9b7c8d70f943564ddadfa401b6a7916763e6d256ef71ff7a94ffffffffa240a1401a001344ee581c919d4c2c9455016289341b1a14dedf697687af31751170d56a31466ea14001d8799fffd87a9fffffffa0a09fffa0d8799fd8799fd8799fffd87a9fffffd8799fd87b9fffd87a9fffffff9fffa1d87a9fd8799fd8799f582029ba4bd98298e60542cc0ba83e4d38f0319011b258a7dedeae89ceace39f6a31ff00ffff182aa0d8799f58200000000000000000000000000000000000000000000000000000000000000000ffffd87a9fd8799fd8799f582029ba4bd98298e60542cc0ba83e4d38f0319011b258a7dedeae89ceace39f6a31ff00ffffff0001";

	const bytes = new Uint8Array(helios.hexToBytes(hex));
	fs.writeFileSync("./program.flat", bytes);
}

async function swapSimplified() {
	const unsignedHex = "84a500828258204b990cce71c5d4f26ccfe1e81700fe553c43011023c07e701c66eef9b283c4c400825820a6b79f3e354f3e9b01dd9898b4a56ab0af98ceca109ebcca3567f5b2f558a55b000d818258204b990cce71c5d4f26ccfe1e81700fe553c43011023c07e701c66eef9b283c4c4000182a200583900df5399cc94ba8f9a63ff674f48611909dee0446c52972b7e455ef6266d50eace9b7c8d7043564ddadfa401b6a7916763e6d256ef71ff7a94011a3aff2fe7a200581d606accbc9b4d1272bba5df3bcb4203a97ad2316cd5ace1baa98b12012501821a00aaac62a1581c919d4c2c9455016289341b1a14dedf697687af31751170d56a31466ea14001021a000303990b5820b4033dc26a19e7cebadf688f8bf02f5ff397922d374e3f6f143152f6fb41a7eea206815901335901300100003232323232323232323232323232323232323232323232323232323222233335734660080060024931324c44646603c46600c00800446600a0080046034002446602e60260024646646666ae68cdc3800a4000446602c602a002601200e449412635573a6ea8004004c040c03c00488cc010004c00c00805888cc054dd61801801119baf001002001235742600400246ae88c0080048d5d1180100091aba23002001235744600400246ae88c0080048d5d118048008060058050009119baf002001001235742600400246ae88c0080048d5d118030009191198020010009bac0012232333001001003002222333357346ae8c00892811999ab9a30023574200649448ccc014014d5d1002001a4c9300091aba13002001235573c6ea800488cccd5cd180124c49448c00926498105818400011b0000536c1d46944b8219f33d1a01358e93f5f6";

	const unsignedBytes = helios.hexToBytes(unsignedHex);

	let tx = helios.Tx.fromCbor(unsignedBytes);

	console.log(JSON.stringify(tx.dump(), undefined, 4));
}

async function main() {
    await testBasic();

    await testMinting();
    
    await testMinting(true);

	await testInlineDatum();

	await testSubmitOwner();

	await testSwap();

	//await writeBin();

	await testCancelSwap();

	await swapSimplified();
}

main();
