var express = require('express');
var router = express.Router();
var request = require('request');
var fs = require('fs');
var multer = require('multer');

const port = process.env.PORT || 8910;
console.log(port);
console.log(__dirname);

var edgeList = {};
var cliendList = {};

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log('bbb');
  res.send(200);
  //res.render('index', { title: 'Express' });
});

router.post('/', function(req, res, next) {
  console.log('ccc');
  res.send();
  //res.render('index', { title: 'Express' });
});

const baseImgPath = '../applications/hdack_opencv/data/images';
var targetImg = 'banana.jpg';

function requestEdgeList(){
  /*
  request.post({
    url: 'http://lynx.snu.ac.kr:8913' + '/devicelist',
    form: {
      address: 0,
    }},
    function(err, res, body){
      if (res != undefined && res.statusCode == 200){
        console.log(res.statusCode);
        edgeList = body.deviceMap;
        console.log(edgeList);
        return;
      }
      console.log('No response from DNS');
    });
*/
  request.get({
    url: 'http://lynx.snu.ac.kr:8913' + '/devicelist',
  },
    function(err, res, body){
      if (res != undefined && res.statusCode == 200){
        console.log(res.statusCode);
        edgeList = body;
        console.log(edgeList);
        return;
      }
      console.log('No response from DNS');
    });
}

router.post('/check', function(req, res, next){

  console.log(req.body);
  console.log(req.connection.remoteAddress);
  res.send();
});

function checkConnection(url){
  request.post({
    url: url + '/check',
    form: {
      port: port,
      program: '0'
    }},
    function(err, res, body){
      if ( res != undefined && res.statusCode == 200){
        console.log('live');
        return;
      }
      console.log('failed connection with ' + url);
    });
}

function sendInputData(url){
  request.post({
    url: url,
    form: {
      address: 0,
      port: 8910,
    }}
  );
}

function download(uri, filename, callback){
  request.head(uri, function(err, res, body){
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
  });
};

download('http://lynx.snu.ac.kr:8913/images/banana.jpg', 'save.jpg', function(){
    console.log('done');
});

//requestEdgeList();
//checkConnection('http://lynx.snu.ac.kr:8913');

module.exports = router;
