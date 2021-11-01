//const { PeerServer } = require('peer');
//const peerServer = PeerServer({ port: 9000, path: '/myapp' });





var port = process.env.PORT || 3000;


var express = require('express');
var app = express();
var expresspeerserver = require('peer').ExpressPeerServer;

var http = require('http').createServer(app);

var options = { debug : true };

var hostapp = require('./client/js/hostapp');

app.use('/myapp', expresspeerserver(http, options));

var io = require('socket.io')(http);

/* app.get('/', (req, res) => {
  res.sendFile(__dirname + '../client/index.html');
});

app.get('/play.html', (req, res) => {
  res.sendFile(__dirname + '../client/play.html');
}); */

app.use("/", express.static('./client'));
app.use("/mapeditor", express.static('./mapeditor'));



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


var permaroom = {name:/*genPredId(10)*/"permaroom", title:"Permaroom", haspass: "No", players: 0, max_players: 100};
rooms.push(permaroom);
room_passes[permaroom.name] = {name:permaroom.name, pass:false};
realrooms[permaroom.name] = {name:permaroom.name, players:[], sockets:[], host:false, room:permaroom, server:true, serveraddress: "127.0.0.1:3000"};

app_game_options = {size_selected:1,mode_selected:1, map_selected:1}; //medium, Team Deathmatch, Snow
hostapp.startgame(app_game_options);





io.on('connection', (socket) => {
    console.log('a user connected');
    //socket.emit("greetings");
    socket.on('message', function (data) { console.log("message", data); });

/*
        realrooms[permaroom.name].players.push(data.id);
        realrooms[permarooom.name].sockets.push(socket);
        socket.room = permaroom;
        socket.myid = data.id;
        socket.emit('hostid', {id:realrooms[permaroom.name].host});
        realrooms[data.room].room.players += 1;
*/


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
            //o primeiro a dar login é o host, excepto quando server=true
            if (!realrooms[data.room].server){
	              realrooms[data.room].host = data.id;
	          }
        }
        realrooms[data.room].players.push(data.id);
        realrooms[data.room].sockets.push(socket);
        socket.room = data.room;
        socket.myid = data.id;
	      if (!realrooms[data.room].server){
	         socket.emit('hostid', {id:realrooms[data.room].host});
	      } else {
	          socket.emit('hostid', {id:-1, server: true, serveraddress: realrooms[data.room].serveraddress});
	          hostapp.onconnection(socket);
	      }
       realrooms[data.room].room.players += 1;

       //enviar mensagens do servidor
       socket.emit('servermessage', "* WASD to move, mouse to attack, mouse to manipulate inventory. ESC toggles room view, T enters talking mode, F toggles fullscreen.");
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

http.listen(port, () => {
  console.log('listening on *:'+port);
});
