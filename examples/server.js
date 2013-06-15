var express = require('express');
var http = require('http');
var path = require('path');
var fs = require('fs');
var app = express();
var server = http.createServer(app);

// To avoid a circular dependency, we include a local copy of barry-io here.
//
// In real life, you should use:
// var barry = require('barry-io').listen(server);
var barry = require('./barry-io').listen(server);

app.set('port', process.env.PORT || 5180);
app.use(express.static(__dirname + '/'));

app.get('/barry.js', function (req, res) {
  res.sendfile(path.resolve(__dirname + '/../build/js/barry.js'));
});

/*app.get('/', function (req, res) {
  res.redirect('/index.html');
});*/

app.get('/', function (req, res) {
  res.sendfile('/index.html');
});

server.listen(app.get('port'), function(){
  console.log('Barry examples server listening on port ' + app.get('port'));
});

fs.readdir(__dirname, function(err, list) {
  if (err) return console.error(err);

  list.forEach(function(file) {
    if (!file.match(/^[0-9]{2}_.*/)) return;

    require(__dirname+'/'+file+'/server.js')(barry);
  });
});
