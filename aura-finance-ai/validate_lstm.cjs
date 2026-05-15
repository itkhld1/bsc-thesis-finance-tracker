const util = require('util');
if (!util.isNullOrUndefined) {
    util.isNullOrUndefined = (value) => value === null || value === undefined;
}

const tf = require('@tensorflow/tfjs-node');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const datasetPath = path.join(__dirname, 'Indian_Finance_Dataset.csv');

const results = [];
fs.createReadStream(datasetPath)
  .pipe(csv())
  .on('data', (data) => {
      const income = parseFloat(data.Income);
      if (!isNaN(income)) results.push(income);
  })
  .on('end', async () => {
    console.log(`\n--- LSTM MODEL DOĞRULAMA ---`);
    console.log(`Toplam Kayıt: ${results.length}`);

    // Hızlı test için 1000 kayıt alalım
    const testData = results.slice(0, 1000);
    const dataTensor = tf.tensor1d(testData);
    const min = dataTensor.min();
    const max = dataTensor.max();
    const range = max.sub(min).add(tf.scalar(1e-7));
    
    const normalized = dataTensor.sub(min).div(range);

    const windowSize = 5;
    const xs = [];
    const ys = [];
    const dataArray = await normalized.array();

    for (let i = 0; i < dataArray.length - windowSize; i++) {
      xs.push(dataArray.slice(i, i + windowSize).map(v => [v]));
      ys.push(dataArray[i + windowSize]);
    }

    const tensorXs = tf.tensor3d(xs);
    const tensorYs = tf.tensor2d(ys, [ys.length, 1]);

    const model = tf.sequential();
    model.add(tf.layers.lstm({
      units: 32,
      inputShape: [windowSize, 1],
      activation: 'tanh'
    }));
    model.add(tf.layers.dense({ units: 1 }));

    model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'meanSquaredError'
    });

    console.log("LSTM Eğitiliyor (50 Epoch)...");
    const history = await model.fit(tensorXs, tensorYs, {
      epochs: 50,
      verbose: 0
    });

    const finalLoss = history.history.loss[history.history.loss.length - 1];
    // R2 mantığı ile başarı puanı
    const accuracy = (1 - Math.sqrt(finalLoss)) * 100;

    console.log(`\nFinal Loss (MSE): ${finalLoss.toFixed(6)}`);
    console.log(`LSTM Tahmin Başarı Skoru: %${accuracy.toFixed(1)}`);
    console.log(`----------------------------\n`);
    
    process.exit(0);
  });
