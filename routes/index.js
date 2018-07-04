var express = require('express');
var router = express.Router();
var request = require('request');
var fs = require('fs');
var os = require('os');
var multer = require('multer');


var imagenum = 0;
const port = process.env.PORT || 8910;
var myIp = 'http://192.168.0.7';
const myAddress = '' + port;
const dnsAddress = 'http://192.168.0.9:5511';
const programList = ['0', '1', '2'];
console.log(__dirname);
var send_s, send_e;

var deviceMap = {}; // request as a client
var deviceAvailable = {}; // record availabe devices

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* Check EdgeServer is alive */
router.post('/connection', function(req, res, next){
  console.log(req.body);
  console.log(req.connection.remoteAddress);
  console.log(req.body.program);
  programList.forEach((pid) => {
    if (pid == req.body.program){
      res.send({
          msg: 'available',
          url: myIp,
        });
    }
  });
  res.send();
});

const baseProgramPath = '../applications/';
const downloadPath = './public/input/';

router.post('/input', function(req, res, next){
  download(req.body.uri, downloadPath + req.body.title, () => {
    console.log('target image : ' + req.body.title);
    const program = require(baseProgramPath + '/' + 'inception.js');
    var time = Date.now();
    var output = program.run( downloadPath + req.body.title);
    time = Date.now() - time;
    console.log('execution time : ' + time + ' ms');
    res.send({
      output: output,
      time: time,
    });
  });
});

/* announce liveness */
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
        setInterval(aliveSignal(), 5000);
        return;
      }
      console.log('No response from DNS');
    });
}

/* get device list from DNS server */
function requestList(){
    console.log(dnsAddress);
  request.get({
    url: dnsAddress + '/devicelist/',
  },
    function(err, res, body){
      if (res != undefined && res.statusCode == 200){
        deviceMap = JSON.parse(body);
        console.log(deviceMap);
	    connection();
        return;
      }
      console.log('No response from DNS');
    });
}
requestList();

/* make a query to Edge devices if they are available */
function connection(){
  deviceAvailable = {};
  var current = Date.now();
  Object.keys(deviceMap).forEach(function(address){
    deviceMap[address].forEach(function(obj){
      url = 'http://' + obj.ip + ':' + obj.port;
      request.post({
        url: url + '/connection',
        form: {
          port: port,
          program: '0'
        }},
        function(err, res, body){
            body = JSON.parse(body);
          if ( res != undefined && res.statusCode == 200){
            if (body.msg == 'available' && (Date.now() < current + 10000)){ //TODO: waiting time should be decided considering device's execution time
              console.log('available : ' + body.url);
              deviceAvailable[body.url] = {
                available: true, //TODO: use program id to identify available devices
              };
		      console.log(deviceAvailable);
              //sendInput('banana.jpg');
              send_s = Date.now();
              sendInput(''+imagenum+'.jpg');
            }
            return;
          }
          console.log('failed connection with ' + url);
        });
    });
  });
}

/* send input data to available edge devices */
function sendInput(img){
  Object.keys(deviceAvailable).forEach(function(url){
    request.post({
      url: url + '/input/',
      form: {
          uri: myIp + ':' + port + '/images/' + img, //:port ->myIp
        title: img,
      }}, function(err, res, body){
              send_e = Date.now();
              console.log('execution time : ' + (send_e - send_s));
              send_s = send_e;
        console.log(body);
        if (imagenum < 9) { 
            imagenum++
            sendInput(''+imagenum+'.jpg');
        }
      });
  });
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

module.exports = router;
