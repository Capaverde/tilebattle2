const { PeerServer } = require('peer');
const peerServer = PeerServer({ port: 9000, path: '/myapp' });








var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

/* app.get('/', (req, res) => {
  res.sendFile(__dirname + '../client/index.html');
});

app.get('/play.html', (req, res) => {
  res.sendFile(__dirname + '../client/play.html');
}); */

app.use(express.static('./client'));

//appt.get('/js/play.js' 

var base62 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function R(n) {
  return Math.floor(Math.random()*n);
}
function genPredId(N){
  var str = "";
  for (var i = 0; i<N;i++){
    var j = R(base62.length);
    str += base62.substr(j,1);
  }
  return str;
}


var rooms = [];  //room list for viewing
var room_passes = {};
var realrooms = {};

io.on('connection', (socket) => {
    console.log('a user connected');
    //socket.emit("greetings");
    socket.on('message', function (data) { console.log("message", data); });

    socket.on("getrooms", function () { 
        console.log("getrooms");
        //var myrooms = [];
        //for (var room in rooms){
         
        //}
        socket.emit("roomlist", rooms); 
    });

    socket.on("createroom", function (data) { 
        console.log("createroom", data); 
        var myroom = {name:genPredId(10),title:data.title, haspass: (data.pass ? "Yes" : "No"), players: 0, max_players: data.players};
        rooms.push(myroom);
        room_passes[data.name] = {name:data.name, pass:data.pass};
        socket.emit("roomcreated", {room:myroom.name});
        realrooms[myroom.name] = {name:myroom.name, players:[], sockets:[], host:false, room: myroom};
    });

    socket.on('start', (data) => { 
        console.log('start', data); 
        if (!realrooms[data.room] || realrooms[data.room].players.length == 0){
            if (!realrooms[data.room]) { return; }
            //the first to login is the host
            realrooms[data.room].host = data.id;
        }
        realrooms[data.room].players.push(data.id);
        realrooms[data.room].sockets.push(socket);
        socket.room = data.room;
        socket.myid = data.id;
        socket.emit('hostid', {id:realrooms[data.room].host});
        realrooms[data.room].room.players += 1;
      
    });

    socket.on('disconnect', function () { 
        console.log("acs disconnected");
        if (socket && socket.room && realrooms[socket.room]){
            var pl = realrooms[socket.room].players;
            pl.splice(pl.indexOf(socket.myid), 1);
            if (realrooms[socket.room].players.length == 0 || socket.myid == realrooms[socket.room].host){
                rooms.splice(rooms.indexOf(realrooms[socket.room].room), 1);
                if (socket.myid == realrooms[socket.room].host){
                    for (key in realrooms[socket.room].sockets){
                        var socket = realrooms[socket.room].sockets[key];
                        socket.emit("host left");
                    }
                }
                delete realrooms[socket.room];
            } else {
                realrooms[socket.room].room.players = pl.length;
            }
        }
   });
});



//io.on('getrooms', (socket) => {
  //console.log('getrooms was received');
//});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
