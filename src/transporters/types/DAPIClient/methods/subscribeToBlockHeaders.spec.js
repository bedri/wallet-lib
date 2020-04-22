const { expect } = require('chai');
const transporters = require('../../../index');
const EVENTS = require('../../../../EVENTS');


const fixtures = [
  ['00000120f4203130375fe8684b6b85415594c7a9374074026e59dbb46da42489', '00000020a586b835e3d642fb81f6624163e50ec381c7dcd11832e8cdbd670510a200000082bd70bf47542dbed1dacf9e5dc67f44c553a0bd5a1abdd5fc7198e8361b8f7cbdb2555ecaaf011ebcfe00000203000500010000000000000000000000000000000000000000000000000000000000000000ffffffff05024525010affffffff0240c3609a010000001976a914ecfd5aaebcbb8f4791e716e188b20d4f0183265c88ac40c3609a010000001976a914ecfd5aaebcbb8f4791e716e188b20d4f0183265c88ac0000000046020045250000476416132511031b71167f4bb7658eab5c3957d79636767f83e0e18e2b9ed7f8000000000000000000000000000000000000000000000000000000000000000003000600000000000000fd4901010045250000010001f7c884225958d983e935a77322a10a8f0acb2fde388762f0c5dabba19f000000320000000000000032000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'],
  ['000000b2832efed61899f1800542722bc9acb688937027824ff012ab0d3aca06', '000000208924a46db4db596e02744037a9c7945541856b4b68e85f37303120f42001000079500e16a28a2c049657174c5df6e409246abbae40d5ebe73b5e652a3f8128862bb4555ef0af011ec98200000203000500010000000000000000000000000000000000000000000000000000000000000000ffffffff05024625010effffffff0240c3609a010000001976a914ecfd5aaebcbb8f4791e716e188b20d4f0183265c88ac40c3609a010000001976a914ecfd5aaebcbb8f4791e716e188b20d4f0183265c88ac0000000046020046250000476416132511031b71167f4bb7658eab5c3957d79636767f83e0e18e2b9ed7f8000000000000000000000000000000000000000000000000000000000000000003000600000000000000fd4901010046250000010001f7c884225958d983e935a77322a10a8f0acb2fde388762f0c5dabba19f000000320000000000000032000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'],
  ['000000cd464d3f00fea2c3e92a24d0edec1cc2a2579397bfcb9a7f6d994e7508', '0000002006ca3a0dab12f04f8227709388b6acc92b72420580f19918d6fe2e83b2000000ee66f18278bf8c4cc2ff47a8404e30ccd3372424fe1a63f3d236f602adb730eb92b4555e01b6011e032200000203000500010000000000000000000000000000000000000000000000000000000000000000ffffffff05024725010affffffff0240c3609a010000001976a914ecfd5aaebcbb8f4791e716e188b20d4f0183265c88ac40c3609a010000001976a914ecfd5aaebcbb8f4791e716e188b20d4f0183265c88ac0000000046020047250000476416132511031b71167f4bb7658eab5c3957d79636767f83e0e18e2b9ed7f8000000000000000000000000000000000000000000000000000000000000000003000600000000000000fd4901010047250000010001f7c884225958d983e935a77322a10a8f0acb2fde388762f0c5dabba19f000000320000000000000032000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'],
];

describe('transporters - DAPIClient - .subscribeToBlockHeaders', function suite() {
  this.timeout(21000);
  const transporter = transporters.resolve({ type: 'DAPIClient' });
  it('should works', async () => new Promise(async (resolve, reject) => {
    await transporter.isReady();
    let getBestBlockHashCalled = 0;
    const blockHeaderAnnounced = [];
    transporter.client.getBestBlockHash = () => {
      const blockHash = fixtures[getBestBlockHashCalled][0];
      getBestBlockHashCalled += 1;
      return blockHash;
    };
    transporter.client.getBlockByHash = (hash) => new Buffer.from(fixtures.find((el) => el[0] === hash)[1], 'hex');
    transporter.on(EVENTS.BLOCKHEADER, (ev) => {
      expect(ev.type).to.equal(EVENTS.BLOCKHEADER);
      blockHeaderAnnounced.push(ev.payload);

      if (getBestBlockHashCalled === 2) {
        blockHeaderAnnounced.forEach((blockHeader, index) => {
          expect(fixtures[index][1].startsWith(blockHeader.toString('hex'))).to.equal(true);
        });
        resolve();
      }
    });
    await transporter.subscribeToBlockHeaders();
  }));
  after(() => {
    transporter.disconnect();
  });
});
