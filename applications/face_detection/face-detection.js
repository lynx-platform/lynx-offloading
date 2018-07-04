const {
  cv,
  getDataFilePath,
  drawBlueRect
} = require('../utils');

const image = cv.imread(getDataFilePath('got.jpg'));
const classifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_ALT2);

// detect faces
console.time('execution-time');
const { objects, numDetections } = classifier.detectMultiScale(image.bgrToGray());
console.log('faceRects:', objects);
console.log('confidences:', numDetections);
console.timeEnd('execution-time');

if (!objects.length) {
  throw new Error('No faces detected!');
}

/*
// draw detection
const numDetectionsTh = 10;
objects.forEach((rect, i) => {
  const thickness = numDetections[i] < numDetectionsTh ? 1 : 2;
  drawBlueRect(image, rect, { thickness });
});
*/
