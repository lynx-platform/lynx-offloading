const cv = require('opencv4nodejs');
const path = require('path');
const fs = require('fs');

const ssdcocoModelPath = '../data/model/VGGNet'

const classNames = require('./dnnCocoClassNames');
const { extractResults } = require('./ssdUtils');
const prototxt = path.resolve(ssdcocoModelPath, 'deploy.prototxt');
const modelFile = path.resolve(ssdcocoModelPath, 'VGG_coco_SSD_300x300_iter_400000.caffemodel');

if (!fs.existsSync(prototxt) || !fs.existsSync(modelFile)) {
    console.log('exiting: could not find ssdcoco model');
    console.log('download the model from: https://drive.google.com/file/d/0BzKzrI_SkD1_dUY1Ml9GRTFpUWc/view');
    return;
}

// initialize ssdcoco model from prototxt and modelFile
const net = cv.readNetFromCaffe(prototxt, modelFile);

const classifyImg = (img) => {
  const white = new cv.Vec(255, 255, 255);
  // ssdcoco model works with 300 x 300 images
  const imgResized = img.resize(300, 300);

  // network accepts blobs as input
  const inputBlob = cv.blobFromImage(imgResized);
  net.setInput(inputBlob);

  // forward pass input through entire network, will return
  // classification result as 1x1xNxM Mat
  let outputBlob = net.forward();
  // extract NxM Mat
  outputBlob = outputBlob.flattenFloat(outputBlob.sizes[2], outputBlob.sizes[3]);

  const results = Array(outputBlob.rows).fill(0)
    .map((res, i) => {
      const className = classNames[outputBlob.at(i, 1)];
      const confidence = outputBlob.at(i, 2);
      const topLeft = new cv.Point(
        outputBlob.at(i, 3) * img.cols,
        outputBlob.at(i, 6) * img.rows
      );
      const bottomRight = new cv.Point(
        outputBlob.at(i, 5) * img.cols,
        outputBlob.at(i, 4) * img.rows
      );

      return ({
        className,
        confidence,
        topLeft,
        bottomRight
      })
    });

    return results;
};

const testData = [
    {
          image: '../data/images/cars.jpeg'
        },
    {
          image: '../data/images/dishes.jpg'
        }
];

testData.forEach((data) => {
    console.time('execution-time');
    const img = cv.imread(data.image);
    const predictions = classifyImg(img);
    predictions.forEach(p => console.log(p));
    console.timeEnd('execution-time');
});
