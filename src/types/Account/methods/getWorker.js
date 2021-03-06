const {
  UnknownWorker,
} = require('../../../errors');
/**
 * Get a worker by it's name
 * @param {string} workerName
 * @return {*}
 */
function getWorker(workerName) {
  const loweredWorkerName = workerName.toLowerCase();
  const workersList = Object.keys(this.plugins.workers).map((key) => key.toLowerCase());
  if (workersList.includes(loweredWorkerName)) {
    return this.plugins.workers[loweredWorkerName];
  }
  throw new UnknownWorker(loweredWorkerName);
}

module.exports = getWorker;
