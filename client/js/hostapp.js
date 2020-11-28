

var peercallbacksgame = [];
var peercallbacksother = [];

if (typeof global === 'undefined')
	global = window;

	HEAD=0;
	TORSO=1;
	LEGS=2;
	BOOTS=3;
	RIGHT=4;
	LEFT=5;
	AMMO=6;

var isnode = false;
if (typeof exports === 'undefined'){
	//
} else {
	isnode = true;
	window = exports;
	var id_names = {};
	var clients = {};
	var conns = [];
	var gamestarted = false;
	var MSGLENLIMIT = 125;
	var team = 0;
	var spectators = [];
	var red_team = [];  
	var blue_team = []; 
	var finalscreen = false;
	var blinkingtimer = false;
	var hostid = false;
	var newmessages = [];
}


function peeron(name,callback,game){	//when the peer sends data with type=that name
	if (game)
		peercallbacksgame.push({type:name,callback:callback});
	else
		peercallbacksother.push({type:name,callback:callback});
}


function csocketemit(c,name,msg){
	if (!msg) msg={};
	if (!isnode && c.host){	
		var t = hostcallbacks.filter(function (u) { return u.type==name; });
		if (t.length==1){
			t[0].callback(msg);
			return;
		}
	} else if (!c.host) {
		msg.type = name;
		c.conn.send(msg);
	}
}
	
if (!isnode){
	//
} else {
	function appendText(){
		//
	}
	function alerter(){
		//
	}
	function showCanvas(){
		//
	}
	function hideCanvas(){
		//
	}
	function identity(x){ return x; }
	function filterObj(obj,func){	//returns array
		var arr = [];
		for (var k in obj){
			if (func(obj[k])) arr.push(obj[k]);
		}
		return arr;
	}
	function updateNames(){
		spectators = filterObj(id_names,function (x) {return x.team==0;});
		red_team = filterObj(id_names,function (x) {return x.team==1;});
		blue_team = filterObj(id_names,function (x) {return x.team==2;});
	}
	function sendallinputs(conn){
			//send configs
			conn.send({type: 'mytimelimit', value: room_game_options.timelimit});
			conn.send({type: 'size_selected', value: room_game_options.size_selected});
			conn.send({type: 'terrain_selected', value: room_game_options.map_selected});
			conn.send({type: 'gamemode_selected', value: room_game_options.mode_selected});

			conn.send({type: 'lockedNames', value: true});
	}
}

function broadcast(name,data,conn){	//host
	if (!data) data={};
	data.type = name;
	conns.forEach(function (conn2) { if(conn2!=conn) conn2.send(data); });
	csocketemit({host:true}, name, data);
}

//function setuphost(){
	//not making it 'var' in order to debug	////DEBUG through 'hostobj'
	var WwidthH = WheightH = 10;
	var creaturesH = [];
	var imagegrid = false;
	var grid = false;
	var changes = [];
	var interval_send = false;
	var magiceffectsH=[];	
	var distanceeffectsH=[];
	var damageeffectsH=[];
	var interval_count = false;
	var count = 0;
	var decaycount = 0;
	var schedulecount = 0;
	var decays = [];
	var schedule = [];
	var timeout_gamestop = false;
	var reds = [];
	var blues = [];
	var greens = [];
	var shouldDetectWin = true;
	
	//room
	var friendlyfire = false;
	var playershp = 100;
	var redspawn = {x:9,y:25};
	var bluespawn = {x:90,y:25};
	var numberofrounds = 5;
	var timelimit = 5;
	var damagemultiplier = 1.0;
	var scorelimit = 5;
	
	//match
	RED = 1;
	BLUE = 2;
	GREEN = 3;
	var scoreH = [0,0,0];	//e.g. scoreH[RED]++	//might be kills or rounds
	var timerH = 0;
	var timer_locked = true;
	var NicksH = [];	//Nicks are sent together with 'changes' and 'positions'
	var fragsH = {};

	//status messages
	CHATONLY = 1;
	GAMEONLY = 2;
	
	peeron('disconnect', function (conn, msg) {
		var c = clients[conn.peer].player; 
		removeCreature(c); 
		clients[conn.peer]=undefined; 
	},true);
	
	peeron('team', function (conn_, data) {
						if(gamestarted && conn_.peer!=hostid)
							return;
						if(lockedNames && conn_.peer!=hostid)
							return;
						
						id_names[data.id].team=data.team;
						updateNames();
						if (gamestarted)
							appendText("* "+id_names[data.id].name+" was moved to "+(data.team==0 ? "Spectators" : (data.team==1 ? "Red" : "Blue")));

						conns.forEach(function(conn) { conn.send(data); });
						
						if (gamestarted && conn_.peer == hostid){	
							if (data.lastteam != 0){
								//removeCreature
								totalRemove(data.id,data.lastteam);
							}
							//createCreature
							totalCreate(data.id,data.team);
						}
	});
	
	peeron('move', function (conn, msg) { 
					var c = clients[conn.peer].player;
					var d = deltapos(c.pos, msg.dir);
					var frompos = c.pos;
					if(c.dead){	//I am the master of ad hoc
						var fromtile = makeimagetile(getTileH(c.pos));
						var totile = makeimagetile(getTileH(d));
						c.conn.send({type:"changes", correction:true, changes:[{x:c.pos.x,y:c.pos.y,imgtile:fromtile},{x:d.x,y:d.y,imgtile:totile}]});
						return;
					}
					var dir = msg.dir; 
					if (!c.offset) c.offset=conn.stamp_offset || 500;
					if (validateTimestamp(c, 'move', msg.timestamp-c.offset,(dir<4 ? WALKY_DELAY : WALKY_DIAGONAL)/c.speed,MOVE_INTERVAL)){
						var worked = moveByDir(c, dir, msg.predId);
						if (msg.expected==true && worked==false){	//most likely due to a blocking tile
							var fromtile = makeimagetile(getTileH(frompos));
							var totile = makeimagetile(getTileH(d));
							c.conn.send({type:"changes", correction:true, changes:[{x:frompos.x,y:frompos.y,imgtile:fromtile},{x:d.x,y:d.y,imgtile:totile}]});
						}
						//
						/*if (msg.totile){
							var fromtile = makeimagetile(getTileH(frompos));
							var totile = makeimagetile(getTileH(d));
							console.log(msg.totile);
							console.log(totile);
							if (!equivalentImageTile(msg.totile,totile)){
								//c.conn.send({type:"changes", tag:"correction", changes:[{x:frompos.x,y:frompos.y,imgtile:fromtile},{x:d.x,y:d.y,imgtile:totile}]});
							}
						}*/
					} else {	
						var now = getTime();
						console.log(msg.timestamp,(dir<4 ? WALKY_DELAY : WALKY_DIAGONAL),MOVE_INTERVAL,now);
						/*
						if (msg.timestamp-c.offset>now){
							c.offset = msg.timestamp-now+500;	//subtract the offset from the timestamp
						} else if (msg.timestamp-c.offset<now-MOVE_INTERVAL){	//host is ahead of peer (or it might be a long ping... dunno how to differentiate[don't need to])
							c.offset = msg.timestamp-now-500;
						}*/
						if (!c.host)
							failMove(c);
						else 
							console.log("host failmove");
					}
	},true);
				
	peeron('moveitem', function (conn, msg) {
		var c = clients[conn.peer].player; 
		if(c.dead){
			return;
		} 
		moveItemMsg(c,msg);
	}, true);
	
	peeron('equipitem', function (conn, msg) {
		var c = clients[conn.peer].player; 
		if(c.dead){
			return;
		} 
		equipItem(c,msg);
	},true);
	
	peeron('unequipitem', function (conn, msg) {
		var c = clients[conn.peer].player; 
		if(c.dead){
			return;
		} 
		unequipItem(c,msg);
	}, true);
	
	peeron('usemap', function (conn,msg) {
					var c = clients[conn.peer].player; if(c.dead){return;} 
					if (!c.offset) c.offset=conn.stamp_offset || 500;
					var delay_used = !c.casted ? USEY_DELAY : CASTY_EXHAUST;
					if (validateTimestamp(c,'use',msg.timestamp-c.offset,delay_used, USE_INTERVAL)){
						return playerUseMap(c,msg.pos,msg.predId);
					} else {
						if (!c.host)
							;	//
						else {
							console.log("host failuse");
							console.log(c,msg.timestamp,c.offset)
						}
					}
				}, true);
	//use ground a separate thing? itemtypes in client tell 'usable:true' so the client sends 'useground' instead. pros: different delay from player casting, less cluttering in playerUseMap
	//cons: need to edit itemtypes every time, can't have say a sword be groundusable (which might be a good thing...) I dunno, I'm all pros on this
	//let's just edit playerUseMap now for tests
	peeron('useinv', function (conn,msg) {
						var c = clients[conn.peer].player;
						if(c.dead){return;}
						playerUseItem(c,msg.id,msg.x,msg.y);
					},true);
	peeron('invis_hash', function (conn,msg) {
						console.log("peeron invis_hash",msg);
						var c = clients[conn.peer].player;
						if(c.dead){return;}
						broadcast("invis_hash",{invis_hash:msg.invis_hash});
						if (c.invis_hash)
							broadcast("invis_hash",{invis_hash:c.invis_hash,expire:true});
						c.invis_hash=msg.invis_hash;
					},true);
	var my_stamps = {};
	var stamp_count = 0;
	window.getTimeStamp = function (conn){
		my_stamps[conn.peer] = my_stamps[conn.peer] || {};
		var id = genPredId();
		my_stamps[conn.peer][id] = {me:getTime()};
		conn.send({type:"getTimeStamps", id:id});
	};
	peeron('timestamp', function (conn, msg) {
							var stamp = my_stamps[conn.peer][msg.id];
							stamp.received = msg.timestamp;
							stamp.now = getTime();
							var stamp_offset = (stamp.received-stamp.me) - (stamp.now-stamp.me)/2;
							conn.stamps.push(stamp_offset);
							if (conn.stamps.length<10){
								getTimeStamp(conn);
							} else {
								conn.stamp_offset = conn.stamps.reduce(function (a,b) {return a+b;})/conn.stamps.length;	//the average
								conn.send({type:"sync'd"});
								if (isnode){
									if (red_team.length <= blue_team.length){
										selectedToRed(conn);
									} else {
										selectedToBlue(conn);
									}
								}
							}
						});
	peeron('ping', function (conn, msg) {
							conn.send(msg);
	});
	peeron('command', function (conn, msg) {
							var c = clients[conn.peer].player;
							var com = msg.com;
							var param = msg.param;
							console.log('command', com, param);
							if (com == "/m"){	//summon monster
								var pos = {x:c.pos.x-1, y:c.pos.y-1};
								if (inworldH(pos)){
									var c;
									var name = param.toLowerCase();
									if (npcs[name]){
										c = createNpc(name, pos);
									}
									if (c){
										magiceffectsH.push({id:energy,pos:c.pos});
										update_S();
									}
								}
							} else if (com == "/i"){	//create item
								var pos = {x:c.pos.x-1,y:c.pos.y-1};
								if (inworldH(pos)){
									var tile = getTileH(pos.x,pos.y);
									var id = param*1;
									var itype = itemtypesH[id];
									if (itype && !itype.creature && !isblocking(topItem(tile))){
										tile.push(createItem(id,itemtypesH[id].stackable ? 10 : 1));
										refreshimgworld(pos.x,pos.y);
									}
								}
							} else if (com == "/r"){
								var pos = {x:c.pos.x-1, y:c.pos.y-1};
								if(inworldH(pos)){
									var tile = getTileH(pos.x,pos.y);
									//var id = param*1;
									//var itype = itemtypesH[id];
									if (tile.length > 1 && !(tile[tile.length-1].creature)){	//não remove chão ou creature
										tile.pop();
										refreshimgworld(pos.x, pos.y);
									}
								}
							}

	});
	
	
	//timestamp things
	var WALKY_DELAY = 200;
	var WALKY_DIAGONAL = WALKY_DELAY * 1.4;
	var USEY_DELAY = 300;
	var CASTY_EXHAUST = 400;
	var MOVE_INTERVAL = 2000;	//all timestamps earlier than getTime()-interval are ignored
	var USE_INTERVAL = 2000;	//
	var stamps = {move:"lastmove", use:"lastuse"};
	
	function validateTimestamp(c,type,timestamp,delay,max_interval){
		if (!timestamp) return false;
		var now = getTime();
		var laststamp = c[stamps[type]];
		if (!laststamp)
			c[stamps[type]] = 0;
		if (now-timestamp > max_interval)	//2 second latency... or cheating
			return false;
		else if (now-timestamp < -10)	//time traveler	//tolerance because chrome seems to be ahead of firefox by 1 to 3 ms
			return false;
		else if (timestamp-laststamp<delay){	//too quick, probably set WALK_DELAY/USE_DELAY through console
			return false;
		}
		c[stamps[type]] = timestamp;
		return true;
	}
	
	function failMove(c){
		c.conn.send({type:'pos',pos:c.pos,fail:true,tile:makeimagetile(getTileH(c.pos.x,c.pos.y)),hp:c.hp});
	}
	
	//now lots of functions
	//define spells first			//move to content_spells later

	FBarea=[[0,1,1,1,0],
			[1,1,1,1,1],
			[1,1,1,1,1],
			[1,1,1,1,1],
			[0,1,1,1,0]];
	function castFB(c,pos,origin){//) {
		doArea(c, pos, FBarea, firehit, d(2,6), "#FFA000", origin, c.team);
		return 1;
	}

	function castMW(c,pos,origin) {
		var tile = getTileH(pos.x,pos.y);
		var t = topItem(tile);
		if (isblocking(t)){
			tile = getTileH(origin.x,origin.y);
			t = topItem(tile);
			pos = origin;
		}
		if (isblocking(t)) {
			//broadcast("distanceeffect", {frompos:c.pos,topos:origin,id:2});
			distanceeffectsH.push({frompos:c.pos,topos:origin,id:frozenstar});
			return 1;
		}
		//broadcast("distanceeffect", {frompos:c.pos,topos:pos,id:2});
		distanceeffectsH.push({frompos:c.pos,topos:origin,id:frozenstar});
		tile.push(createItem(magicwall,1));
		refreshimgworld(pos.x, pos.y);
		adddecayatpos(magicwall, pos, 80);	//40 sec
		return 1;
	}
	
	function castHealing(c,pos){
		doArea(c,pos,[[1]],magicdust,_d(1,8,1), "#00A0FF", pos, c.team);
		var t = topItem(getTileH(pos));
		if (t.creature && getField(getTileH(pos)) != "poison")	
			t.poisoned = false;
		return 1;
	}
	
	function getField(tile){
		for (var i in tile){
			var t = tile[i];
			if (itemitype(t).field){
				return itemitype(t).field;
			}
		}
		return false;
	}
	
	function castPoisonField(c,pos,origin){
		var tile = getTileH(pos);
		var t = topItem(tile);
		if (!t.creature && isblocking(t)){
			tile = getTileH(origin);
			t = topItem(tile);
			pos = origin;
		}
		if (t.creature){
			tile.pop();
			tile.push(createItem(poisongas,1));
			tile.push(t);
			itemtypesH[poisongas].onwalk(t);
			refreshimgworld(pos.x,pos.y);
		} else {
			tile.push(createItem(poisongas,1));
			refreshimgworld(pos.x,pos.y);
		}
		distanceeffectsH.push({frompos:c.pos,topos:pos,id:poisonspit});	//broadcast("distanceeffect",
		adddecayatpos(poisongas,pos,240);	//2 minutes
		return 1;
	}
	
	function walkPoisonGas(c){
		doArea(c, c.pos, [[1]], poisonhit, d(1,2,1), "#00FF00", c.pos, 0);
		if (!c.poisoned){
			c.poisoned = true;
			var f = function () {
				if (c.dead || !c.poisoned)
					return;
				doArea(c,c.pos,[[1]],poisonhit,d(1,2,0),"#00FF00",c.pos,0);
				if (getField(getTileH(c.pos))=="poison")	{
					c.poison_count--;
				}
				c.poison_count++;
				if (c.poison_count >= c.poison_maxcount) {
					//successful saving throw
					c.poisoned = false;
				} else {
					addschedule(f,4);
				}
			};
			c.poison_count = 1;
			c.poison_maxcount = d(1,6,0)();
			addschedule(f,4);
		} else {
			var count = 1;
			var maxcount = d(1,6,0)();
			if (c.poison_maxcount - c.poison_count < maxcount - count){
				c.poison_count = count;
				c.poison_maxcount = maxcount;
			}
		}
	}

	function adddecayatpos(imgid,pos,t) {		//After the time is up, it deletes whatever is the top item.
		decays[decaycount]={imgid:imgid,pos:pos,count:count+t};
		decaycount++;
	}

	function addschedule(func,t) {
		var sch = {func:func,count:count+t,id:schedulecount}
		schedule[schedulecount]=sch;
		schedulecount++;
		return sch;	//If you wanna track the event and maybe cancel it.
	}

	function effectLifePotion(c) {
		doArea(c, c.pos, [[1]], magicdust, _d(2,8,1), "#00A0FF", c.pos, c.team);
		if (getField(getTileH(c.pos)) != "poison")	//drinking a life potion inside a poison cloud
			c.poisoned = false;
	}

	function effectInvisPotion(c) {
		if (c.invis_sch){
			schedule[c.invis_sch.id] = false;
			c.invis_sch = false;
		}
		magiceffectsH.push({id:magicdust,pos:c.pos});// updateSendEffects();		//,predId:!c.host && c.conn.peer
		c.invisible=true;
		refreshimgworld(c.pos.x, c.pos.y, c.host ? hostid : c.conn.peer);
		csocketemit(c,'invisible', {invisible: true});
		c.invis_sch = addschedule(function () {
								c.invisible=false; 
								refreshimgworld(c.pos.x,c.pos.y,!c.host && c.conn.peer)
								magiceffectsH.push({id:poff,pos:c.pos});// updateSendEffects();
								csocketemit(c,'invisible', {invisible: false, player_imgid: c.imgid});
					  }, 30); //15 sec
	}

	function effectHastePotion(c) {
		if (c.haste_sch){
			schedule[c.haste_sch.id] = false;
			c.haste_sch = false;
		}
		magiceffectsH.push({id:magicdust,pos:c.pos});// updateSendEffects();	//,predId:!c.host && c.conn.peer
		c.speed = 1.5;	//normal is 1
		csocketemit(c,"speed",{speed:c.speed});
		c.haste_sch = addschedule(function () {
							addschedule(function () { c.speed=1; }, 2);		//necessary because delay, prediction, etc
							csocketemit(c,"speed",{speed:1});
							sendpoff(c.pos);
					},60); //30 sec
	}
	
	function sendpoff(pos){
		magiceffectsH.push({id:poff,pos:pos});// updateSendEffects();
	}

	function onUseIncrement(c, self, pos) {	//practical for things like levers and dooors	//self is [itemid,count]
		self[0]++;
		refreshimgworld(pos.x, pos.y);
	}

	function onUseDecrement(c, self, pos) {
		self[0]--;
		refreshimgworld(pos.x, pos.y);
	}

	spells = { onUseDecrement: onUseDecrement, onUseIncrement: onUseIncrement, sendpoff:sendpoff, effectHastePotion:effectHastePotion, //...
			castFB: castFB, castHealing:castHealing };



	

	//area/path magic
	
	function isSightClear(frompos, topos)
	{
		var start = newpos(frompos.x,frompos.y);
		var end = newpos(topos.x,topos.y);
		
		var deltax, deltay;
		deltax = Math.abs(start.x - end.x);
		deltay = Math.abs(start.y - end.y);
		
		var max = deltax, dir = 0;
		if(deltay > max)
		{
			max = deltay;
			dir = 1;
		}
		
		var temp;
		
		switch(dir)
		{
			case 0:
				//x -> x
				//y -> y
				break;
			case 1:
				//x -> y
				//y -> x
				temp = start.x;
				start.x = start.y;
				start.y = temp;
				temp = end.x;
				end.x = end.y;
				end.y = temp;
				temp = deltax;
				deltax = deltay;
				deltay = temp;
				break;
		}
		
		var stepx = ((start.x < end.x) ? 1 : -1);
		var stepy = ((start.y < end.y) ? 1 : -1);
		
		var x, y;
		var errory = 0;
		x = start.x;
		y = start.y;
		
		var lastrx = x, lastry = y;
		
		for( ; x != end.x + stepx; x += stepx)
		{
			var rx, ry;
			switch(dir)
			{
				case 1:
					rx = y; ry = x;
					break;
				default: //0
					rx = x; ry = y;
					break;
			}
			
			if(!(topos.x == rx && topos.y == ry) &&
			  !(frompos.x == rx && frompos.y == ry))
			{
				lastrx = rx; lastry = ry;

				var tile = getTileH(rx, ry);
				if(tile)
				{
					if(ispathblocking(topItem(tile)))
						return false;
				}
			}

			errory += deltay;
			if(2*errory >= deltax)
			{
				y += stepy;
				errory -= deltax;
			}
		}
		return true;
	}
	global.isSightClear = isSightClear;
	
	function isSightClear_(frompos, topos){
		var path = ispathclear(frompos,topos,false);
		var path_ = ispathclear(topos,frompos,false);
		return (path && cmppos(path[0],topos) && path_ && cmppos(path_[0],frompos));
	}
	global.isSightClear_ = isSightClear_;
	
	function bresenham(pos0, pos1, callback){
		var x0=pos0.x;
		var x1=pos1.x;
		var y0=pos0.y;
		var y1=pos1.y;
		var dx = Math.abs(x1-x0);
		var dy = Math.abs(y1-y0);
		var sx,sy;
		if (x0 < x1) { sx = 1; } else {sx = -1;}
		if (y0 < y1) { sy = 1; } else {sy = -1;}
		var err = dx-dy;
		while (true){
			callback(x0,y0);
			if (x0 == x1 && y0 == y1) { 
				return;
			}
			var e2 = 2*err;
			if (e2 > -dy) { 
			   err = err - dy;
			   x0 = x0 + sx;
			}
			if (e2 < dx) { 
			   err = err + dx;
			   y0 = y0 + sy;
			}
		}
	}
	global.bresenham = bresenham;
	
	function ispathclear_depr(pos0, pos1, stopatcreature, range){
		range = range || rangepos(pos0,pos1);
		var state = {lastnonblock:pos0};
		var c = topItem(getTileH(pos0));
		bresenham(pos0, pos1, function (x,y) {
			if (state.hit) {
				return;
			}
			var pos = newpos(x,y);
			if (rangepos(pos0,pos)>range){
				state.last = state.lastnonblock;
				state.hit = true;
				return;
			}
			if (!inworldH(pos)){
				state.last = state.lastnonblock;
				state.hit = true;
				return;
			}
			var t = topItem(getTileH(pos));
			if (ispathblocking(t)){
				state.last = pos;
				state.hit = true;
				return;
			}
			if (t.creature && stopatcreature && t!=c){
				state.last = pos;
				state.hit = true;
				return;
			}
			state.lastnonblock = pos;
			state.last = pos;
		});
		return [state.last, state.lastnonblock];
	}
	
	function ispathclear(pos0, pos1, stopatcreature, range){
		range = range || rangepos(pos0,pos1);
		var state = {lastnonblock:pos0};
		var c = topItem(getTileH(pos0));
		bresenham(pos0, pos1, function (x, y) {
			if (state.hit) {
				return;
			}
			var pos = newpos(x, y);
			if (rangepos(pos0, pos) > range){
				state.last = state.lastnonblock;
				state.hit = true;
				return;
			}
			if (!inworldH(pos)){
				state.last = state.lastnonblock;
				state.hit = true;
				return;
			}
			var t = topItem(getTileH(pos));
			if (ispathblocking(t)){
				state.last = pos;
				state.hit = true;
				return;
			}
			if (t.creature && stopatcreature && t!=c){
				state.last = pos;
				state.hit = true;
				return;
			}
			state.lastnonblock = pos;
			state.last = pos;
		});
		return [state.last, state.lastnonblock];
	}
	
	
	global.ispathclear = ispathclear;
	
	function hits(pos,topos,area){	//does not consider pathblocking
		var cx,cy;
		if (area.center){
			cx=area.center.x;
			cy=area.center.y;
		} else {
			var found = false;
			for (var y=0;y<area.length;y++) {	//inverted for pretty arrays
				var xs=area[y];
				for (var x=0;x<xs.length;x++) {
					if (xs[x] == 2 || xs[x] == 3){
						found = true;
						cx = x;
						cy = y;
					}
				}
			}
			if (!found){
				cx = (area[0].length+1)/2-1;	//length must be odd
				cy = (area.length+1)/2-1;
			}
		}
		for (var y=0;y<area.length;y++) {	
			var xs=area[y];
			for (var x=0;x<xs.length;x++) {
				if (xs[x]==1 || xs[x]==3) {	//1 and 3 mean hit, 0 or anything else means no
					var pos2 = {x:pos.x+x-cx, y:pos.y+y-cy};
					if (pos2.x == topos.x && pos2.y == topos.y){
						//
						return true;
					}
				}
			}
		}
		return false;
	}
	
	function doArea(c, pos, area, neffect, damage, color, origin, cteam) {	//origin = "last pos that was clear"
		origin = origin || pos;
		var cx,cy;
		if (area.center){
			cx=area.center.x;
			cy=area.center.y;
		} else {
			var found = false;
			for (var y=0;y<area.length;y++) {	//inverted for pretty arrays
				var xs=area[y];
				for (var x=0;x<xs.length;x++) {
					if (xs[x] == 2 || xs[x] == 3){
						found = true;
						cx = x;
						cy = y;
					}
				}
			}
			if (!found){
				cx = (area[0].length+1)/2-1;	//length must be odd
				cy = (area.length+1)/2-1;
			}
		}
		for (var y=0;y<area.length;y++) {	
			var xs=area[y];
			for (var x=0;x<xs.length;x++) {
				if (xs[x]==1 || xs[x]==3) {	//1 and 3 mean hit, 0 or anything else means no
					var pos2 = {x:pos.x+x-cx,y:pos.y+y-cy};
					if (!inworldH(pos2)) { continue;}
					//var path = ispathclear(origin,pos2,false);
					//var path_ = ispathclear(pos2,origin,false);
					if (isSightClear_(origin, pos2)){	//(path && cmppos(path[0],pos2) && path_ && cmppos(path_[0],origin)){
						var pos3 = pos2;	//ispathblocking(topItem(getTileH(path[0]))) ? path[1] : path[0];
						if(neffect)	//false for no effect
							magiceffectsH.push({id:neffect,pos:pos3});
						var tile = getTileH(pos3);
						var t = topItem(tile);
						if (t.creature && !t.invincible) {
							var dmg = Math.floor(damage()*damagemultiplier);
							if ((friendlyfire || dmg<0) || cteam != t.team){
								var text = dmg;
								if (dmg>0){
									t.lasthitcreature = c;
									text = Math.min(t.hp,dmg);
								} else {
									text = Math.min(t.maxhp-t.hp,-dmg);
								}
								damageeffectsH.push({text:text,pos:pos3,color:color});	//broadcast damage effect
								t.hp-=dmg;
								if (t.hp>t.maxhp) t.hp = t.maxhp;
								refreshHP(t);
								checkCreature(t);
							}
						} else if (t.creature && t.invincible) {
							magiceffectsH.push({id:poff,pos:pos3});
						} else if (!t.creature) {
							//damagetile(pos3,damage);
						}
					}
				}
			}
		}
		//updateSendEffects();	//only once
	}
	
	//damage
	function d(n,f,p){	//e.g. 3d6+3
		p = p || 0;
		return function (){
			var sum = 0;
			for (var i=0;i<n;i++){
				sum += R(f)+1;
			}
			return sum+p;
		};
	}
	
	//healing
	function _d(n,f,p){	//
		return function () { return -d(n,f,p)(); };
	}
	
	//now dealing with items and how the player interacts with them
	
	var itemtypesH = [	{id:0, blocking: false, movable: false, stackable: false, imgid: 0},	//grass
						{id:1, blocking: true, movable: false, stackable: false, imgid: 1, creature: true},	//creature //just for filling purposes
						{id:2, blocking: true, movable: false, stackable: false, imgid: 2, pathblocking: true, hp: 200},	//tree
						{id:3, blocking: false, movable: true, stackable: false, imgid: 3, slot: [LEFT,RIGHT], usewith: true, attack: d(1,8,2) /*d(2,6,2)*/, range: 2, animationid: 0, critical: 0.10, mult: 2,type: "slashing"},	//sword
						{id:4, blocking: false, movable: true, stackable: false, imgid: 4, slot: [LEFT,RIGHT], usewith: true, attack: d(1,8), range: 9, animationid: 1, ammo: 5, critical: 0.05, mult: 3, type: "piercing"},		//bow
						{id:5, blocking: false, movable: true, stackable: true, imgid: 5, slot: [AMMO], usewith: false},		//arrow	
						{id:6, blocking: false, movable: true, stackable: true, imgid: 6, slot: [LEFT,RIGHT], damage: d(2,6), usewith: true, range: 9, animationid: 3, cast: castFB, removeonuse: true},	//fireball rune
						{id:7, blocking: false, movable: true, stackable: true, imgid: 7, slot: [LEFT,RIGHT], usewith: true, range: 9,/*animationid:2,*/cast: castMW, removeonuse: true, ignorecreaturesinthepath: true},	//magic wall rune
						{id:8, blocking: true, movable: false, stackable: false, imgid: 8, pathblocking: true},	//magic wall
						{id:9, blocking: false, movable: true, stackable: true, imgid: 9, usewith: false, use: true, effect: effectLifePotion, removeonuse: true},	//life potion
						{id:10, blocking: false, movable: true, stackable: true, imgid: 10, usewith: false, use: true, effect: effectInvisPotion, removeonuse: true},	//invisibility potion
						{id:11, blocking: false, movable: true, stackable: true, imgid: 11, usewith: false, use: true, effect: effectHastePotion, removeonuse: true},  //haste potion
						{id:12, blocking: true, movable: false, stackable: false, imgid: 12, pathblocking: true, usemap: true},	//fruity tree
						{id:13, blocking: false, movable: true, stackable: true, imgid: 13, usewith: false, use: true},//,effect:makeEffectFeed(50),removeonuse: true},	//apple
						{id:14, blocking: true, movable: false, stackable: false, imgid: 14, pathblocking: true},//,hp:400,drop:dropStoneWall,pillar:true},	//stone wall
						{id:15, blocking: true, movable: false, stackable: false, imgid: 15, pathblocking: true},//, usemap:true,effect:effectOpenDoor,hp:200},	//closed door
						{id:16, blocking: false, movable: false, stackable: false, imgid: 16},//, usemap:true,effect:effectCloseDoor},	//open door
						{id:17, blocking: true, movable: false, stackable: false, imgid: 17, pathblocking: false},	//water
						{id:18, blocking: true, movable: false, stackable: false, imgid: 18, creature: true},	//red player
						{id:19, blocking: true, movable: false, stackable: false, imgid: 19, creature: true},	//blue player
						{id:20, blocking: true, movable: false, stackable: false, imgid: 20, pathblocking: false},	//bush
						{id:21, blocking: false, movable: false, stackable: false, imgid: 21},	//grass with texture
						{id:22, blocking: true, movable: false, stackable: false, imgid: 22, pathblocking: true},	//fir tree
						{id:23, blocking: true, movable: false, stackable: false, imgid: 23},	//branch
						{id:24, blocking: false, movable: false, stackable: false, imgid: 24},	//snow
						{id:25, blocking: true, movable: false, stackable: false, imgid: 25, pathblocking: true},	//snowy fir tree
						{id:26, blocking: true, movable: false, stackable: false, imgid: 26, pathblocking: true},	//snowy dead tree twisted
						{id:27, blocking: true, movable: false, stackable: false, imgid: 27, pathblocking: true},	//snowy dead tree half alive
						{id:28, blocking: false, movable: false, stackable: false, imgid: 28},	//sand
						{id:29, blocking: true, movable: false, stackable: false, imgid: 29, pathblocking: true},	//palm tree
						{id:30, blocking: true, movable: false, stackable: false, imgid: 30, pathblocking: true},	//cactus thick
						{id:31, blocking: true, movable: false, stackable: false, imgid: 31, pathblocking: true},	//cactus sharp
						{id:32, blocking: true, movable: false, stackable: false, imgid: 32, creature: true},	//green player
						{id:33, blocking: true, movable: false, stackable: false, imgid: 33, creature: true},	//dragon
						{id:34, blocking: true, movable: false, stackable: false, imgid: 34, creature: true},	//dummy
						{id:35, blocking: true, movable: false, stackable: false, imgid: 35, pathblocking: true},	//tree
						{id:36, blocking:true, movable: false, stackable: false, imgid: 36, creature: true},		//red player invincible
						{id:37, blocking:true, movable: false, stackable: false, imgid: 37, creature: true},		//blue player invincible
						{id:38, blocking:true, movable: false, stackable: false, imgid: 38, creature: true},		//green player invincible
						{id:39, blocking:false, movable: false, stackable: false, imgid: 39},	//ice
						{id:40, blocking:false, movable: true, stackable: true, imgid: 40, damage: _d(1,8,1), slot: [LEFT,RIGHT], usewith: true, range: 9, cast: castHealing, removeonuse: true},	//healing rune
						{id:41, blocking:false, movable: true, stackable: false, imgid: 41, slot: [TORSO], armor: 4},	//leather armor
						{id:42, blocking:false, movable: true, stackable: false, imgid: 42, slot: [LEGS], armor: 1},	//leather legs
						{id:43, blocking:false, movable: true, stackable: false, imgid: 43, slot: [HEAD], armor: 1},	//leather helmet
						{id:44, blocking:false, movable: true, stackable: false, imgid: 44, slot: [BOOTS], armor: 1},	//leather boots
						{id:45, blocking:true, movable: false, stackable: false, imgid: 45, creature: true},			//magic dust creature
						{id:46, blocking:false, movable: true, stackable: true, imgid: 46, slot: [LEFT,RIGHT], usewith:true, range:9,/*animationid: 4,*/cast: castPoisonField, removeonuse: true},		//poison field rune
						{id:47, blocking:false, movable: false, stackable: false, imgid: 47, onwalk: walkPoisonGas, field: 'poison'},	//poison gas
						{id:48, blocking:true, movable: false, stackable: false, imgid: 48},	//void
						{id:49, blocking:true, movable:false, stackable:false, imgid:49, onUse: onUseIncrement},	//lever	//onUse:..change imgid //uniqueOnUse at createUniqueItem
						{id:50, blocking:true, movable:false, stackable:false, imgid:50, onUse: onUseDecrement}	//pulled lever
					];

						
						
	
	//good names to have around
	var grass = 0;
	//var tree = 2;
	var sword = 3;
	var bow = 4;
	var magicwall = 8;

	var fruitytree = 12;
	var stonewall = 14;
	var door = 15;
	var opendoor = 16;
	var water = 17;
	
	var bush = 20;
	var poisongas = 47;
	
	//map grass
	var grass2 = 21;
	var firtree = 22;
	var branch = 23;
	var tree = 35;
	
	//map snow
	var snow = 24;
	var snowy_fir_tree = 25;
	var snowy_dead_tree_twisted = 26;
	var snowy_dead_tree_halfalive = 27;
	var ice = 39;
	
	//map desert
	var sand = 28;
	var palm_tree = 29;
	var cactus_thick = 30;
	var cactus_sharp = 31;
	
	var redplayer = 18;
	var blueplayer = 19;
	var greenplayer = 32;
	var dragon = 33;
	var dummy = 34;
	var redplayer_aura = 36;
	var blueplayer_aura = 37;
	var greenplayer_aura = 38;

	var criticalhit = 0;
	var firehit = 1;
	var drawblood = 2;
	var poff = 3;
	var magicdust = 4;
	var splash = 5;
	var block = 6;
	var energy = 7;
	var poisonhit = 8;
	
	var frozenstar = 2;
	var poisonspit = 4;
	//


	
	function createItem(itid,count) {
		return [itid,count];
	}
	
	function itemimgid(item) {
		return item[0];
	}
	
	function itemcount(item) {
		return item[1];
	}
	
	function itemitype(i){
		if (i.creature){
			return itemtypesH[i.imgid];
		} else {
			return itemtypesH[itemimgid(i)];
		}
	}
	
	function addItemCount(item,add) { item[1]+=add;}

	
	//game functions
	function moveItemMsg(c,msg) {
		if (msg.from.t=="map" && msg.to.t=="map") {
			//checks if blocking
			var totile = getTileH(msg.to.pos.x,msg.to.pos.y);
			if (!totile) {
				return;
			}
			if (isblocking(topItem(totile))) {
				return;
			}
			playerMoveItem(c,msg.from.pos,msg.to.pos);
		} else if (msg.from.t=="inv" && msg.to.t=="map") {
			var id = msg.from.id;
			var count = msg.from.count;
			if (!inworldH(msg.to.pos)) {return;}
			var totile = getTileH(msg.to.pos.x,msg.to.pos.y);
			if (c.inventory.items[id]>=count) {	
				if (!totile) { 	//change this for isPathClear later
					myAddToInv(c, id, count);
					return;
				}
				if (isblocking(topItem(totile))) { 	//should send an addtoinv back
					myAddToInv(c, id, count);
					return;
				}
				c.inventory.items[id]-=count;
				var item = createItem(id,count);
				totile.push(item);
				refreshimgworld(msg.to.pos.x,msg.to.pos.y);
			}
		} else if (msg.from.t == "eq" && msg.to.t=="map"){
			var index = msg.from.index;
			var item = c.inventory.equips[index];
			if (item){
				var id = itemitype(item).id;
				var count = itemcount(item);
				if (!inworldH(msg.to.pos)) {return;}
				var totile = getTileH(msg.to.pos.x,msg.to.pos.y);
				if (!totile) { 	//change this for isPathClear later
					myAddToInv(c, id, count);
					return;
				}
				if (isblocking(topItem(totile))) { 	//should send an addtoinv back
					myAddToInv(c, id, count);
					return;
				}
				c.inventory.equips[index]=false;
				var item = createItem(id,count);
				totile.push(item);
				refreshimgworld(msg.to.pos.x,msg.to.pos.y);
			}
		} else if (msg.from.t=="map" && msg.to.t=="inv") {
			var pos = msg.from.pos;
			if (Math.abs(c.pos.x-pos.x) <= 1 && Math.abs(c.pos.y-pos.y) <= 1)
			if (inworldH(pos)) {
				var fromtile = getTileH(pos.x,pos.y);
				item = topItem(fromtile);
				if (item.creature) {return;}
				if (itemitype(item).movable && !itemitype(item).unpickupable) {
					fromtile.pop();
					refreshimgworld(pos.x,pos.y);
					myAddToInv(c,itemitype(item).id,itemcount(item));
				}
			}
		} else if (msg.from.t=="map" && msg.to.t=="eq") {
			var pos = msg.from.pos;
			if (Math.abs(c.pos.x-pos.x) <= 1 && Math.abs(c.pos.y-pos.y) <= 1)
			if (inworldH(pos)) {
				var fromtile = getTileH(pos.x,pos.y);
				item = topItem(fromtile);
				if (item.creature) {return;}
				if (itemitype(item).movable && !itemitype(item).unpickupable) {
					var id = itemitype(item).imgid;
					var index = msg.to.index;
					if(itemtypesH[id].slot.indexOf(index)>-1 && !c.inventory.equips[index]){	//equiplist[id][index] 
						fromtile.pop();
						refreshimgworld(pos.x,pos.y);
						c.inventory.equips[index]=createItem(id,itemcount(item));
						csocketemit(c, 'addtoeq', {item:{count:itemcount(item), imgid: id},index:index});
					}
				}
			}
		}
	}
	
	function playerMoveItem(c,frompos,topos){
		if (Math.abs(c.pos.x-frompos.x)<=1 && Math.abs(c.pos.y-frompos.y) <= 1) {
			moveItem(frompos,topos);
		}
	}

	function moveItem(frompos,topos) {	//only items on the map, not in inventory
		var fromtile = getTileH(frompos.x,frompos.y);
		if (!fromtile) return;
		var item = topItem(fromtile);
		if (item.creature) return;
		if (!itemitype(item).movable) return;
		var path = ispathclear(frompos,topos,false);
		var topos = path[0];
		var topos2 = path[1];
		var totile = getTileH(topos.x,topos.y);
		if (!totile) return;
		var totile2 = getTileH(topos2.x,topos2.y);
		if (isblocking(topItem(totile))) {
			totile=totile2;
			topos=topos2;
		}
		fromtile.pop();
		totile.push(item);
		refreshimgworld(frompos.x,frompos.y,false,true);
		refreshimgworld(topos.x,topos.y,false,true);
		//updateSendChanges(); //need to send both at the same time
	}
	
	function myAddToInv(c,id,count) {
		if (!count)
			count=1;
		addItemtoInventory(c.inventory,id,count);
		csocketemit(c,'addtoinv',{item:{count:count, imgid: id}});
	}

	function myAddToEq(c,id,count,slot){
		c.inventory.equips[slot]=createItem(id,count);
		csocketemit(c, 'addtoeq', {item:{count:count, imgid: id},index:slot});
	}

	//if (!isnode && imhost)
		//window.myAddToInv = myAddToInv;
	
	function myRemoveFromEq(c,index) { 
		if (c.inventory.equips[index] && itemcount(c.inventory.equips[index])>1) {
			addItemCount(c.inventory.equips[index],-1);
		} else {
			c.inventory.equips[index] = false;
		}
		if (c.player)
			csocketemit(c,'removefromeq',{index:index});
	}
	
	function removeItemfromInventory(inventory,id) {
		if (inventory.items[id] && inventory.items[id]>0) {
			inventory.items[id]-=1;
			return true;
		}
		return false;
	}

	function addItemtoInventory(inventory,id,count) {
		if (!inventory.items[id]) {inventory.items[id]=0;}
		inventory.items[id]+=count;
	}
	
	function newInventory() {
		return {equips:[],items:{}};
	}
	//if (!isnode && imhost)
		//window.newInventory = newInventory;		//room.js
	
	function equipItem(c,msg) {
		var id = msg.id;
		var index = msg.index;
		if (c.inventory.items[id] && c.inventory.items[id]>=msg.count && itemtypesH[id].slot.indexOf(index)>-1){	//TODO: check if item goes there	//equiplist[id][index]
			if (!c.inventory.equips[index]) {
				c.inventory.items[id]-=msg.count;
				c.inventory.equips[index]=createItem(id,msg.count);
				//c.armor = getInventoryArmor(c.inventory);
			} else if (itemimgid(c.inventory.equips[index]) == id){
				var x = clamp(itemcount(c.inventory.equips[index]) + msg.count, 1, 10);
				c.inventory.items[id] -= x - itemcount(c.inventory.equips[index]);
				c.inventory.equips[index]=createItem(id,x);
			}
		}
	}

	function unequipItem(c,msg) {
		var index = msg.index;
		var item = c.inventory.equips[index];
		if (item) {
			c.inventory.equips[index]=false;
			if (!c.inventory.items[itemitype(item).id]) {
				c.inventory.items[itemitype(item).id]=0;
			}
			c.inventory.items[itemitype(item).id]+=itemcount(item);
			//c.armor = getInventoryArmor(c.inventory);
		}
	}
	
	function playerUseMap(c, pos, predId) {
		if (inworldH(pos)){
			var tile = getTileH(pos);
			var top = topItem(tile);
			if (itemitype(top).onUse){
				if (top.onUse){	//unique (probably unmovable)
					top.onUse(c, top, pos);		//ad hoc ordering, unpulled lever changes imgid only after its effect
				}
				itemitype(top).onUse(c, top, pos);
				update_S();
				return;
			}
		}

		var weapon1=c.inventory.equips[LEFT];
		var weapon2=c.inventory.equips[RIGHT];
		var weapon;
		var hand;
		var void_=false;
		c.casted = false;
		if (weapon1 && itemitype(weapon1).usewith){
			weapon=itemitype(weapon1);
			hand = LEFT;
		} else if (weapon2 && itemitype(weapon2).usewith){
			weapon=itemitype(weapon2);
			hand = RIGHT;
		}
		if (!weapon) return;
		if (c.invincible) return;	//"invincible nao ataca, soh move"
		/*if (rangepos(c.pos,pos)>weapon.range) {
			pos=limitpos(c.pos,pos,weapon.range);
		}*/
		var origin;
		if (rangepos(c.pos,pos)==1){
			origin = c.pos;
		} else {
			var path = ispathclear(c.pos,pos,!weapon.ignorecreaturesinthepath,weapon.range);	//it returns the last pos that was clear
			path = ispathclear(c.pos,path[0],!weapon.ignorecreaturesinthepath,weapon.range);	//normalize path
			pos = path[0];
			origin = ispathblocking(topItem(getTileH(path[0]))) ? path[1] : path[0];
			//console.log(path,origin);
		}
		var tile = getTileH(pos.x,pos.y);
		if (!tile){
			void_=true;
		}
		var range = rangepos(c.pos,pos);
		if (weapon.ammo) { 
			if(c.inventory.equips[AMMO] && itemitype(c.inventory.equips[AMMO]).id==weapon.ammo) {
				myRemoveFromEq(c,AMMO);
			} 
			else return; 
		}
		if (weapon.animationid || weapon.animationid === 0) { //i.e. not false/undefined, but maybe 0
			//broadcast("distanceeffect", {id:weapon.animationid,frompos:c.pos,topos:pos,predId:predId});
			distanceeffectsH.push({id:weapon.animationid,frompos:c.pos,topos:pos});
		}
		if (weapon.attack) {
			if (tile){	//declared some lines back
				//sends animation and exhausts you even if you missed
				var t=topItem(tile);
				var damage = Math.floor(weapon.attack()*damagemultiplier);
				if (t.creature && !t.invincible) {
					if ((friendlyfire && range>0)|| c.team != t.team){ //'friendlyfire' disregarded if he clicks directly on himself
						magiceffectsH.push({/*predId:predId,*/id:drawblood,pos:pos});// updateSendEffects();	//no predId, don't predict it because friendlyFire
						if (weapon.critical && Math.random()<=weapon.critical) {
							damage*=weapon.mult;	
							//damageeffectsH.push({text:"CRITICAL",pos:pos,color:"#FF0000"});// updateSendEffects(); //todo: broadcast damage effect
						}
						//damage = Math.max(0,damage-t.armor);	//armor is damage reduction
						damageeffectsH.push({text:Math.min(t.hp,damage),pos:pos,color:"#FF0000"});// updateSendEffects(); //todo: broadcast damage effect
						t.hp-=damage;
						refreshHP(t);
						t.lasthitcreature=c;
						checkCreature(t);
					}
				} else if (t.creature && t.invincible) {
					magiceffectsH.push({id:poff,pos:pos});// updateSendEffects();
				} else if (!t.creature) { //missed
					var itype = itemitype(t);
					//if (weapon.ammo){
						if (itype.pathblocking)
							magiceffectsH.push({id:block,pos:pos,predId:predId});// && updateSendEffects();
						else //if (range>1)
							magiceffectsH.push({id:poff,pos:pos,predId:predId});// && updateSendEffects();
					//}
				}
			}
		} else if (weapon.cast && (!void_ || weapon.useonvoid)) {	//it is a function, but counts as an attack //weapon.useonvoid legacy TileBased
			var q = weapon.cast(c,pos,origin,predId);//,origin);
			if (weapon.removeonuse && q)	//usually runes aren't eternal, but maybe I'll have rods/wands too?
				myRemoveFromEq(c,hand);
			c.casted = true;
		}
		update_S();
	}

	
	function playerUseItem(c,id,x,y) {	//only from inv   //(x,y) is where the item came from, just so we can send it back
		if(c.inventory.items[id]) {
			var it = itemtypesH[id];
			if (it.use){
				if (it.effect) {
					it.effect(c);
				}
				if (it.removeonuse) {
					c.inventory.items[id]-=1;
					if (c.player) {//it obviously is
						csocketemit(c,"removefrominv",{id:id,x:x,y:y});
						if (c.host){
							//call the callback from the hostcallbacks?
						}
					}
				}
			}
		}
		update_S();
	}
						
						
	//movement
	function getTileH_(pos){
		return grid[pos.x][pos.y];
	}
	
	function getTileH(x,y){
		if (!y && y!=0)
			return getTileH_(x);
		return getTileH_(newpos(x,y));
	}
	
	function equivalentImageTile(tile1,tile2){	//image tiles
		if (tile1.length != tile2.length)
			return false;
		for (var i = 0; i<tile1.length; i++){
			var item1 = tile1[i];
			var item2 = tile2[i];
			if (item1.creature || item2.creature){
				if (!item1.creature || !item2.creature)
					return false;
				if (item1.id == item2.id)
					continue;
				return false;
			}
			if (item1 != item2){	//both imgids
				return false;
			}
		}
		return true;
	}
	
	function makeimagetile(tile){
		var imgtile = [];
		for (var i=0;i<tile.length;i+=1){
			var j = getImgid(tile[i]);
			if (j!='i'){
				imgtile.push(j);
			}
		}
		return imgtile;
	}
	
	function getImgid(t) {
		if (t.creature) {
			if (t.invisible) {
				return 'i';
			} 
			return {creature:true,id:t.id,peerid:t.peerid, imgid: t.imgid,hp:t.hp/t.maxhp,nick:t.nick,walking:t.walking,walk_delay:t.walk_delay,pos:t.pos,frompos:t.frompos,dir:t.dir};
		}
		return itemitype(t).imgid;
	}
	
	function refreshimgworld(x,y,predId,push) {
		var tile = getTileH(x,y);
		if (!tile) {console.log("!tile"); console.trace(); return;}
		var imgtile = makeimagetile(tile);
		imagegrid[x][y]=imgtile;
		//changes.push({predId:predId,x:x,y:y,imgtile:imgtile});
		var change = {predId:predId,x:x,y:y,imgtile:imgtile};
		if (!push){
			//conns.forEach(function (conn2) { conn2.send({type:'changes',changes:[change]}) });
			broadcast("changes", {changes:[change]});
		} else {
			changes.push(change);
		}
	}
	
	function newpos(x,y) {
		return {x:x,y:y};
	}
	
	function rangepos(pos1,pos2) {
		return Math.max(Math.abs(pos1.x-pos2.x),Math.abs(pos1.y-pos2.y));
	}
	
	function subpos(pos1,pos2){
		return {x:pos1.x-pos2.x,y:pos1.y-pos2.y};
	}
	
	function dirBetween_depr(cpos,c2pos,diagonals){
		var dir
		if (diagonals && Math.abs(cpos.x-c2pos.x)==Math.abs(cpos.y-c2pos.y)){
			var dx=c2pos.x-cpos.x;
			var dy=c2pos.y-cpos.y;
			if (dx<0 && dy>0){
				dir = SOUTHWEST;
			} else if (dx>0 && dy>0){ 
				dir = SOUTHEAST;
			} else if (dx<0 && dy<0){ 
				dir = NORTHWEST;
			} else { 
				dir = NORTHEAST;
			}
			return dir;
		}
		if(Math.abs(cpos.x-c2pos.x)>Math.abs(cpos.y-c2pos.y)){
			if (cpos.x>c2pos.x){
				dir = WEST;
			} else { 
				dir = EAST;
			}
		} else {
			if (cpos.y>c2pos.y){
				dir = NORTH;
			} else { 
				dir = SOUTH;
			}
		}
		return dir
	}
	
	function limitpos(cpos,pos,range) {
		var temppos = newpos(pos.x,pos.y);
		var max = rangepos(cpos,pos);
		while (rangepos(cpos,temppos) > range){
			temppos.x -= (pos.x-cpos.x)/max;
			temppos.y -= (pos.y-cpos.y)/max;
		}
		return newpos(Math.round(temppos.x),Math.round(temppos.y));
	}
	
NORTH = 0;
EAST = 1;
SOUTH = 2;
WEST = 3;
SOUTHWEST = 4;
SOUTHEAST = 5;
NORTHWEST = 6;
NORTHEAST = 7;

	
	var directions = [newpos(0,-1),newpos(1,0),newpos(0,1),newpos(-1,0), newpos(-1,1),newpos(1,1),newpos(-1,-1),newpos(1,-1)];
	
	var deltapos = function deltapos(pos,dir) { var dp = directions[dir]; return newpos(pos.x+dp.x,pos.y+dp.y);};
	
	function inworldH(pos) { 
		return pos.x >= 0 && pos.x < WwidthH && pos.y >= 0 && pos.y < WheightH; 
	}

	function moveByDir(c, dir, predId) { 
		c.walking = true;
		c.frompos = {x:c.pos.x, y:c.pos.y};
		c.dir = dir;
		var _pos = deltapos(c.pos,dir);
		/*addschedule(function () {
			if (c.pos.x==_pos.x && c.pos.y==_pos.y){
				c.walking = false;
				refreshimgworld(_pos.x,_pos.y,predId);
			}
			}, 1);*/
		return moveCreature(c, deltapos(c.pos, dir), predId);
	}
	
	function isblocking(item){
		if (item.creature) return true;
		return itemitype(item).blocking;
	}
	
	function ispathblocking(t) { if (t.creature) {return false;} return itemitype(t).pathblocking;}

	/*function moveWalk(c,dir){
		var topos = deltapos(c.pos,dir);
		if(!inworldH(topos)) return;
		var fromtile = getTileH(c.pos.x,c.pos.y);
		var totile = getTileH(topos.x,topos.y);
		if (totile && !isblocking(topItem(totile))){
			c.walking = true;
			c.topos = topos;
			c.dir = dir;
			refreshimgworld(c.pos.x,c.pos.y);
		}
	}*/
	
	function moveCreature(c, topos, predId){
		if(!inworldH(topos)) return;
		c.frompos = c.pos;
		var fromtile = getTileH(c.pos.x,c.pos.y);
		var totile = getTileH(topos.x,topos.y);
		if (totile && !isblocking(topItem(totile))){
			fromtile.pop();
			totile.push(c);
			c.pos = topos;
			
			totile.forEach(function (item){
				if (!item.creature && itemitype(item).onwalk)
					itemitype(item).onwalk(c);
			});
			
			if (!c.invisible){	//c.host just for debug
				refreshimgworld(c.frompos.x, c.frompos.y, predId, true);	//
				refreshimgworld(topos.x, topos.y, predId, true);
			}

			if(c.host){
				//playerpos = c.pos;
			} else if (c.npc){
				//
			} else {
				c.conn.send({predId:predId, type:"pos", pos:c.pos});
			}
			refreshNicks();
			update_S();
			return true;
		}
		if (predId)
			failMove(c);
		return false;
	}
	
	//monsters
	//e.g. createCreature(newpos(10,12), 100, dragon, true);
	//thinking, dying

	

	

	


	
	FWareas = [
				[[0,1,1,1,0],
				 [0,1,1,1,0],
				 [0,1,1,1,0],
				 [0,0,1,0,0],
				 [0,0,1,0,0],
				 [0,0,2,0,0]],
				 
				[[0,0,0,0,0,0],
				 [0,0,0,1,1,1],
				 [2,1,1,1,1,1],
				 [0,0,0,1,1,1],
				 [0,0,0,0,0,0]],
			
				[[0,0,2,0,0],
				 [0,0,1,0,0],
				 [0,0,1,0,0],
				 [0,1,1,1,0],
				 [0,1,1,1,0],
				 [0,1,1,1,0]],
				 
				[[0,0,0,0,0,0],
				 [1,1,1,0,0,0],
				 [1,1,1,1,1,2],
				 [1,1,1,0,0,0],
				 [0,0,0,0,0,0]],
				 
				[[0,0,0,0,0,2],
				 [0,0,0,0,1,0],
				 [0,0,0,1,0,0],
				 [1,0,1,0,0,0],
				 [1,1,0,0,0,0],
				 [1,1,1,0,0,0]],
				 
				[[2,0,0,0,0,0],
				 [0,1,0,0,0,0],
				 [0,0,1,0,0,0],
				 [0,0,0,1,0,1],
				 [0,0,0,0,1,1],
				 [0,0,0,1,1,1]],
			
				[[1,1,1,0,0,0],
				 [1,1,0,0,0,0],
				 [1,0,1,0,0,0],
				 [0,0,0,1,0,0],
				 [0,0,0,0,1,0],
				 [0,0,0,0,0,2]],
				 
				[[0,0,0,1,1,1],
				 [0,0,0,0,1,1],
				 [0,0,0,1,0,1],
				 [0,0,1,0,0,0],
				 [0,1,0,0,0,0],
				 [2,0,0,0,0,0]]
				 
			];
				 
	function castFW(c, pos){
		var dir = dirBetween(c.pos,pos,false);
		doArea(c,c.pos,FWareas[dir],firehit,d(1,4,0),"#FFA000",c.pos,c.team);
	}
	
	function npcCast(self, cast, pos){
		cast(self, pos);
		update_S();
	}
	
	//setupnpcs();

	/*behaviors = {};
	
	behaviors[dragon] = function (self) {
		if (!self.target || self.target.removed){
			self.target = getClosestTarget(self);
		}
		if (self.target && !self.target.removed && !self.target.invisible){
			if (!self.breath_cooldown){	// && rangepos(self.pos,self.target.pos)==1) {
				npcCast(self, castFW, self.target.pos);
				self.exhaust = self.walk_delay;
				self.breath_cooldown = d(1,4,1)();
				if (self.removed) 
					return;
			} else if (self.breath_cooldown > 0){
				self.breath_cooldown--;
			}
			if (rangepos(self.pos,self.target.pos)>1){
				var dir = followCreature(self, self.target);
				self.exhaust = dir < 4 ? self.walk_delay : self.walk_delay * 1.4;
			}
		}
	};
	
	behaviors[dummy] = function (self) {
		moveByDir(self, R(4));
	};
	*/
	
	//creatures and health
	createCreature = function (pos,hp,imgid) {	//player
		if (!inworldH(pos)) {
			console.log(pos); 
			return false;
		}
		var tile = getTileH(pos.x,pos.y);
		if (isblocking(topItem(tile))) {
			console.log(pos,tile); 
			return false;
		}
		var c = {creature:true,pos:pos,hp:hp,maxhp:hp, blocking: true, imgid: imgid};	//1=pix, see imglist
		tile.push(c);
		c.id=creaturesH.length;
		creaturesH.push(c);
		refreshimgworld(pos.x,pos.y);
		c.walk_delay = WALKY_DELAY;
		c.exhaust = c.walk_delay;	//remove these? npc-only I think
		c.accum = 0;				//remove these? ||
		return c;
	};

	createNpc = function (name, pos) {	//npc
		if (!inworldH(pos)) {
			console.log(pos); 
			return false;
		}
		var tile = getTileH(pos.x,pos.y);
		if (isblocking(topItem(tile))) {
			console.log(pos,tile); 
			return false;
		}
		var genotype = npcs[name.toLowerCase()];
		if (!genotype)
			console.log("name not found at createNpc: "+name.toLowerCase());
		var c = {creature: true, npc: true, pos: pos, hp: genotype.hp, maxhp: genotype.hp, blocking: true, imgid: genotype.imgid, nick: genotype.name, behavior: genotype.behavior, genotype: genotype};	//genotype might contain things like lists of attacks and support and actions etc for certain general behavior functions
		tile.push(c);
		c.id = creaturesH.length;
		creaturesH.push(c);
		refreshimgworld(pos.x, pos.y);
		c.walk_delay = genotype.walk_delay || 500;		//provisory
		c.exhaust = c.walk_delay;
		c.accum = 0;
		return c;
	}
	
	function refreshHP(c){
		if (c.player){
			csocketemit(c,"hp",{hp:c.hp,maxhp:c.maxhp});
		}
		updateNicks();	//his lifebar changed
	}
	
	function dropItems(t,tile){	//33% chance of drop
                var itemlist = [];
		for (var i in t.inventory.items){
			if (itemtypesH[i].stackable && R(100)<33){
				var count = t.inventory.items[i];
				while (count>10){
					tile.push(createItem(i,10));
					count-=10;
				}
				tile.push(createItem(i,count));
			}
		}
		for (var i in t.inventory.equips){	//66%
			var item = t.inventory.equips[i];
			if (item && itemtypesH[item[0]].stackable && R(100)<66){
				tile.push(item);
			}
		}
		refreshimgworld(t.pos.x,t.pos.y);
	}

	function dropItems2(t,tile){
		var itemlist = [];
		for (var i in t.inventory.items){
			if (itemtypesH[i].stackable){
				var count = t.inventory.items[i];
				while (count > 10){
					itemlist.push([i,10]);
					count -= 10;
				}
				itemlist.push([i,count]);
			} else {
				itemlist.push([i,1]);
			}
		}
		for (var i in t.inventory.equips){
			var item = t.inventory.equips[i];
			if (item && itemtypesH[item[0]].stackable){
				itemlist.push(item);
			}
		}
		var chosen = itemlist[R(itemlist.length)];
		tile.push(chosen);
		refreshimgworld(t.pos.x,t.pos.y);
	}
	
	function checkCreature(t) {
		if (t.hp<=0) {
			t.dead=true;
			removeCreature(t);
			//addcorpse or drop items
			if (t.player) {
				if (!t.lasthitcreature.npc) {
					if (t==t.lasthitcreature) {
						broadcast("statusmessage", {text:"* " + id_names[t.peerid].name + " killed himself.", which: GAMEONLY});
					} else {
						broadcast("statusmessage", {text:"* " + id_names[t.lasthitcreature.peerid].name + " has killed " + id_names[t.peerid].name, which:GAMEONLY});
					}
					//broadcast("haskilled", {killer:t.lasthitcreature.peerid, killed: t.peerid});
				} else if (t.lasthitcreature.npc && !t.lasthitcreature.summoner)	//only players summon creatures for now //uniquely named npcs (like traders and such) won't attack or be killable
					broadcast("statusmessage", {text:"* " + id_names[t.peerid].name + " was killed by a " + t.lasthitcreature.nick.toLowerCase(), which:GAMEONLY});
				else { //was killed by [player]'s [summon]
					;
				} //else, was killed by a player's summon's summon, was kiled by a monster's summon, etc , also, change the frags to check summons?
				fragsH[t.peerid].deaths++;
				if (t.lasthitcreature != t && !t.lasthitcreature.npc && (modes[room_game_options.mode_selected].config.free_for_all || t.lasthitcreature.team != t.team))	//not a 'Team' mode, or different teams
					fragsH[t.lasthitcreature.peerid].kills++;
				var tile = getTileH(t.pos.x,t.pos.y);
				if (!tile) return;
				//dropItems(t,tile);	//could be moved to onPlayerDeath? // not for now
                                dropItems2(t,tile);
				csocketemit(t,{type:"emptyInventory"});
				modes[room_game_options.mode_selected].onPlayerDeath(t, scoreH);
			}
			updateNicks();	//he died, nick disappears
		}
		t.hp = clamp(t.hp, 0, t.maxhp);
		//!t.dead && refreshimgworld(t.pos.x,t.pos.y);
	}
	
	function setRespawnInterval(c) {
		var count = 5;
		var f = function () { if (count>0) csocketemit(c, 'countdown', {value:count,color:'red'}); 
								else { 
									csocketemit(c, 'clearCountdown', {});
									
									var v = totalCreate(c.peerid, c.team);
									if (v)
										makePlayerInvincible(v);
									return;
								}
								count-=1;
								//setTimeout(f, 1000);
								addschedule(f,2);
							};
		addschedule(f,0);
	}
	
	var invinc_to = {};
	invinc_to[redplayer] = redplayer_aura; invinc_to[redplayer_aura] = redplayer;
	invinc_to[blueplayer] = blueplayer_aura; invinc_to[blueplayer_aura] = blueplayer;
	invinc_to[greenplayer] = greenplayer_aura; invinc_to[greenplayer_aura] = greenplayer;
	
	
	function makePlayerInvincible(c){
		c.invincible = true;
		c.imgid = invinc_to[c.imgid]; 
		refreshimgworld(c.pos.x,c.pos.y,!c.host && c.conn.peer);
		csocketemit(c, 'wearoffinvincible', {player_imgid:c.imgid});
		addschedule(function () { 
			c.invincible = false; 
			c.imgid = invinc_to[c.imgid]; 
			refreshimgworld(c.pos.x,c.pos.y,!c.host && c.conn.peer);
			csocketemit(c, 'wearoffinvincible', {player_imgid:c.imgid});
		}, 6);
	}
	
    function removeCreature(c) {
		if (creaturesH[c.id]){
			delete creaturesH[c.id];
			var fromtile = getTileH(c.pos.x,c.pos.y);
			if (c == topItem(fromtile)) {
				fromtile.pop();
				refreshimgworld(c.pos.x,c.pos.y);
			} else {
				console.log('removeCreature is weird');
			}
			c.removed = true;
		}
	}
	
	function R(n) { return Math.floor(Math.random()*n); }
	
	
	//updates and intervals

	var LAST_T = 0;
	var ACCUM_COUNT = 0;

	function update(){
		var T = getTime();
		var DT = T - LAST_T;
		ACCUM_COUNT += DT;
		if (ACCUM_COUNT >= 500){
			ACCUM_COUNT -= 500;
			updateCount();
		}
		for (var x in creaturesH){
			var c = creaturesH[x];
			if (c.npc && c.behavior){
				c.accum += DT;
				if (c.accum >= c.exhaust){
					c.accum -= c.exhaust;
					c.behavior(c, creaturesH, DT);
				}
			}
		}
		//update_S()
		LAST_T = T;
	}
	
	function update_S(){
		updateSendChanges();
		updateSendEffects();
		updatePositions();
	}
	
	function updateSendChanges(){
		if (changes.length>0){
			//conns.forEach(function (conn2) { conn2.send({type:'changes',changes:changes,nicks:Nicks}) });	//even non-players can watch	//called in moveCreature, so update nicks
			//csocketemit({host:true}, 'nicks', {nicks:Nicks});
			broadcast('changes', {changes: changes, nicks: NicksH});
			changes = [];
		}
	}
	
	function updateSendEffects(){	//send effects here
		if (magiceffectsH.length>0 || damageeffectsH.length>0 || distanceeffectsH.length>0){
			broadcast('effects', {magiceffects:magiceffectsH,damageeffects:damageeffectsH,distanceeffects:distanceeffectsH});
			magiceffectsH = [];
			damageeffectsH = [];
			distanceeffectsH = [];
		}
	}
	
	function updatePositions(){	//the spectators need to follow the combatants
		positions = creaturesH.map(function (c) { return c.pos; }).filter(function (x) {return x;});		//positions might be null
		refreshNicks()	//sending nicks in same message for specs so no hiccups
		
		for (var i in spectators){	//send positions only to specs, so they can follow them
			clients[spectators[i].id] && clients[spectators[i].id].conn && clients[spectators[i].id].conn.send({type:"positions", positions:positions, nicks:NicksH});
		}
		for (var i in red_team){
			if (clients[red_team[i].id] && clients[red_team[i].id].player && clients[red_team[i].id].player.dead){	//the dead are speccing
				clients[red_team[i].id].conn && clients[red_team[i].id].conn.send({type:"positions", positions:positions, nicks:NicksH});
			}
		}
		for (var i in blue_team){
			if (clients[blue_team[i].id] && clients[blue_team[i].id].player && clients[blue_team[i].id].player.dead){ //^
				clients[blue_team[i].id].conn && clients[blue_team[i].id].conn.send({type:"positions", positions:positions, nicks:NicksH});
			}
		}
		updateNicks();	//redundancy for specs
	}
	
	function refreshNicks(){	//whenever HP or Pos are changed
		//the invisibles' nick and life bar cannot be seen
		NicksH = creaturesH.map(function (c) { return c.invisible ? {invisible: true} : {pos:c.pos, hp:(c.hp/c.maxhp), nick:c.nick, team:c.team, peerid:c.peerid}; });//.filter(identity);
		//Nicks = {};
		//Nicks_forEach(function (n) { Nicks[n.peerid
	}
	
	function updateNicks(){
		refreshNicks();
		broadcast('nicks', {nicks:NicksH,frags:fragsH});
	}
	
	function updateCount() {
		count=count+1;
		var k;
		for (k in decays) {
			var dec = decays[k];
			if (dec) {
				if (dec.count <= count) {
					delete decays[k];
					var tile = getTileH(dec.pos.x,dec.pos.y);
					for (var i in tile) {
						var item = tile[i];
						if (itemimgid(item) == dec.imgid) {
							tile.splice(i,1);
							break;
						}
					}
					refreshimgworld(dec.pos.x,dec.pos.y);
				}
			}
		}
		for (k in schedule) {
			var sch = schedule[k];
			if (sch) {
				if (sch.count <= count) {
					delete schedule[k];
					sch.func();
				}
			}
		}
		update_S();
		if (!(count%4)){	//every 2 seconds
			invis_pass = genPredId(20);
			broadcast("invis_pass", {invis_pass:invis_pass});
		}
		if (!timer_locked)
			timerH+=500;
		refreshTimer();
		if (!timer_locked)
			detectWin();
		refreshScore();
	}
	
	function refreshTimer(){
		var temp = timerH;
		var milliseconds = temp%1000; temp = (temp-milliseconds)/1000;
		var seconds = temp%60;	temp = (temp-seconds)/60;	if(seconds<10) seconds='0'+seconds;
		var minutes = temp%60; temp = (temp-minutes)/60;	if(minutes<10) minutes='0'+minutes;
		var hours = temp;
		broadcast('timer', {timer:minutes+':'+seconds});
	}
	
	function updateMonsterBehavior(){
		for (var x in creaturesH){
			if (behaviors[creaturesH[x].imgid])
				;//behaviors[creaturesH[x].imgid](creaturesH[x]);
		}
	}
	
	
	//create/control match
	function totalRemove(id,team){ //move to spec or leave
		var client = clients[id];
		var c = client.player;
		var t_team = team == 1 ? reds : team == 2 ? blues : greens;
		t_team.splice(t_team.indexOf(c),1);
		removeCreature(c);
		client.player=false;
		client.playing=false;
		client.team = 0;
		//delete fragsH[id];
		csocketemit(c,'restartVars',{});
		magiceffectsH.push({id:poff,pos:c.pos});
		update_S();
	}

	function totalCreate(id, team){
		var client = clients[id];
		if (!client){
			console.log("Deslogou antes de criar");	
			return;	
		}
		if (room_game_options.mode_selected == FREE_FOR_ALL) 
			team = 3;
		var c = createCreature(team==1 ? spawnRed() : (team==2 ? spawnBlue() : spawnRandom()), playershp, team==1 ? redplayer : team==2 ? blueplayer : greenplayer);
		var TRIES = 100;
		while (!c && TRIES>0) { 
			c = createCreature(team==1 ? spawnRed() : (team==2 ? spawnBlue() : spawnRandom()), playershp, team==1 ? redplayer : team==2 ? blueplayer : greenplayer);
			TRIES-=1;
		}
		if(!c){
			console.log("Failed to create player, id "+id); 
			return;
		}
		team==1 ? reds.push(c) : team==2 ? blues.push(c) : greens.push(c);	//greens, or neutrals
		c.player = true;
		c.team = team;
		client.team = team;
		c.peerid = id;
		c.nick = id_names[c.peerid].name; refreshimgworld(c.pos.x,c.pos.y);
		c.client = client;
		c.inventory = newInventory();
		if (id != hostid){
			c.conn = client.conn;
			c.conn.send({type:"pos",pos:c.pos,start:true});
			//c.conn.send({type:"world", world:imagegrid});
		} else {
			playerpos = c.pos;
			c.host = true;
		}
		csocketemit(c,'restartVars',{});

		//move below to somewhere else
		myAddToEq(c,3,1,LEFT);	//sword
		myAddToEq(c,41,1,TORSO); //leather armor
		myAddToEq(c,42,1,LEGS);	//leather legs
		myAddToEq(c,43,1,HEAD);	//leather helmet
		myAddToEq(c,44,1,BOOTS); //leather boots
		myAddToEq(c,5,10,AMMO);	//arrows
		
		myAddToInv(c,4);	//bow
		myAddToInv(c,5,10);	//arrow
		myAddToInv(c,5,10);	//arrow
		myAddToInv(c,6,10);	//fireball rune	//burst arrow
		myAddToInv(c,7,10);	//magic wall rune
		myAddToInv(c,7,10);	//magic wall rune
		myAddToInv(c,9,10);	//life potion
		myAddToInv(c,10,4);	//invis potion
		//myAddToInv(c,11,2);	//haste potion
		//myAddToInv(c,40,5);	//healing rune
		myAddToInv(c,46,10);	//poison field rune	//replace with poison arrow later, plus burst arrow
		//myAddToInv(c,46,10);	//poison field rune
		//
		
		client.player=c;
		client.playing=true;
		
		if (!fragsH[id])
			fragsH[id] = {kills:0, deaths:0, nick:c.nick, team:c.team};
		
		magiceffectsH.push({id:energy,pos:c.pos});
		update_S();
		return c;
	}
	
	if (!isnode){	//room.js' changeteam funcs need it
		window.totalRemove = totalRemove;
		window.totalCreate = totalCreate;
	} else if (isnode){
		global.totalRemove = totalRemove;
		global.totalCreate = totalCreate;
	}
	
	function inputToSpawn(str){
		var comma = str.indexOf(",");
		if (comma==-1) return false;
		var x = str.substring(0,comma)*1;
		var y = str.substring(comma+1)*1;
		if((!x && x!=0) && (!y && y!=0)) return false;
		return newpos(Math.floor(x),Math.floor(y));
	}
	
	var csl = console.log;
	
	function spawnRed(){
		var i = Math.floor(Math.sqrt(2*red_team.length));
		return newpos(redspawn.x-i+R(2*i+1),redspawn.y-i+R(2*i+1));
	}

	function spawnBlue(){
		var i = Math.floor(Math.sqrt(2*blue_team.length));
		return newpos(bluespawn.x-i+R(2*i+1),bluespawn.y-i+R(2*i+1));
	}
	
	function spawnRandom(){
		return newpos(R(WwidthH),R(WheightH));
	}
	
	
	var result = ["DRAW", "RED SCORES", "BLUE SCORES"];
	var resultst = ["* Draw!", "* Red Scores!", "* Blue Scores!"];
	var resultend = ["DRAW", "RED WINS", "BLUE WINS"];
	var resultendst = ["* Draw!", "* Red Wins!", "* Blue Wins!"];
	var resultc = ['white', 'red', 'blue'];
	
	function detectWin(){
		modes[room_game_options.mode_selected].detectWin(creaturesH, fragsH, scoreH, [false, reds, blues, greens]);
	}
	
	function refreshScore(){
		broadcast('score', {score:{red:scoreH[RED],blue:scoreH[BLUE]}});
	}
	
	function setStartInterval(){
		var count = 3;
		var f = function () { 
					if (count==0){
						broadcast('countdown',{value:'Start!',color:'white'});
						broadcast('unlocked'); timer_locked = false;
						addschedule(function(){broadcast('clearCountdown');},2);
						return;
					}
					broadcast('countdown',{value:count,color:'white'});
					count-=1;
					addschedule(f,2);
				};
		f();
	};
	
	function newRound(resetFrags) { //when it's not the first //called in detectWin
		//cancel intervals
		//clearInterval(interval_send);
		//clearInterval(interval_count);
		
		//destroy the world
		//destroytheworld()
		creaturesH = [];
		reds = [];
		blues = [];
		greens = [];
		
		count = 0;
		decaycount = 0;
		schedulecount = 0;
		decays = [];
		schedule = [];
		
		grid = modes[room_game_options.mode_selected].map()(WwidthH, WheightH);	//different treatment for different types e.g. generators, hard data, etc
		modes[room_game_options.mode_selected].onStartup(grid);
		imagegrid = grid.map(function (ys) { return ys.map(function (tile) { return makeimagetile(tile); })});


		broadcast("restartVars", {});
		
		if (resetFrags) fragsH = {};
		
		for (var peerid in clients){
			var client = clients[peerid];
			var _team = id_names[peerid].team;
			if (_team && mode_selected == FREE_FOR_ALL) _team = 3;
			if (_team){
				totalCreate(peerid, _team);
			} else {
				client.player = false;
				client.playing = false;
			}
			//if (peerid != hostid){
				//client.conn.send({type:"world", world:imagegrid});
			//} 
			if (resetFrags){
				fragsH[peerid] = {kills:0,deaths:0, nick:id_names[peerid].name, team:_team};
			}
		}
		updateNicks();	//fragsH come with
		//detect_in_between = false;	//not in-between anymore, free to detect
		
		//world = imagegrid; //so the host can play
		//interval_send = setInterval(updatePositions, 50);
		//interval_count = setInterval(updateCount, 500);
		broadcast('world', {world:imagegrid});	//this one sets world=imagegrid || but world should be a separate thing for invisible
		broadcast('locked'); timer_locked = true;

		setStartInterval();	
	}
	
	
	function destroytheworld(){
		WwidthH = WheightH = 10;
		creaturesH = [];
		imagegrid = false;
		grid = false;
		changes = [];
		interval_send = false;
		magiceffectsH=[];
		distanceeffectsH=[];
		damageeffectsH=[];
		interval_count = false;
		count = 0;
		decaycount = 0;
		schedulecount = 0;
		decays = [];
		schedule = [];
		reds = [];
		blues = [];
		greens = [];
	}
	
	function stopgame(){
		console.log("stopgame called");
		broadcast('blinkingtimer', {value: false})
		
		//cancel intervals
		clearInterval(interval_update);
		
		//destroy the world, 
		destroytheworld();
		
		//broadcast that the game was stopped
		broadcast("gamestopped", {});
		
		gamestarted = false;
		finalscreen = false;
		shouldDetectWin = true;
	
		broadcast("restartVars", {});
		
		if (!isnode && drawingGame)
			hideCanvas();

		if (isnode){
			broadcast('statusmessage', {text:"* New game starting in 5 seconds...", which:false});	//both game and chat
			setTimeout(function(){ window.startgame(global.app_game_options); }, 5000);
		}
	}
	
	
/// maps


	TEAM_VERSUS = 0;
	TEAM_DEATHMATCH = 1;
	FREE_FOR_ALL = 2;

	var mode_selected;
	var size_selected;
	var map_selected;
	var timelimit;
	var scorelimit;

	var room_game_options;

	var map_sizes = [{x:25,y:15},{x:50,y:30},{x:100,y:60}];
	
	function find_spawn(w,h){
		var xr,yr,xb,yb;
		if(w>h){
			xr=Math.floor(0.1*w);
			xb=w-xr;
			yr=Math.floor(h/2);
			yb=Math.floor(h/2);
		} else {
			xr=Math.floor(w/2);
			xb=Math.floor(w/2);
			yr=Math.floor(0.1*h);
			yb=h-yr;
		}
		return {xr:xr,yr:yr,xb:xb,yb:yb};
	}
	
	//now the final setup
	window.startgame = function (options){
		if (gamestarted) { 
			return stopgame();
		}
		if (!options)
			options = {};

		options.mode_selected = options.mode_selected || 0;	//team versus
		options.size_selected = options.size_selected || 0;	//small
		options.map_selected = options.map_selected || 0;	//forest
		options.timelimit = options.timelimit || 5;			//minutes
		options.scorelimit = false;

		modes[options.mode_selected].start_config(options);
		
		//room
		WwidthH = map_sizes[options.size_selected].x;
		WheightH = map_sizes[options.size_selected].y;
		friendlyfire = false;	//true;
		playershp = 40;
		var s = find_spawn(WwidthH, WheightH);
		redspawn = {x:s.xr, y:s.yr};
		bluespawn = {x:s.xb, y:s.yb};
		damagemultiplier = 1.0;
		scoreH = [0, 0, 0];
		refreshScore();
		timerH = 0;
		refreshTimer();

		if (!options.scorelimit)
			options.scorelimit = (options.mode_selected == TEAM_VERSUS && 1) || (options.mode_selected == TEAM_DEATHMATCH && 10) || (options.mode_selected == FREE_FOR_ALL && 10);
		
		if (!inworldH(redspawn) || !inworldH(bluespawn)) {
			alert("Spawn not in map");
			return;
		}
		
		room_game_options = options;
		
		showCanvas();
		
		scoreH[RED]=0;
		scoreH[BLUE]=0;
		newRound(true);
		gamestarted=true;
		LAST_T = getTime();
		interval_update = setInterval(update, 0);
		
		systemmessages = [];
			
		broadcast('statusmessage', {text:"* Match Started! "+"("+modes[options.mode_selected].name+")", which:false});
		
		for (var i in clients){
			var client = clients[i];
			if (!client.playing){
				//csocketemit(client,'statusmessage',{text:"* You are spectating. Press TAB to switch who you're following. Press F for free-roaming.", which:GAMEONLY});
				//client.conn.send({type:'statusmessage', text:"* You are spectating. Press TAB to switch who you're following. Press F for free-roaming.", which:GAMEONLY});
			}
		}

	}
//} //close setuphost

if (isnode){
	require("./util/util.js");
	require("./content/content_modes");

	function getTime(){
		return new Date().getTime();
	}
	
	function getTimeStamp(conn){
		my_stamps[conn.peer] = my_stamps[conn.peer] || {};
		var id = genPredId();
		my_stamps[conn.peer][id] = {me:getTime()};
		conn.send({type:"getTimeStamps", id:id});
	}
	
	function syncToPeer(conn){	//sync the browsers' clocks
		conn.stamps = [];
		getTimeStamp(conn);
	}
	
	function selectedToTeam(conn, team){	//red=1, blue=2
		var i = id_names[conn.peer];
		if (!i)	{	console.log("Deslogou antes de criar"); return; }
		var lastteam = i.team;
		i.team=team;
		conns.forEach(function(conn2){conn2.send({type:'team',id:i.id,team:i.team,ffa:true})});
		updateNames();
		if (gamestarted){
			//appendText("* "+i.name+" was moved to Red");
			if (lastteam==2){
				//removeCreature
				totalRemove(i.id,lastteam);
			} else if (lastteam==0){
				//systemmessages = [];
				//systemmessages.push(["[ESC:toggle game/; T:chat]",'']);
			}
			//createCreature
			totalCreate(i.id,i.team);
		}
	}

	function selectedToRed(conn){
		return selectedToTeam(conn, 1);
	}

	function selectedToBlue(conn){
		return selectedToTeam(conn, 2);
	}
	
	//exports.setuphost = setuphost;
	exports.onconnection = function (conn){
						conn.send = function (data) {
							conn.emit('data', data);
						}
						conn.close = conn.disconnect;
						//console.log('conn.peer',conn.peer);
						conns.push(conn);
						//setTimeout(function () { selectedToRed(conn); }, 1000);
						var client = {conn:conn,peerid:0/*conn.peer*/,playing:false};	//clients[conn.peer] = 
						conn.on('data', function(data){
							if (client.notinroom) return;
							if (gamestarted && client.playing){
								for (var i=0;i<peercallbacksgame.length;i+=1){
									var d=peercallbacksgame[i];
									if (data.type==d.type){
										d.callback(conn,data);
										return;
									}
								}
							}
							//chat and things
							for (var i=0;i<peercallbacksother.length;i+=1){
								var d=peercallbacksother[i];
								if (data.type==d.type){
									d.callback(conn,data);
									return;
								}
							}
							if (data=="leaving"){
								console.log('hostapp leaving');
								data = {id:conn.peer};
								appendText("* "+id_names[data.id].name+" has left the room");
								var i=id_names[data.id];
								delete id_names[data.id];
								client.notinroom = true;
								if (gamestarted && client.playing){
									totalRemove(i.id,i.team);
								}
								delete clients[data.id];
								conn.close();
								updateNames();
								broadcast("leave", data);
							} else if (data.type=="name"){
								if (data.name.length==0){
									data.name = "defaultname";
								} else if(data.name.length>20){
									data.name = data.name.substring(0,20);
								}
								conn.peer = data.id;
								id_names[conn.peer]={id:conn.peer,name:data.name,team:0};
								clients[conn.peer] = client;
								client.peerid = conn.peer;
								//data.id = conn.peer;
								data.team = 0;
								syncToPeer(conn);
								//broadcast
								conns.forEach(function(conn2) { if(conn2!=conn) conn2.send(data); });
								conn.send({type:'names',names:id_names});
								updateNames();
								if (gamestarted){
									conn.send({type:"world", world:imagegrid});
								}
								appendText("* "+data.name+" has joined the room");
								sendallinputs(conn);
								alerter();
							} else if (data.type=="chat"){
								if (data.message.length > MSGLENLIMIT) data.message = data.message.substring(0,MSGLENLIMIT);
								data.id = conn.peer;
								var nome = id_names[data.id] ? id_names[data.id].name : "no_name_error";
								if(gamestarted){
									if (mode_selected == FREE_FOR_ALL)
										data.team = 3;
								}
								//appendText(data.message, nome);
								broadcast('chat', data, conn);
							}
					    });
						conn.on('disconnect', function (reason) {	//only for sockets
							console.log('conn hostapp disconnect');
							data = {id:conn.peer};
							if (id_names[data.id]){
								appendText("* "+id_names[data.id].name+" has left the room");
								var i=id_names[data.id];
								delete id_names[data.id];
								client.notinroom = true;
								if (gamestarted && client.playing){
									totalRemove(i.id,i.team);
								}
								delete clients[data.id];
								//conn.close();
								updateNames();
								broadcast("leave", data);
							}
						});
	};
	exports.ondisconnect = function (conn){
							console.log('hostapp disconnect');
							data = {id:conn.peer};
							if (id_names[data.id]){
								appendText("* "+id_names[data.id].name+" has left the room");
								var i=id_names[data.id];
								delete id_names[data.id];
								client.notinroom = true;
								if (gamestarted && client.playing){
									totalRemove(i.id,i.team);
								}
								delete clients[data.id];
								conn.close();
								updateNames();
								broadcast("leave", data);
							}
	};

	// for modes
	global.setRespawnInterval = setRespawnInterval;		
	global.broadcast = broadcast;
	global.addschedule = addschedule;
	global.stopgame = stopgame;	//make this into something else? ...
	global.refreshScore = refreshScore;

	//for npcs
	global.moveByDir = moveByDir;
	global.isblocking = isblocking;
	global.inworldH = inworldH;
	global.getTileH = getTileH;
	global.getField = getField;
	//global.spells = spells;

	//shit. imagine what I'll have to do for spells ...

	//doing these things manually case by case is the only way that can be helped. 
	//place it in a util_game ?

}
