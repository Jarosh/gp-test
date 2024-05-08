const { workerData, parentPort } = require('worker_threads');
const { random } = require('lodash');

setTimeout(() => {
  parentPort.postMessage({
    email: workerData.email,
    isValid: Math.random() < 0.5,
  });
}, random(1000 * 5, 1000 * 100));
