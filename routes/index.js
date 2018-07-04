var express = require('express');
var router = express.Router();
var request = require('request');
var fs = require('fs');
var os = require('os');
var multer = require('multer');

const port = process.env.PORT || 8910;
var myIp;
getMyIp();
console.log(myIp);
const myAddress = '' + port;
const dnsAddress = 'http://lynx.snu.ac.kr:5511';
const programList = ['0', '1', '2'];
console.log(__dirname);

var deviceMap = {}; // request as a client
var deviceAvailable = {}; // record availabe devices

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('index', { title: 'Express' });
});

/* Check EdgeServer is alive */
router.post('/connection', function(req, res, next){
  console.log(req.body);
  console.log(req.connection.remoteAddress);
  console.log(req.body.program);
  programList.forEach((pid) => {
    if (pid == req.body.program){
      res.send('available');
    }
  });
  res.send();
});
requestList();
const baseImgPath = '../applications/hdack_opencv/data/images';
var targetImg = 'banana.jpg';

function aliveSignal(){
  request.put({
    url: dnsAddress + '/devicelist/' + myAddress,
    form: {
      port: port,
    }},
    function(err, res, body){
      if (res != undefined && res.statusCode == 200){
        deviceMap = body;
        console.log(deviceMap);
        return;
      }
      console.log('No response from DNS');
    });
}

function requestList(){
  request.get({
    url: dnsAddress + '/devicelist/',
  },
    function(err, res, body){
      if (res != undefined && res.statusCode == 200){
        deviceMap = JSON.parse(body);
        console.log(deviceMap);
        console.log(typeof(deviceMap));
        connection();
        return;
      }
      console.log('No response from DNS');
    });
}

function connection(){
  deviceAvailable = {};
  var current = Date.now();
  Object.keys(deviceMap).forEach(function(address){
    deviceMap[address].forEach(function(obj){
      url = 'http://' + obj.ip + ':' + obj.port;
      console.log(url);
      request.post({
        url: url + '/connection',
        form: {
          port: port,
          program: '0'
        }},
        function(err, res, body){
          if ( res != undefined && res.statusCode == 200){
            console.log('live');
            if (body == 'available' && (Date.now() < current + 10000)){ //TODO: waiting time should be decided considering device's execution time
              console.log('available');
              deviceAvailable[url] = {
                available: true, //TODO: use program id to identify available devices
              };
            }
            return;
          }
          console.log('failed connection with ' + url);
        });
    });
  });
}

function sendInput(url, img){
  request.post({
    url: url + '/input/',
    form: {
      uri: myIp + '/images/' + img
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

function getMyIp(){
  var ifaces = os.networkInterfaces();
  Object.keys(ifaces).forEach(function(ifname){
    var alias = 0;
    ifaces[ifname].forEach(function(iface){
      if('IPv4' !== iface.family || iface.internal !== false){
        return;
      }
      if (alias >= 1){
        console.log('1' + iface.address);
      }
      else {
        myIp = 'http://' + iface.address + ':' + port;
      }
      ++alias;
    });
  });
}

/*
download('http://lynx.snu.ac.kr:8913/images/banana.jpg', 'save.jpg', function(){
    console.log('done');
});
*/

//requestEdgeList();
//checkConnection('http://lynx.snu.ac.kr:8913');
//sendInput(dnsAddress, 'banana.jpg');

module.exports = router;
