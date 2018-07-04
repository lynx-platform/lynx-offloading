const cv = require('opencv4nodejs');
const path = require('path');
const fs = require('fs');

// replace with path where you unzipped inception model
//const inceptionModelPath = './applications/data/model/inception'
const inceptionModelPath = './data/model/inception'

const modelFile = path.resolve(inceptionModelPath, 'tensorflow_inception_graph.pb');
const classNamesFile = path.resolve(inceptionModelPath, 'imagenet_comp_graph_label_strings.txt');
if (!fs.existsSync(modelFile) || !fs.existsSync(classNamesFile)) {
  console.log('exiting: could not find inception model');
  console.log('download the model from: https://storage.googleapis.com/download.tensorflow.org/models/inception5h.zip');
  return;
}

// read classNames and store them in an array
const classNames = fs.readFileSync(classNamesFile).toString().split("\n");

// initialize tensorflow inception model from modelFile
const net = cv.readNetFromTensorflow(modelFile);

const classifyImg = (img) => {
  // inception model works with 224 x 224 images, so we resize
  // our input images and pad the image with white pixels to
  // make the images have the same width and height
  const maxImgDim = 224;
  const white = new cv.Vec(255, 255, 255);
  const imgResized = img.resizeToMax(maxImgDim).padToSquare(white);

  // network accepts blobs as input
  const inputBlob = cv.blobFromImage(imgResized);
  net.setInput(inputBlob);

  // forward pass input through entire network, will return
  // classification result as 1xN Mat with confidences of each class
  const outputBlob = net.forward();

  // find all labels with a minimum confidence
  const minConfidence = 0.05;
  const locations =
    outputBlob
    .threshold(minConfidence, 1, cv.THRESH_BINARY)
    .convertTo(cv.CV_8U)
    .findNonZero();

  const result =
    locations.map(pt => ({
      confidence: parseInt(outputBlob.at(0, pt.x) * 100) / 100,
      className: classNames[pt.x]
    }))
  // sort result by confidence
    .sort((r0, r1) => r1.confidence - r0.confidence)
    .map(res => `${res.className} (${res.confidence})`);

  return result;
}

const run = (image) => {
  const img = cv.imread(image);
  const predictions = classifyImg(img);
  return predictions;
}

//run('./data/images/banana.jpg');
console.time('a');
run('./data/images/0.jpg');
console.timeEnd('a');

module.exports = {
  run: run,
}
