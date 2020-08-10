const logger = require('../../../../logger');

/**
 *
 * @param {number} fromBlockHeight
 * @param {number} count
 * @param {string} network
 * @return {Promise<undefined>}
 */
module.exports = async function syncUpToTheGapLimit(fromBlockHeight, count, network) {
  const self = this;
  const addresses = this.getAddressesToSync();
  let currentBlockHeight = fromBlockHeight;
  logger.debug(`syncing up to the gap limit: - fromBlockHeight: ${fromBlockHeight} Count: ${count}`);
  const stream = await this.transport
    .subscribeToTransactionsWithProofs(addresses, { fromBlockHeight, count });

  if (self.stream) {
    throw new Error('Limited to one stream at the same time.');
  }
  self.stream = stream;

  return new Promise((resolve, reject) => {
    stream
      .on('data', (response) => {
        const merkleBlockFromResponse = this.constructor
          .getMerkleBlockFromStreamResponse(response);

        if (merkleBlockFromResponse) {
          self.importBlockHeader(merkleBlockFromResponse.header, currentBlockHeight);
          currentBlockHeight += 1;
        }

        const transactionsFromResponse = this.constructor
          .getTransactionListFromStreamResponse(response);
        const walletTransactions = this.constructor
          .filterWalletTransactions(transactionsFromResponse, addresses, network);

        if (walletTransactions.transactions.length) {
          const addressesGeneratedCount = self.importTransactions(walletTransactions.transactions);

          if (addressesGeneratedCount > 0) {
            logger.silly('TransactionSyncStreamWorker - end stream - new addresses generated');
            // If there are some new addresses being imported
            // to the storage, that mean that we hit the gap limit
            // and we need to update the bloom filter with new addresses,
            // i.e. we need to open another stream with a bloom filter
            // that contains new addresses.

            // DO not setting null this.stream allow to know we
            // need to reset our stream (as we pass along the error)
            stream.cancel();
            // });
            // this.syncIncomingTransactions = false;
          }
        }
      })
      .on('error', (err) => {
        logger.silly('TransactionSyncStreamWorker - end stream on error');
        self.stream = null;
        stream.cancel();
        reject(err);
      })
      .on('end', () => {
        logger.silly('TransactionSyncStreamWorker - end stream on request');
        self.stream = null;
        resolve();
      });
  });
};