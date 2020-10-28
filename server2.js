const http = require('http');
var fileSystem = require('fs'),
    path = require('path');

const hostname = '127.0.0.1';
const port = 3000;


function sendFile(fileName, response){
    var filePath = path.join(__dirname, fileName);
    var stat = fileSystem.statSync(filePath);

    response.writeHead(200, {
        'Content-Type': 'text/html',
        'Content-Length': stat.size
    });

    var readStream = fileSystem.createReadStream(filePath);
    // We replaced all the event handlers with a simple call to readStream.pipe()
    readStream.pipe(response);
}


const server = http.createServer((req, res) => {
  switch(req.url){
    case "/":
    case "/index.html":
      sendFile("index.html", res);
      break;
    case "/play.html":
      sendFile("play.html", res);
      break;
    case "/js/peer.min.js":
      sendFile("js/peer.min.js", res);
    default:
      console.log(req.url);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Hello, World!\n');
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
