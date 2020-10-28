//all the things room management related

spectators = [];//contains the same as id_names
red_team = [];  //^
blue_team = []; //^

roomTitle = false;

function sendallinputs(conn){
		//send configs
		conn.send({type:'mytimelimit', value: room_game_options.timelimit});
		conn.send({type:'myscorelimit', value: room_game_options.scorelimit});
		conn.send({type:'size_selected', value: room_game_options.size_selected});
		conn.send({type:'terrain_selected', value: room_game_options.map_selected});
		conn.send({type:'gamemode_selected', value: room_game_options.mode_selected});

		conn.send({type:'lockedNames', value: lockedNames});
}

function connected(){
	updateNames();
	if (!imhost){
		drawingConnectingHost = false;
		drawingSynchronizing = true;
	} else {
		drawingConnectingSignaling = false;
		drawingRoom = true;
	}
}

function onSync(){
	drawingSynchronizing = false;
	if (gamestarted){
		showCanvas();
	} else {
		hideCanvas();
	}
	sync_d = true;
}

function showCanvas(){	//for peers
	drawingRoom = false;
	drawingGame = true;
	canvasposition = canvas.getBoundingClientRect();
}

function gameStarted(){
	//
}

function hideCanvas(){	//for peers
	drawingRoom = true;
	drawingGame = false;
}

function gameEnded(){
	//
}

function filterObj(obj,func){	//returns array
	var arr = [];
	for (var k in obj){
		if (func(obj[k])) arr.push(obj[k]);
	}
	return arr;
}

function onNick(nick){
	name_ = nick;
	if (name_.length>20) name_ = name_.substring(0,20);
		setCookie("name", name_);	//document.cookie = "name="+name_+"; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";
	
	drawingNicknamePrompt = false;
	drawingConnectingBroker = true;
	connectToBroker();
}



function selectedToBlue(){
	if(!gamestarted && imhost && selectedName && selectedFrom!=2){
		var i = id_names[selectedName];
		var lastteam = i.team;
		i.team=2;
		conns.forEach(function(conn2){conn2.send({type:'team',id:i.id,team:i.team})});
		selectedName=0;
		updateNames();
		if (i.id==myid)
			team = i.team;
		
		if (gamestarted){
			appendText("* "+i.name+" was moved to Blue");
			if (lastteam==1){
				//removeCreature
				totalRemove(i.id,lastteam);
			} else if (lastteam==0){
				//
			}
			//createCreature
			totalCreate(i.id,i.team);
		}
	}
}

function yourselfToBlue(){
	if(!gamestarted && !lockedNames && team != 2){
		var i = id_names[myid];
		var lastteam = i.team;
		i.team=2;
		team = 2;
		//conns.forEach(function(conn2){conn2.send({type:'team',id:i.id,team:i.team})});
		socketemit('team',{id:myid,team:2,lastteam:lastteam});
		//selectedName=0;
		updateNames();
	}
}

function selectedToRed(){
	if(!gamestarted && imhost && selectedName && selectedFrom!=1){
		var i = id_names[selectedName];
		var lastteam = i.team;
		i.team=1;
		conns.forEach(function(conn2){conn2.send({type:'team',id:i.id,team:i.team})});
		selectedName=0;
		updateNames();
		if (i.id==myid)
			team = i.team;
		
		if (gamestarted){
			appendText("* "+i.name+" was moved to Red");
			if (lastteam==2){
				//removeCreature
				totalRemove(i.id,lastteam);
			} else if (lastteam==0){
				systemmessages = [];
			}
			//createCreature
			totalCreate(i.id,i.team);
		}
	}
}

function yourselfToRed(){
	if(!gamestarted && !lockedNames && team != 1){
		var i = id_names[myid];
		var lastteam = i.team;
		i.team=1;
		team = 1;
		//conns.forEach(function(conn2){conn2.send({type:'team',id:i.id,team:i.team})});
		socketemit('team',{id:myid,team:1,lastteam:lastteam});
		//selectedName=0;
		updateNames();
	}
}

function selectedToSpec(){
	if(!gamestarted && imhost && selectedName && selectedFrom!=0){
		var i = id_names[selectedName];
		var lastteam = i.team;
		i.team=0;
		conns.forEach(function(conn2){conn2.send({type:'team',id:i.id,team:i.team})});
		selectedName=0;
		updateNames();
		if (i.id==myid)
			team = i.team;
		
		if (gamestarted){
			appendText("* "+i.name+" was moved to Spectators");
			//removeCreature
			totalRemove(i.id,lastteam);
			
			if (i.id==myid){
				newmessages.push(["* You are spectating. Press TAB to switch who you're following. Press F for free-roaming.",'']);
			} else {
				var client = clients[i.id];
				client.conn.send({type:'statusmessage', text:"* You are spectating. Press TAB to switch who you're following. Press F for free-roaming.", which:GAMEONLY});
			}
		}
	}
}

function yourselfToSpec(){
	if(!gamestarted && !lockedNames && team != 0){
		var i = id_names[myid];
		var lastteam = i.team;
		i.team=0;
		team = 0;
		//conns.forEach(function(conn2){conn2.send({type:'team',id:i.id,team:i.team})});
		socketemit('team',{id:myid,team:0,lastteam:lastteam});
		//selectedName=0;
		updateNames();
	}
}


var selectedName = 0;
var selectedFrom = 0;
var lastselecteddiv = 0;

lockedNames = false;
function lockNames(){
	lockedNames = !lockedNames;
	broadcast("lockedNames", {value: lockedNames});
}

function kickSelected(){
	if(imhost && selectedName){
		var i = id_names[selectedName];
		var conn = clients[i.id].conn;
		console.log(i, clients[i.id], conn);
		conn.send({type:"kick"});
		broadcast("kicked", {id:i.id});
		appendText("* "+i.name+" was kicked by "+id_names[myid].name);		//reason?
		i.removed = true;
		delete id_names[i.id];
		var client = clients[i.id];
		client.notinroom = true;
		if (gamestarted && client.playing){
			totalRemove(i.id,i.team);
		}
		delete clients[i.id];
		setTimeout(function () {conn.close();}, 500);
		updateNames();
		selectedName=0;
		selectedFrom=0;
	}
}

function banSelected(){
	if(imhost && selectedName){
		var i = id_names[selectedName];
		var conn = clients[i.id].conn;
		conn.send({type:"ban"});
		broadcast("banned", {id:i.id});
		appendText("* "+i.name+" was banned by "+id_names[myid].name);		//reason?
		i.removed = true;
		delete id_names[i.id];
		var client = clients[i.id];
		client.notinroom = true;
		if (gamestarted && client.playing){
			totalRemove(i.id,i.team);
		}
		delete clients[i.id];
		setTimeout(function () {conn.close();}, 500);
		updateNames();
		selectedName=0;
		selectedFrom=0;
		//
		socket.emit("ban", {id:i.id});		//hopefully the socket will block his ip. it'll actually just serve a different page. banned_ips = {myip:[roomname1,roomname2]}; rooms[roomname1].banned_ips = [myip]; If the room was deleted you'll serve him again, but this way you can block him without him even connecting to the socket. But can he connect if he runs the page locally?
	}										//the host generates a predId and sends it to the server. then the server on socket connect sends that predid to the peer. then if the peer is ip-banned he'll have no way of getting it. and the host changes the predid everytime someone is banned. OK. (no need for knowing if it is running locally)
}											//you can check if it is local by generating an id (serving it in the page). then on socket.emit('start') you send that id and check if it matches. after every match the id is changed. it expires in t seconds.

function resetNames(){
	if (gamestarted) return;
	for (var id in id_names){
		if (id_names[id].team != 0){	//economy
			id_names[id].team = 0;
			broadcast("team", {id:id,team:0});
		}
	}
	updateNames();
}

function syncToPeer(conn){	//sync the browsers' clocks
	if (imhost){
		conn.stamps = [];
		getTimeStamp(conn);
	}
}


function R(n) { return Math.floor(n*Math.random()); }

function autoNames(){
	if (gamestarted) return;	//no complication
	if (spectators.length == 0) return;
	var a = spectators[0];
	var b = spectators[1];
	if (blue_team.length != red_team.length){
		a.team = blue_team.length > red_team.length ? 1 : 2;
		broadcast("team", {id:a.id,team:a.team});
		if (a.id == myid)
			team = a.team;
	} else {
		if (b) {
			a.team = 1+R(2);
			b.team = !(a.team-1)+1;
			broadcast("team", {id:a.id,team:a.team});
			broadcast("team", {id:b.id,team:b.team});
			if (a.id == myid)
				team = a.team;
			else if (b.id == myid)
				team = b.team;
		}
	}
	updateNames();
}

function updateNames(){
	spectators = filterObj(id_names,function (x) {return x.team==0;});
	red_team = filterObj(id_names,function (x) {return x.team==1;});
	blue_team = filterObj(id_names,function (x) {return x.team==2;});
	
	roomObjects = roomObjects.filter(function (x) { return !x.nickname; }); //filterObj(roomObjects, function (x) { return !x.nickname; });	//empty nicknames
	var spec=0; var red=0; var blue=0;
	
	spectators.forEach(function (x) { createNick(x.name,0,spec++,x); });
	red_team.forEach(function (x) { createNick(x.name,1,red++,x); });
	blue_team.forEach(function (x) { createNick(x.name,2,blue++,x); });
}

function removeXSS(text){
	return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function gen_auth_hash(identifier, password){
	return CryptoJS.HmacSHA1(identifier, password).toString();
}

function hash(s, pass){
	var count = 0;
	while (count < 50){		//should take about 10ms
		s = gen_auth_hash(s, pass);		//assuming Crypto has been succesfully loaded
		count++;
	}
	return s;
}

function pos_to_string(pos){
	return "{x:" + pos.x+", y:" + pos.y + "}";
}

//chat

autoscroll = true;

CHATONLY = 1;
GAMEONLY = 2;

/*function appendText(text,name,which,team_){//false=both, 1=chatonly, 2=gameonly
	var name0 = name;
	if (!name) name0 = name = ""; else { name = "<b>"+removeXSS(name)+":</b> "; name0+=": ";}//
	//var txt = name + text;
	if (!which || which==1){
		$(conversation).append(name+removeXSS(text)+ "<br/>");
		if (autoscroll){
			var pos = $("#overflow").scrollTop();
			$("#overflow").scrollTop(pos+3000000);
		}
	}
	if (!which || which==2){
		var msg = [text,name0,team_];
		newmessages.push(msg);
		//if (!which)
			//setTimeout(function (){newmessages.splice(newmessages.indexOf(msg),1);},40000);	//in 40 seconds this message vanishes from the canvas (but not from the div chat)
	}
}*/

function appendText(text, name, which, team_){
	var name0 = name;
	if (!name) name0 = name = ""; else { name0+=": ";}
	if (team_ && gamemode_selected == 2) team_ = 3;
	var msg = [text,name0,gamestarted ? team_ : 0];
	newmessages.push(msg);
	if (which != GAMEONLY){
		chatlog.push([name,text]);
		var lines = countChatDisplay();
		mychatscroll.chatheight = Math.max(0,lines-5);
		var mHeight = mychatscroll.mHeight;	//608-460-21-21-16;
		var uLine = mHeight/lines;
		mychatscroll.y = mychatscroll.mY+mychatscroll.chatheight*uLine;
	}
}

MSGLENLIMIT = 125;

// === ROOM CANVAS ===

//objects
//. layers
//
//events


canvas = document.getElementById("MyCanvas");
ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
canvasposition = canvas.getBoundingClientRect();	//$(canvas).position();

roomCanvas = canvas;
rctx = ctx;
LAYER = 0;


//////////////////////
// 7 states --- drawingLoading --- drawingNicknamePrompt --- drawingConnectingBroker --- drawingConnectingSignaling --- drawingConnectingHost --- drawingSynchronizing --- drawingRoom --- drawingGame
drawingLoading = true;
drawingNicknamePrompt = false;
drawingConnectingBroker = false;
drawingConnectingSignaling = false;
drawingConnectingHost = false;
drawingSynchronizing = false;
drawingRoom = false;
drawingGame = false;


function draw(timestamp) {
	//TIME = timestamp;
	//console.log(timestamp);
	drawRect(0,0,canvas.width,canvas.height,"#9e9e9e");
	if (drawingLoading){
		drawLoading();
	} else if (drawingNicknamePrompt){
		drawNicknamePrompt();
	} else if (drawingConnectingBroker){
		drawConnectingBroker();
	} else if (drawingConnectingSignaling){
		drawConnectingSignaling();
	} else if (drawingConnectingHost){
		drawConnectingHost();
	} else if (drawingSynchronizing){
		drawSynchronizing();
	} else if (drawingRoom){
		drawRoom();
	} else if (drawingGame){
		drawGame();
	}
	requestAnimationFrame(draw);
}


function drawLoading() {
	drawRect(300-16,200+24,300,24+15+15,"#6e6e6e");
	ctx.font = "20px Tahoma"; ctx.fillStyle = "#FFFFFF";
	ctx.textAlign = "center";
	ctx.fillText("Loading...", 450-16, 200+24+15+20); ctx.textAlign = "start";
}

function drawNicknamePrompt() {
	drawRect(300-16,200+24,300,15+24*3+6+26+15,"#6e6e6e");200+24+15+24*3+6
	ctx.font = "20px Tahoma"; ctx.fillStyle = "#FFFFFF"; 
	ctx.fillText("Choose your nickname:", 300-16+15, 200+24+15+20);
	drawRect(300-16+15,200+24+15+20+3,300-30,3,"#8e8e8e");
	drawRect(300-16+15,200+24+15+24*2,300-30,26,"#8e8e8e");
	ctx.font = "12px Tahoma"; ctx.fillStyle = "#FFFFFF"; 
	ctx.fillText("Nickname:", 300-16+15+6, 200+24+15+24*2+12+6);
	drawRect(300-16+15+80,200+24+15+24*2+2,300-30-80-2,22,"#4e4e4e");
	
	for(var o=0; o<nnObjects.length; o++){
		var obj = nnObjects[o];
		if (obj && obj.ondraw)
			obj.ondraw(obj);
	}
}


var nnObjects = [];

nnObjects.push({x:300-16+15+80,y:200+24+15+24*2+2,width:300-30-80-2,height:22,
				ondraw: function (self){ 
							if (self.rovering) {
								canvas.style.cursor = "text";
							} else {
								canvas.style.cursor = "default";
							}
							ctx.font = "12px Tahoma"; ctx.fillStyle = "#FFFFFF"; 
							if(!self.flag && name_){
								self.flag = true;
								self.msg = name_;
							}
							var msg = self.msg || "";
							if (ctx.measureText(msg).width<=self.width)
								ctx.fillText(msg, self.x+8, self.y+12+3);
							else {
								while (ctx.measureText(msg).width>self.width){
									msg = msg.substr(1);
								}
								ctx.fillText(msg, self.x+8, self.y+12+3);
							}
							if (chatfocus == self){
								var w = ctx.measureText(msg).width;
								if (self.blinking){
									drawRect(self.x+8+w,self.y+12+3-10,1,12,"#FFFFFF");
								}
							}
				},
				onclick: function (self){
					chatfocus = self;
					self.msg = self.msg || "";
				},
				onsubmit: function (self){
					onNick(self.msg);
					self.msg = "";
					chatfocus = false;
				}
});
var nickinput = nnObjects[0];
nnObjects.push({x:300-16+100, y:200+24+15+24*3+6, width:300-200, height:26,
				ondraw: function (self){
					var color = (self.holding && nickinput.msg) ? "#AeAeAe" : (nickinput.msg ? "#8e8e8e" : "#3e3e3e");
					drawRect(self.x,self.y,self.width,self.height, color);
					if (self.rovering && !self.holding && nickinput.msg){			
									ctx.strokeStyle="#AeAeAe";
									ctx.lineWidth = 1;
									ctx.strokeRect(self.x,self.y,self.width,self.height);
					}
					ctx.font = "12px Tahoma"; ctx.fillStyle = "#FFFFFF"; ctx.textAlign = "center";
					ctx.fillText("Play now!", self.x+50, 200+24+15+24*3+6+12+6); ctx.textAlign = "start";
				},
				onclick: function (self){
					if (nickinput.msg){
						onNick(nickinput.msg);
						chatfocus = false;
					}
				}
});

function nnMouseMoved(ev){
	roomMouseMoved(ev,nnObjects);
}
function nnMousePressed(ev){
	roomMousePressed(ev,nnObjects);
}
function nnMouseReleased(ev){
	roomMouseReleased(ev,nnObjects);
}

function drawConnecting(){
	drawRect(300-16,200+24,300,24*5+15+15,"#6e6e6e");
	ctx.font = "20px Tahoma"; ctx.fillStyle = "#FFFFFF"; 
	ctx.fillText("Connecting", 300-16+15, 200+24+15+20);
	drawRect(300-16+15,200+24+15+20+3,300-30,3,"#8e8e8e");
	ctx.font = "12px Tahoma"; ctx.fillStyle = "#FFFFFF"; 
}

function drawConnectingBroker() {
	drawConnecting();
	ctx.fillText("Waiting for broker...", 300-16+15, 200+24+15+4+20*2);
}

function drawConnectingSignaling() {
	drawConnectingBroker();
	ctx.fillText("Waiting for signalling server...", 300-16+15, 200+24+15+4+20*3);
}

function drawConnectingHost() {
	drawConnectingSignaling();
	ctx.fillText("Waiting for host..", 300-16+15, 200+24+15+4+20*4);
}

function drawSynchronizing() {
	drawConnectingHost();
	ctx.fillText("Synchronizing...", 300-16+15, 200+24+15+4+20*5);
}

function drawRoom(){
	drawRect(0,0,864,456,"#6e6e6e");
	drawRect(0,460,736,608-460,"#6e6e6e");
	drawRect(740,460,864-740,608-460,"#6e6e6e");
	
	for(var o=0; o<roomObjects.length; o++){
		var obj = roomObjects[o];
		if (obj && obj.depth == -1 && obj.drawfunc)
			obj.drawfunc(obj);
	}
	for(var o=0; o<roomObjects.length; o++){
		var obj = roomObjects[o];
		if(obj && obj.drawfunc && (!obj.hostonly || imhost) && !obj.layer)
			obj.drawfunc(obj);
	}
	if (LAYER>0){	//popup
		if (!isLocal)
			applyToCanvas();
		for(var o=0; o<roomObjects.length; o++){
			var obj = roomObjects[o];
			if(obj && obj.drawfunc && (!obj.hostonly || imhost) && obj.layer)
				obj.drawfunc(obj);
		}
	}
}

function drawGame() {
	drawgame();
}

//setInterval(draw, 1000/30);
requestAnimationFrame(draw);


function drawRect(x,y,w,h,color){
	rctx.fillStyle=color;
	rctx.fillRect(x,y,w,h);
}

var imageData = false;
function applyToCanvas() {
        imageData = rctx.getImageData(0, 0, roomCanvas.width, roomCanvas.height);
        var data = imageData.data;
        for(var i = 0; i < data.length; i += 4) {
          //var brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
		  
		  //reduce contrast
		  var contrast = -150;
		  var factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

		  //var brightness = factor * (brightness - 128) + 128;
			
          // red
          data[i] = (factor * (data[i] - 128) + 128)*0.8;
          // green
          data[i + 1] = (factor * (data[i + 1] - 128) + 128)*0.8;
          // blue
          data[i + 2] = (factor * (data[i + 2] - 128) + 128)*0.8;
		  
        }
        // overwrite original image
		rctx.putImageData(imageData, 0, 0);
}

//exemplos de objetos: buttons | text | scroll bars | 

function R(n) { return Math.floor(n*Math.random()); }
var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function genChar() { return chars[R(chars.length)]; }
genPredId = function (n) { return Array.apply(null, Array(n||10)).map(genChar).join(""); }	//62^10 = 8.4e+17 ~ 840 quadrillions

function createObject(x,y,width,height,drawfunc,onclick,hostonly){
	var obj = {x:x,y:y,width:width,height:height,onclick:onclick,drawfunc:drawfunc,hostonly:hostonly};
	if (roomObjects.push)
		roomObjects.push(obj);
	else
		roomObjects[genPredId(5)] = obj;
	return obj;
}

function createTextObject(x,y,text){
	return createObject(x,y,0,0,
		function () { rctx.font = "12px Tahoma"; rctx.fillStyle = "#FFFFFF"; rctx.fillText(text, x, y); },false, false);
}

function textInButton(self, font, text, color){
	rctx.font = font; rctx.fillStyle = color; rctx.textAlign = "center"; rctx.fillText(text, self.x+self.width/2, self.y+self.height*3/4);  rctx.textAlign = "start";
}

var Y_inicio = 56;
var X_adentro = 160+16; var X_menor = 102+16-16;

var roomObjects = {
	redteambutton : {x: X_adentro-16, y: Y_inicio, width: 105, height: 20, 
		drawfunc: function(self){
							if (!lockedNames && !gamestarted){
								drawRect(self.x,self.y,self.width,self.height,!self.holding ? "#8e8e8e" : "#AeAeAe");
								if (self.rovering && !self.holding){			
									rctx.strokeStyle="#AeAeAe";
									rctx.lineWidth = 1;
									rctx.strokeRect(self.x,self.y,self.width,self.height);
								}
							} else {
								drawRect(self.x,self.y,self.width,self.height,"#7e7e7e");
							}
								textInButton(self, "bold 14px Tahoma", "Red Team", "#FF2020");},
		onclick: function () { if (!lockedNames && !gamestarted) yourselfToRed(); }
	},
	specteambutton : {x: 395-16, y: Y_inicio, width: 105, height: 20, 
		drawfunc: function(self){
							if (!lockedNames && !gamestarted){
								drawRect(self.x,self.y,self.width,self.height,!self.holding ? "#8e8e8e" : "#AeAeAe");
								if (self.rovering && !self.holding){			
									rctx.strokeStyle="#AeAeAe";
									rctx.lineWidth = 1;
									rctx.strokeRect(self.x,self.y,self.width,self.height);
								}
							} else {
								drawRect(self.x,self.y,self.width,self.height,"#7e7e7e");
							}
								textInButton(self, "bold 14px Tahoma", "Spectators", "#FFFFFF");},
		onclick: function () { if (!lockedNames && !gamestarted) yourselfToSpec(); }
	},
	blueteambutton : {x: 896-X_adentro-105-16, y: Y_inicio, width: 105, height: 20,
		drawfunc: function(self){
							if (!lockedNames && !gamestarted){
								drawRect(self.x,self.y,self.width,self.height,!self.holding ? "#8e8e8e" : "#AeAeAe");
								if (self.rovering && !self.holding){			
									rctx.strokeStyle="#AeAeAe";
									rctx.lineWidth = 1;
									rctx.strokeRect(self.x,self.y,self.width,self.height);
								}
							} else {
								drawRect(self.x,self.y,self.width,self.height,"#7e7e7e");
							}
								textInButton(self, "bold 14px Tahoma", "Blue Team", "#2020FF")
		},
		onclick: function () { if (!lockedNames && !gamestarted) yourselfToBlue(); }
	},
	startmatchbutton : {x:380-16, y: 420, width: 150, height: 25,
		drawfunc: function(self){drawRect(self.x,self.y,self.width,self.height,!self.holding ? "#8e8e8e" : "#AeAeAe");
								if (self.rovering && !self.holding) {
									rctx.strokeStyle="#AeAeAe";
									rctx.lineWidth = 1;
									rctx.strokeRect(self.x,self.y,self.width,self.height);
								}
								rctx.font = "12px Tahoma"; rctx.fillStyle = "#FFFFFF"; 
								rctx.textAlign = "center"; 
								rctx.fillText(gamestarted ? "Stop." : "Start!", self.x+self.width/2, self.y+self.height/2+12/3);  
								rctx.textAlign = "start";
		},
		onclick: function(){
			startgame(room_game_options); 
		},
		hostonly: true
	},
	roomTitle: {x:12, y: 32, width: 0, height: 0,
		drawfunc: function(self){ rctx.font = "20px Tahoma"; rctx.fillStyle = "#FFFFFF"; if (roomTitle) rctx.fillText(roomTitle, self.x, self.y); }
	},
	lockbutton: {x:48-16, y: 144, width: 64, height: 20,
		drawfunc: function(self){
							if (!gamestarted){
								drawRect(self.x,self.y,self.width,self.height,!self.holding ? "#8e8e8e" : "#AeAeAe");
								if (self.rovering && !self.holding){
									rctx.strokeStyle="#AeAeAe";
									rctx.lineWidth = 1;
									rctx.strokeRect(self.x,self.y,self.width,self.height);
								}
							} else {
								drawRect(self.x,self.y,self.width,self.height,"#7e7e7e");
							}
								rctx.font = "12px Tahoma"; rctx.fillStyle = "#FFFFFF"; rctx.textAlign = "center"; rctx.fillText(lockedNames ? "Unlock" : "Lock", self.x+self.width/2, self.y+self.height*3/4);  rctx.textAlign = "start";
		},
		onclick: function(){ if (!gamestarted) lockNames();},//todo
		hostonly: true
	},
	autobutton: {x:48-16, y: 168, width: 64, height: 20,
		drawfunc: function(self){
							if (!gamestarted){
								drawRect(self.x,self.y,self.width,self.height,!self.holding ? "#8e8e8e" : "#AeAeAe");
								if (self.rovering && !self.holding){
									rctx.strokeStyle="#AeAeAe";
									rctx.lineWidth = 1;
									rctx.strokeRect(self.x,self.y,self.width,self.height);
								}
							} else {
								drawRect(self.x,self.y,self.width,self.height,"#7e7e7e");
							}
								rctx.font = "12px Tahoma"; rctx.fillStyle = "#FFFFFF"; rctx.textAlign = "center"; rctx.fillText("Auto", self.x+self.width/2, self.y+self.height*3/4);  rctx.textAlign = "start";
		},
		onclick: function(){if (!gamestarted) autoNames();},
		hostonly: true
	},
	resetbutton: {x:48-16, y: 192, width: 64, height: 20,
		drawfunc: function(self){
							if (!gamestarted){
								drawRect(self.x,self.y,self.width,self.height,!self.holding ? "#8e8e8e" : "#AeAeAe");
								if (self.rovering && !self.holding){
									rctx.strokeStyle="#AeAeAe";
									rctx.lineWidth = 1;
									rctx.strokeRect(self.x,self.y,self.width,self.height);
								}
							} else {
								drawRect(self.x,self.y,self.width,self.height,"#7e7e7e");
							}
								rctx.font = "12px Tahoma"; rctx.fillStyle = "#FFFFFF"; rctx.textAlign = "center"; rctx.fillText("Reset", self.x+self.width/2, self.y+self.height*3/4);  rctx.textAlign = "start";
		},
		onclick: function(){if (!gamestarted) resetNames();},
		hostonly: true
	},
	leavebutton: {x:864-12-64, y: 12, width: 64, height: 20,
		drawfunc: function(self){drawRect(self.x,self.y,self.width,self.height,!self.holding ? "#8e8e8e" : "#AeAeAe");
								if (self.rovering && !self.holding){
									rctx.strokeStyle="#AeAeAe";
									rctx.lineWidth = 1;
									rctx.strokeRect(self.x,self.y,self.width,self.height);
								}
								rctx.font = "12px Tahoma"; rctx.fillStyle = "#FFFFFF"; rctx.textAlign = "center"; rctx.fillText("Leave", self.x+self.width/2, self.y+self.height*3/4);  rctx.textAlign = "start";
		},
		onclick: function(){
					if (!imhost){
						conn.send('leaving'); 
					}
					if (isLocal || isGamejolt){
						window.location = "./index.html"; 
					} else {
						window.location = "./"; 
					}
							/*LAYER = 1;
							popup = createObject(450-150,200+24+24,300,24*3+12+6+15,
									function (self) {
										drawRect(self.x,self.y,self.width,self.height,"#6e6e6e");
									},
									false, false);
							popup.layer = true;
							popup.children = [];
							popup.children.push(createObject(450-150+15, 200+15+24+24+24, 300-30, 0,
												 function(self){ rctx.font = "20px Tahoma"; rctx.fillStyle = "#FFFFFF"; rctx.fillText("Leave Room", self.x, self.y); 
																 drawRect(self.x,self.y+3,self.width,3,"#8e8e8e");
												 }, false, false));
							popup.children.push(createObject(450-150+15, 200+15+24+24+24+24, 150-6-3-15, 26,
												function (self){
													drawRect(self.x,self.y,self.width,self.height,!self.holding ? "#8e8e8e" : "#AeAeAe");
													if (self.rovering && !self.holding){
														rctx.strokeStyle = "#AeAeAe";
														rctx.lineWidth = 1;
														rctx.strokeRect(self.x,self.y,self.width,self.height);
													}
													rctx.font = "12px Tahoma"; rctx.fillStyle = "#FFFFFF"; rctx.textAlign = "center"; rctx.fillText("Cancel", self.x+self.width/2, self.y+self.height-(self.height-12)/2-2);
													rctx.textAlign = "start";
												},
												function () { closePopup(); },
												false));
							popup.children.push(createObject(450-150+15+150-6-3-15+15, 200+15+24+24+24+24, 150-6-3-15, 26,
												function (self){
													drawRect(self.x,self.y,self.width,self.height,!self.holding ? "#8e8e8e" : "#AeAeAe");
													if (self.rovering && !self.holding){
														rctx.strokeStyle = "#AeAeAe";
														rctx.lineWidth = 1;
														rctx.strokeRect(self.x,self.y,self.width,self.height);
													}
													rctx.font = "12px Tahoma"; rctx.fillStyle = "#FFFFFF"; rctx.textAlign = "center"; rctx.fillText("Leave", self.x+self.width/2, self.y+self.height-(self.height-12)/2-2);
													rctx.textAlign = "start";
												},
												function () {
													if (!imhost){
														conn.send('leaving'); 
													}
													if (isLocal){
														window.location = "./index.html"; 
													} else {
														window.location = "./"; 
													}
												},
												false));
							popup.children.forEach(function (x) { x.layer = true; });*/
		},
		hostonly: false
	}
}


//3 rects
createObject(X_menor, 82, 216, 224,
		function (self) { 
			drawRect(self.x, self.y, self.width, self.height, "#4e4e4e"); 
		}, false, false).depth = -1;
createObject(X_menor + 216 + 6, 82, 216, 224,
		function (self) { 
			drawRect(self.x, self.y, self.width, self.height, "#4e4e4e"); 
		}, false, false).depth = -1;
createObject(864 - X_menor - 216, 82, 216, 224,
		function (self) { 
			drawRect(self.x, self.y, self.width, self.height, "#4e4e4e"); 
		}, false, false).depth = -1;

//under title
createObject(12, 32 + 3, 864 - 24, 3,
		function (self) { 
			drawRect(self.x, self.y, self.width, self.height, "#8e8e8e");
		}, false, false).depth = -1;



var room_game_options = {mode_selected: 0, map_selected: 0, size_selected: 1, timelimit: 5, scorelimit: 5};
		

createTextObject(314 - 16, 332, "Score limit:");
createObject(314 - 16, 332, 0, 0,
		function (self) { 
			rctx.font = "12px Tahoma"; 
			rctx.fillStyle = "#FFFFFF"; 
			rctx.fillText(room_game_options.scorelimit, 420-16, self.y);
		}, false, false);
createObject(550 - 16, 332 - 15, 21, 21,
		function (self) { 
			if (gamestarted) 
				return;
			drawRect(self.x, self.y, self.width, self.height, !self.holding ? "#8e8e8e" : "#AeAeAe");
			rctx.drawImage(setaleft, self.x, self.y); 
			if (self.rovering && !self.holding){			
				rctx.strokeStyle="#AeAeAe";
				rctx.lineWidth = 1;
				rctx.strokeRect(self.x, self.y, self.width, self.height);
			}
		}, 
		function () { 
			if (gamestarted) 
				return;
			room_game_options.scorelimit -= 1;
			if (room_game_options.scorelimit < 1)
				room_game_options.scorelimit = 1;
			broadcast('myscorelimit', {value: room_game_options.scorelimit});
		}, true);
createObject(575 - 16, 332 - 15, 21, 21,
		function (self) { 
			if (gamestarted) 
				return;
			drawRect(self.x, self.y, self.width, self.height, !self.holding ? "#8e8e8e" : "#AeAeAe");
			rctx.drawImage(setaright, self.x, self.y); 
			if (self.rovering && !self.holding){			
				rctx.strokeStyle="#AeAeAe";
				rctx.lineWidth = 1;
				rctx.strokeRect(self.x, self.y, self.width, self.height);
			}
		}, 
		function () { 
			if (gamestarted) 
				return;
			room_game_options.scorelimit += 1;
			if (room_game_options.scorelimit > 20)
				room_game_options.scorelimit = 20;
			broadcast('myscorelimit', {value: room_game_options.scorelimit});
		}, true);


/* createTextObject(314 - 16, 332, "Time limit:");
createObject(314 - 16, 332, 0, 0,
		function (self) { 
			rctx.font = "12px Tahoma"; 
			rctx.fillStyle = "#FFFFFF"; 
			rctx.fillText(room_game_options.timelimit + "mins", 420-16, self.y);
		}, false, false);
createObject(550 - 16, 332 - 15, 21, 21,
		function (self) { 
			if (gamestarted) 
				return;
			drawRect(self.x, self.y, self.width, self.height, !self.holding ? "#8e8e8e" : "#AeAeAe");
			rctx.drawImage(setaleft, self.x, self.y); 
			if (self.rovering && !self.holding){			
				rctx.strokeStyle="#AeAeAe";
				rctx.lineWidth = 1;
				rctx.strokeRect(self.x, self.y, self.width, self.height);
			}
		}, 
		function () { 
			if (gamestarted) 
				return;
			room_game_options.timelimit -= 1;
			if (room_game_options.timelimit < 1)
				room_game_options.timelimit = 1;
			broadcast('mytimelimit', {value: room_game_options.timelimit});
		}, true);
createObject(575 - 16, 332 - 15, 21, 21,
		function (self) { 
			if (gamestarted) 
				return;
			drawRect(self.x, self.y, self.width, self.height, !self.holding ? "#8e8e8e" : "#AeAeAe");
			rctx.drawImage(setaright, self.x, self.y); 
			if (self.rovering && !self.holding){			
				rctx.strokeStyle="#AeAeAe";
				rctx.lineWidth = 1;
				rctx.strokeRect(self.x, self.y, self.width, self.height);
			}
		}, 
		function () { 
			if (gamestarted) 
				return;
			room_game_options.timelimit += 1;
			if (room_game_options.timelimit > 90)
				room_game_options.timelimit = 90;
			broadcast('mytimelimit', {value: room_game_options.timelimit});
		}, true); */

		
var mapsizes = ["Small", "Medium", "Big"];
		
createTextObject(314 - 16, 356, "Map size:");
createObject(314 - 16, 356, 0, 0,
		function (self) { 
			rctx.font = "12px Tahoma"; 
			rctx.fillStyle = "#FFFFFF"; 
			rctx.fillText(mapsizes[room_game_options.size_selected], 420 - 16, self.y);
		}, false, false);
createObject(550 - 16, 356 - 15, 21, 21,
		function (self) { 
			if (gamestarted) 
				return;
			drawRect(self.x, self.y, self.width, self.height, !self.holding ? "#8e8e8e" : "#AeAeAe");
			rctx.drawImage(setaleft, self.x, self.y); 
			if (self.rovering && !self.holding){			
				rctx.strokeStyle = "#AeAeAe";
				rctx.lineWidth = 1;
				rctx.strokeRect(self.x, self.y, self.width, self.height);
			}
		}, 
		function () { 
			if (gamestarted) 
				return;
			room_game_options.size_selected -= 1; 
			if (room_game_options.size_selected < 0) 
				room_game_options.size_selected = 0;
			broadcast('size_selected', {value: room_game_options.size_selected});
		}, true);
createObject(575 - 16, 356 - 15, 21, 21,
		function (self) { 
			if (gamestarted) 
				return;
			drawRect(self.x, self.y, self.width, self.height, !self.holding ? "#8e8e8e" : "#AeAeAe");
			rctx.drawImage(setaright, self.x, self.y); 
			if (self.rovering && !self.holding){			
				rctx.strokeStyle = "#AeAeAe";
				rctx.lineWidth = 1;
				rctx.strokeRect(self.x, self.y, self.width, self.height);
			}
		}, 
		function () { 
			if (gamestarted) 
				return;
			room_game_options.size_selected += 1; 
			if (room_game_options.size_selected >= mapsizes.length) 
				room_game_options.size_selected = mapsizes.length - 1;
			broadcast('size_selected', {value: room_game_options.size_selected});
		}, true);

		
var terrains = ["Forest"]	//, "Snow", "Desert"];
		
createTextObject(314 - 16, 380, "Terrain:");
createObject(314 - 16, 380, 0, 0,
		function (self) { 
			rctx.font = "12px Tahoma"; 
			rctx.fillStyle = "#FFFFFF"; 
			rctx.fillText(terrains[room_game_options.map_selected], 420 - 16, self.y);
		}, false, false);
createObject(550 - 16, 380-15, 21, 21,
		function (self) { 
			if (gamestarted) 
				return;
			drawRect(self.x, self.y, self.width, self.height, !self.holding ? "#8e8e8e" : "#AeAeAe");
			rctx.drawImage(setaleft, self.x, self.y);
			if (self.rovering && !self.holding){			
				rctx.strokeStyle = "#AeAeAe";
				rctx.lineWidth = 1;
				rctx.strokeRect(self.x, self.y, self.width, self.height);
			}
		}, 
		function () { 
			if (gamestarted) 
				return;
			room_game_options.map_selected -= 1; 
			if (room_game_options.map_selected < 0) 
				room_game_options.map_selected = 0; 
			broadcast('terrain_selected', {value: room_game_options.map_selected});
		}, true);
createObject(575 - 16, 380 - 15, 21, 21,
		function (self) { 
			if (gamestarted) 
				return;
			drawRect(self.x, self.y, self.width, self.height, !self.holding ? "#8e8e8e" : "#AeAeAe");
			rctx.drawImage(setaright, self.x, self.y); 
			if (self.rovering && !self.holding){			
				rctx.strokeStyle = "#AeAeAe";
				rctx.lineWidth = 1;
				rctx.strokeRect(self.x, self.y, self.width, self.height);
			}
		}, 
		function () {
			if (gamestarted) 
				return;
			room_game_options.map_selected += 1; 
			if (room_game_options.map_selected >= terrains.length) 
				room_game_options.map_selected = terrains.length - 1; 
			broadcast('terrain_selected', {value: room_game_options.map_selected});
		}, true);
		
		
var gamemodes = modes;	//declared in content_modes.js		//["Team Versus", "Team Deathmatch", "Free For All"];
		
createTextObject(314 - 16, 404, "Mode:");
createObject(314 - 16, 404, 0, 0,
		function (self) { 
			rctx.font = "12px Tahoma"; 
			rctx.fillStyle = "#FFFFFF"; 
			rctx.fillText(gamemodes[room_game_options.mode_selected].name, 420-16, self.y);
		}, false, false);
createObject(550 - 16, 404 - 15, 21, 21,
		function (self) { 
			if (gamestarted) 
				return;
			drawRect(self.x, self.y, self.width, self.height, !self.holding ? "#8e8e8e" : "#AeAeAe"); 
			rctx.drawImage(setaleft, self.x, self.y);
			if (self.rovering && !self.holding){			
				rctx.strokeStyle="#AeAeAe";
				rctx.lineWidth = 1;
				rctx.strokeRect(self.x, self.y, self.width, self.height);
			}
		}, 
		function () { 
			if (gamestarted) 
				return;
			room_game_options.mode_selected -= 1; 
			if (room_game_options.mode_selected < 0) 
				room_game_options.mode_selected = 0;
			broadcast('gamemode_selected', {value: room_game_options.mode_selected});
		}, true);
createObject(575 - 16, 404 - 15, 21, 21,
		function (self) { 
			if (gamestarted) 
				return;
			drawRect(self.x, self.y, self.width, self.height, !self.holding ? "#8e8e8e" : "#AeAeAe");
			rctx.drawImage(setaright, self.x, self.y);
			if (self.rovering && !self.holding){			
				rctx.strokeStyle = "#AeAeAe";
				rctx.lineWidth = 1;
				rctx.strokeRect(self.x, self.y, self.width, self.height);
			}
		}, 
		function () { 
			if (gamestarted) 
				return;
			room_game_options.mode_selected += 1; 
			if (room_game_options.mode_selected >= gamemodes.length) 
				room_game_options.mode_selected = gamemodes.length-1;
			broadcast('gamemode_selected', {value: room_game_options.mode_selected});
		}, true);

//		

//CHAT
chatfocus = false;
chatmsg = "";
setInterval(function () { chatfocus.blinking = !chatfocus.blinking; }, 500);

createObject(8+2,574-2,694,26,
		function (self) { drawRect(self.x,self.y,self.width,self.height,"#8e8e8e"); }, false, false).depth=-1;
createTextObject(16+2, 574-2+12+4+1, "Chat:");
var mychat = createObject(52+2,576-2,648,22,
		function (self) { drawRect(self.x,self.y,self.width,self.height,"#4e4e4e"); 
			if (self.rovering) {
				roomCanvas.style.cursor = "text";
			} else {
				roomCanvas.style.cursor = "default";
			}
		}, 
		function (self) {
			//chatfocus = true;
			chatfocus = self;
			self.msg = self.msg || "";
		}, false);
mychat.onsubmit = function (self) {
			if (imhost){
				broadcast('chat',{id:myid,message:self.msg});
			} else {
				conn.send({type:'chat',message:self.msg});
				appendText(self.msg, name_, false, team);
			}
			self.msg = "";
			chatfocus = false;
		};
mychat.msg = "";
//mychat.maxlen = 125;
createObject(52+2+8,576-2+12+3,0,0,
		function (self) { rctx.font = "12px Tahoma"; rctx.fillStyle = "#8e8e8e"; 
							if(!mychat.msg && chatfocus != mychat) rctx.fillText("Press [TAB] key to focus chat.", self.x, self.y); 
							rctx.fillStyle = "#FFFFFF"; 
							var msg = mychat.msg || "";
							if (rctx.measureText(msg).width<=600)
								rctx.fillText(msg, self.x, self.y);
							else {
								while (rctx.measureText(msg).width>600){
									msg = msg.substr(1);
								}
								rctx.fillText(msg, self.x, self.y);
							}
							if (chatfocus == mychat){
								var w = rctx.measureText(msg).width;
								if (mychat.blinking){
									drawRect(self.x+w,self.y-10,1,12,"#FFFFFF");
								}
							}
		}
		,false, false);
		
var chatlog = []; //[nick, message]


function countChatDisplay(){
	var lines = 0;
	var lineHeight = 20;
	var maxWidth = 680;
	for (var i=0;i<chatlog.length;i++){
		var log = chatlog[i];
		var message = log[0]+": "+log[1];
		var words = message.split(" ");
		var line = "";
		for (var n=0;n<words.length;n++){
			var testLine = line + words[n] + " ";
			var metrics = rctx.measureText(testLine);
			var testWidth = metrics.width;
			if (testWidth > maxWidth && n > 0) {
				if (rctx.measureText(line).width <= maxWidth){
					line = words[n] + ' ';
					//y += lineHeight;
					lines += 1;
				} else {
					var k=0;
					while (rctx.measureText(line.substr(0,k)).width <= maxWidth){
						k++;
					}
					line = line.substr(k)+words[n]+' ';
					//y += lineHeight;
					lines += 1;
				}
				 
			} else {
				line = testLine;
			}
		}
		if (rctx.measureText(line).width <= maxWidth){
			lines += 1;
		} else {
			lines += 2;
		}
	}
	return lines;
}


chatdisplay = createObject(8+2,460+20,694,574-2-8-460,	//5 mensagens de 20px
				function (self) {
					var lines = 0;
					var lineHeight = 20;
					var maxWidth = 680;
					mychatscroll.chatheight = Math.round(mychatscroll.chatheight);
					for (var i=0;i<chatlog.length;i++){
						var log = chatlog[i];
						var message = log[0]+": "+log[1];
						if (!log[0]) message = log[1];
						var words = message.split(" ");
						var line = "";
						for (var n=0;n<words.length;n++){
							var testLine = line + words[n] + " ";
							var metrics = rctx.measureText(testLine);
							var testWidth = metrics.width;
							if (testWidth > maxWidth && n > 0) {
								if (rctx.measureText(line).width <= maxWidth){
									if (lines>=mychatscroll.chatheight && lines < mychatscroll.chatheight+5){
											rctx.fillText(line, self.x, self.y+(lines-mychatscroll.chatheight)*lineHeight);
									}
									line = words[n] + ' ';
									//y += lineHeight;
									lines += 1;
								} else {
									var k=0;
									while (rctx.measureText(line.substr(0,k)).width <= maxWidth){
										k++;
									}
									if (lines>=mychatscroll.chatheight && lines < mychatscroll.chatheight+5){
											rctx.fillText(line.substr(0,k-1), self.x, self.y+(lines-mychatscroll.chatheight)*lineHeight);
									}
									line = line.substr(k)+words[n]+' ';
									//y += lineHeight;
									lines += 1;
								}
							} else {
								line = testLine;
							}
						}
						if (rctx.measureText(line).width <= maxWidth){
							if (lines>=mychatscroll.chatheight && lines < mychatscroll.chatheight+5){
								rctx.fillText(line, self.x, self.y+(lines-mychatscroll.chatheight)*lineHeight);
							}
							lines += 1;
						} else {
							var k=0;
							while (rctx.measureText(line.substr(0,k)).width <= maxWidth){
								k++;
							}
							if (lines>=mychatscroll.chatheight && lines < mychatscroll.chatheight+5){
								rctx.fillText(line.substr(0,k-1), self.x, self.y+(lines-mychatscroll.chatheight)*lineHeight);
							}
							lines += 1;
							if (lines>=mychatscroll.chatheight && lines < mychatscroll.chatheight+5){
								rctx.fillText(line.substr(k), self.x, self.y+(lines-mychatscroll.chatheight)*lineHeight);
							}
							lines += 1;
						}
					}
					self.lines = lines;	
				},
				false, false);
				
mychatscroll = createObject(736-17-6,460+15+10+2, 17, 608-460-21-21-16-4,
							function (self) {
								var H = chatdisplay.lines || 0;
								
								//height -- chatdisplay.lines
								//theheight -- 5
								var mHeight = self.mHeight
								var mY = self.mY;
								var uLine = mHeight/H;
								if (!H)
									uLine = mHeight/5;
								
								self.height = 5 * uLine;	//(608-460-21-21-20);
								if (H<=5)
									self.height = mHeight;
								//mychatscroll.chatheight
								//self.y = mY+mychatscroll.chatheight*uLine;
								if (!self.dragging)
									drawRect(self.x,self.y,self.width,self.height,"#8e8e8e");
								if (self.rovering && !self.dragging){
									rctx.strokeStyle = "#AeAeAe";
									rctx.strokeRect(self.x,self.y,self.width,self.height);
								} if (self.dragging)
									drawRect(self.x,self.y,self.width,self.height,"#AeAeAe");
	
							},
							false,
							false);
mychatscroll.chatheight = 0;
mychatscroll.mHeight = 608-460-21-21-16-4;	//90
mychatscroll.mY = 460+15+10+2;

mychatscroll.ondrag = function (self){
	var H = chatdisplay.lines || 0;
	if (H<=5) return;
	if (!self.firstdrag){
		self.rulerchatheight = self.chatheight;
		self.firstdrag = true;
	}
	self.y += (self.dragy-self.dragcy);
	self.dragcy = self.dragy;
	var mY = self.mY;	//460+12+10;
	self.y = Math.max(self.y,mY);
	self.y = Math.min(self.y,mY+self.mHeight-self.height);
	
	var uLine = self.mHeight/H;
	self.chatheight = (self.y-mY)/uLine;
	self.chatheight = Math.round(self.chatheight);
	self.chatheight = Math.max(self.chatheight,0);
	self.chatheight = Math.min(self.chatheight,chatdisplay.lines-5);
}
mychatscroll.ondragend = function (self){
	self.firstdrag = false;
}


createObject(736-17-6,460+15+10-21,17,21,
		function (self) { drawRect(self.x,self.y,self.width,self.height,!self.holding ? "#8e8e8e" : "#AeAeAe"); 
							rctx.drawImage(setaup,self.x,self.y);
							if (self.rovering && !self.holding){			
								rctx.strokeStyle="#AeAeAe";
								rctx.lineWidth = 1;
								rctx.strokeRect(self.x,self.y,self.width,self.height);
							}
		}, function () {
			var lines = countChatDisplay();
			mychatscroll.chatheight -= 1;
			mychatscroll.chatheight = Math.max(0,mychatscroll.chatheight);
			var mHeight = mychatscroll.mHeight;	//608-460-21-21-16;
			var uLine = mHeight/lines;
			mychatscroll.y = mychatscroll.mY+mychatscroll.chatheight*uLine;
							},
		false);
		
createObject(736-17-6,460+15+10+608-460-21-21-16,17,21,
		function (self) { drawRect(self.x,self.y,self.width,self.height,!self.holding ? "#8e8e8e" : "#AeAeAe");
							rctx.drawImage(setadown,self.x,self.y);
							if (self.rovering && !self.holding){			
								rctx.strokeStyle="#AeAeAe";
								rctx.lineWidth = 1;
								rctx.strokeRect(self.x,self.y,self.width,self.height);
							}
		}, function () { 
			var lines = countChatDisplay();
			mychatscroll.chatheight += 1;
			mychatscroll.chatheight = Math.min(Math.max(0,lines-5),mychatscroll.chatheight);
			var mHeight = mychatscroll.mHeight;	//608-460-21-21-16;
			var uLine = mHeight/lines;
			mychatscroll.y = mychatscroll.mY+mychatscroll.chatheight*uLine;
							},
		false);








		
popup = false; //popup = createObject ... popup.children = []; popup.children.push(createObject(
function closePopup(){
	popup.children.forEach(function (x) { delete roomObjects[roomObjects.indexOf(x)]; });
	delete roomObjects[roomObjects.indexOf(popup)];
	popup = false;
	LAYER = 0;
}
	
function createNick(nick, team, height, i){
	var std = [{x:X_menor+216+6},{x:X_menor},{x:864-X_menor-216}];
	var n = createObject(std[team].x+8-4,80+24+24*height-20+3,216-8,22,
		function (self) { 
			if (self.rovering && imhost){
				drawRect(self.x,self.y,self.width,self.height,"#5e5e5e");
				if (!self.kickobj)
					self.kickobj = createObject(self.x+216-8-16,self.y+3, 16, 16, 
						function (self) { drawRect(self.x,self.y,self.width,self.height,!self.holding ? "#8e8e8e" : "#AeAeAe");
							if (self.rovering && !self.holding){
								rctx.strokeStyle = "#AeAeAe";
								rctx.lineWidth = 1;
								rctx.strokeRect(self.x,self.y,self.width,self.height);
							}
						},
						function (){
							//onclick
							LAYER = 1;
							popup = createObject(450-150,200+24,300,24*4+15+15,
									function (self) {
										drawRect(self.x,self.y,self.width,self.height,"#6e6e6e");
									},
									false, false);
							popup.layer = true;
							popup.children = [];
							popup.children.push(createObject(450-150+15, 200+24+15, 300-30, 0,
												 function(self){ rctx.font = "20px Tahoma"; rctx.fillStyle = "#FFFFFF"; rctx.fillText(nick, self.x+3, self.y+20); 
																 drawRect(self.x,self.y+20+3,self.width,3,"#8e8e8e");
												 }, false, false));
							popup.children.push(createObject(450-150+15, 200+15+24+24+24, 300-30, 20,
													function (self){
														drawRect(self.x,self.y,self.width,self.height, i.id==myid ? "#7e7e7e" : (!self.holding ? "#8e8e8e" : "#AeAeAe"));
														if (self.rovering && !self.holding && i.id!=myid){
															rctx.strokeStyle = "#AeAeAe";
															rctx.lineWidth = 1;
															rctx.strokeRect(self.x,self.y,self.width,self.height);
														}
														rctx.font = "12px Tahoma"; rctx.fillStyle = "#FFFFFF"; rctx.textAlign = "center"; rctx.fillText("Kick", self.x+self.width/2, self.y+self.height*3/4);  rctx.textAlign = "start";
													},
													function (){
														if (i.id!=myid){
															closePopup();
															LAYER = 1;
															popup = createObject(450-150, 200+24, 300, 24*4+15+15,
																		function (self) {
																			drawRect(self.x,self.y,self.width,self.height,"#6e6e6e");
																		},
																		false, false);		
															popup.layer = true;
															popup.children = [];
															popup.children.push(createObject(450-150+15, 200+15+24+24, 300-30, 0,
																				 function(self){ rctx.font = "20px Tahoma"; rctx.fillStyle = "#FFFFFF"; rctx.fillText("Kick "+nick, self.x, self.y); 
																								 drawRect(self.x,self.y+3,self.width,3,"#8e8e8e");
																				 }, false, false));
															var banfromrej = createObject(450-150+15, 200+15+24+24+24, 300-30, 20,
																				function (self){
																					drawRect(self.x,self.y,self.width,self.height, i.id==myid ? "#4e4e4e" : (!self.holding ? "#8e8e8e" : "#AeAeAe"));
																					if (self.rovering && !self.holding && i.id!=myid){
																						rctx.strokeStyle = "#AeAeAe";
																						rctx.strokeRect(self.x,self.y,self.width,self.height);
																					}
																					rctx.font = "12px Tahoma"; rctx.fillStyle = "#FFFFFF";
																					rctx.textAlign = "start"; rctx.fillText("Ban from rejoining:", self.x+15, self.y+self.height*3/4);
																					rctx.textAlign = "end"; rctx.fillText(self.ban ? "Yes" : "No", self.x+self.width-6, self.y+self.height*3/4); rctx.textAlign = "start";
																				},
																				function (self){
																					self.ban = !self.ban;
																				},
																				false);
															popup.children.push(banfromrej);
															popup.children.push(createObject(450-150+15, 200+15+24*4, 150-15-3, 20,
																					function (self){
																						drawRect(self.x,self.y,self.width,self.height,!self.holding ? "#8e8e8e" : "#AeAeAe");
																						if (self.rovering && !self.holding){
																							rctx.strokeStyle = "#AeAeAe";
																							rctx.strokeRect(self.x,self.y,self.width,self.height);
																						}
																						rctx.font = "12px Tahoma"; rctx.fillStyle = "#FFFFFF"; rctx.textAlign = "center"; rctx.fillText("Cancel", self.x+self.width/2, self.y+self.height*3/4);  rctx.textAlign = "start";
																					},
																					function () { closePopup(); },
																					false));
																popup.children.push(createObject(450-150+15+150-15-3+6, 200+15+24*4, 150-15-3, 20,
																					function (self){
																						drawRect(self.x,self.y,self.width,self.height,!self.holding ? "#8e8e8e" : "#AeAeAe");
																						if (self.rovering && !self.holding){
																							rctx.strokeRect(self.x,self.y,self.width,self.height);
																						}
																						rctx.font = "12px Tahoma"; rctx.fillStyle = "#FFFFFF"; rctx.textAlign = "center"; rctx.fillText("Kick", self.x+self.width/2, self.y+self.height*3/4);  rctx.textAlign = "start";
																					},
																					function () { 
																						selectedName = i.id;
																						selectedFrom = i.team;
																						if (!banfromrej.ban)
																							kickSelected();
																						else
																							banSelected();
																						closePopup();
																					},
																					false));
																					
																popup.children.forEach(function (x) { x.layer = true; });
																
														}														
													},
													false)
												);
							popup.children.push(createObject(450-150+15, 200+15+24*4, 300-30, 20, //300-50-50+200-20-6
													function (self){
														drawRect(self.x,self.y,self.width,self.height,!self.holding ? "#8e8e8e" : "#AeAeAe");
														if (self.rovering && !self.holding){
															rctx.strokeStyle = "#AeAeAe";
															rctx.strokeRect(self.x,self.y,self.width,self.height);
														}
														rctx.font = "12px Tahoma"; rctx.fillStyle = "#FFFFFF"; rctx.textAlign = "center"; rctx.fillText("Close", self.x+self.width/2, self.y+self.height*3/4);  rctx.textAlign = "start";
													},
													function () {closePopup();},
													false)
												);
							
							popup.children.forEach(function (x) { x.layer = true; });
						},
					false);
					self.kickobj.nickname = nick;
			} else if (!self.rovering && self.kickobj){
				delete roomObjects[roomObjects.indexOf(self.kickobj)];
				self.kickobj = false;
			}
			rctx.font = "14px Tahoma"; rctx.fillStyle = "#FFFFFF"; rctx.fillText(self.nickname, self.x+4, self.y+20-3-1); 
			if (self.dragging && imhost){
					var ax = self.dragx-(self.dragcx-self.x); var ay = self.dragy-(self.dragcy-self.y); 
					rctx.font = "14px Tahoma"; rctx.fillStyle = "#FFFFFF"; rctx.fillText(self.nickname, ax+4, ay+20-3-1); 
			}
		},
			false,false);
	n.ondrag = function () {};
	n.nickname = nick; n.team = team; n.i = i;
	var A = X_menor; var B = X_menor+216+15; var C = 864-X_menor-216; var D = 864-X_menor;
	n.ondragend = function (self) {
		if (self.dragx>=A && self.dragx<=D){
			if (self.dragx>=A && self.dragx<B){	//to Red
				if (self.team != 1){
					//move to red
					selectedName = i.id;
					selectedFrom = self.team;
					selectedToRed();
				}
			} else if (self.dragx>=B && self.dragx<C){
				if (self.team != 0){
					//move to spec
					selectedName = i.id;
					selectedFrom = self.team;
					selectedToSpec();
				}
			} else if (self.dragx>=C && self.dragx<=D){
				if (self.team != 2){
					//move to blue
					selectedName = i.id;
					selectedFrom = self.team;
					selectedToBlue();
				}
			}
		}
	};
	roomObjects[genPredId(5)] = n;
	return n;
}

function isInside(x,y,obj){
	return ((x-obj.x)>=0 && (x-obj.x)<obj.width) && ((y-obj.y)>=0 && (y-obj.y)<obj.height);
}

var draggingthisobj = false;
var holdingthisobj = false;
var dragstart = false;
function roomMousePressed(ev,objects_){
	var x = ev.clientX-canvasposition.left; var y = ev.clientY-canvasposition.top;
	var objects = objects_ || roomObjects;
	for(var o in objects){
		var obj = objects[o];
		if (LAYER==0 || obj.layer){
			if(obj && obj.onclick && isInside(x,y,obj) && (!obj.hostonly || imhost)){
				//obj.onclick(obj);
				obj.holding = true;
				holdingthisobj = obj;
			}
			if(obj && obj.ondrag && isInside(x,y,obj) && (!obj.hostonly || imhost)){
				obj.dragging = true;
				draggingthisobj = obj;
				draggingthisobj.dragx=x;draggingthisobj.dragy=y;
				draggingthisobj.dragcx=x;draggingthisobj.dragcy=y;
				//obj.ondrag(obj);
			}
		}
	}
}

function roomMouseReleased(ev){
	var x = ev.clientX-canvasposition.left; var y = ev.clientY-canvasposition.top;
	if (draggingthisobj.ondragend)
		draggingthisobj.ondragend(draggingthisobj);
	draggingthisobj.dragging = false;
	draggingthisobj = false;
	if(holdingthisobj){
		if (holdingthisobj.onclick && isInside(x,y,holdingthisobj)){
			holdingthisobj.onclick(holdingthisobj);
		}
		holdingthisobj.holding = false;
		holdingthisobj = false;
	}
}

function roomMouseOut(ev){
	roomMouseReleased(ev);
}

function roomMouseMoved(ev,objects_){
	var x = ev.clientX-canvasposition.left; var y = ev.clientY-canvasposition.top;
	var objects = objects_ || roomObjects;
	for(var o in objects){
		var obj = objects[o];
		if(obj && isInside(x,y,obj) && (!obj.hostonly || imhost) && (LAYER==0 || obj.layer)){
			obj.rovering = true;
		} else if (obj && obj.rovering){
			obj.rovering = false;
		}
	}
	if (draggingthisobj){
		draggingthisobj.dragx=x;draggingthisobj.dragy=y;
		draggingthisobj.ondrag(draggingthisobj);
	}
}

roomObjects = filterObj(roomObjects, function () { return true; });	//make it an array

