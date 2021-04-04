	//TileBattle
	
	//FILEMAP
	// * Variable declarations
	// * Cookies
	// * World and changes
	// * Inventory functions
	// * Hotkeys
	// * Drawing
	// * Util for drawing
	// * Host callbacks
	// * itemtypes
	// * Movement
	// * Key events
	// * Mouse events
	// * Some util
	// * window.onbeforeunload
	// * window.onload //load imglist, setup peer, socket.io callbacks, and others
	
	
	
	//Messages/callbacks:
	//hoston
	//peeron
	//socketemit
	//csocketemit
	//predicton
	//predict
	
	
	
	
	// Variable declarations

	name_ = false;		//"name" is reserved in chrome
	
	var equiptable = [[],[],[]];
	equiptable[0][1]=LEFT;
	equiptable[1][0]=HEAD;
	equiptable[1][1]=TORSO;
	equiptable[1][2]=LEGS;
	equiptable[1][3]=BOOTS;
	equiptable[2][1]=RIGHT;
	equiptable[2][2]=AMMO;
	
	
	// Peer things
	
	id_names = {};
	peer=false;
	myid = 0;
	hostid = -1;
	imhost = false;
	hostleft = false;
	conn=0;
	conns = [];
	gamestarted=false;
	roomname = QueryString["room"]; //(!isHeroku && !isLocalhost) ? QueryString["room"] : QueryString["id"];	//basically /room?id= versus /play.html?room= >> should make both '?room=' for less headache
	document.title = roomname + ' - TileBattle';
	clients = {};
	
	specting = true;
	systemmessages = []
	newmessages = [];
	Nicks = [];
	frags = {};	
	countdown = false;
	countdown_color = 'white';
	locked = false;
	score = false;
	timer = "00:00";
	blinkingtimer = false;
	sync_d = false;
	  
	  
	// Game vars
	
	hotkeys = [];	//0 to 9
	world = false;
	Wwidth = 0;
	Wheight = 0;
	distanceeffects = [];
	magiceffects = [];
	damageeffects = [];
	talkeffects = [];

	speed = 1;
	WALK_DELAY = 200;
	WALK_DIAGONAL = WALK_DELAY * 1.4;
	USE_DELAY = 300;
	CAST_EXHAUST = 400;
	walkstart = 0;
	team = 0;
	playerpos = {x:20,y:20,default:true};
	hp = 100;		
	maxhp = 100;
	invisible = false;
	invis_pass = "nothing";
	invis_hashes = {nothing:{}};		//e.g. invis_hashes[invis_pass][hash] = true;
	positions = [];
	positions_index = -1;

	talking_string = "";
	talking = false;
	status_message = "";
	  
	  
	// Cookies
	
	name_ = getCookie("name") || "defaultname";
	if (name_){
		if (name_.length>20) name_ = name_.substring(0,20);
		//document.cookie = "name="+name_+"; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";
		setCookie("name", name_);
	}

	function loadHotkeysFromCookies(){
		for (var i=0;i<=9;i+=1){
			hotkeys[i] = false; 	//getCookie(i)*1;
		}
		hotkeys[1] = 9;	// 9 3 4 5 7
		hotkeys[2] = 3;
		hotkeys[3] = 4;
		hotkeys[4] = 5;
		hotkeys[5] = 7;
	}

	
	// World and changes
		
	function worldReceived(msg){
		world = msg.world;
		Wwidth = world.length;
		Wheight = world[0] ? world[0].length : 0;
		console.log('worldReceived', world.length,  world[0] ? world[0].length : 0);
		if (!imhost){
			gamestarted=true;
			if (drawingRoom)
				showCanvas();
		}
	}
	  
	function changesReceived(msg){
		if (!world) return;
		var changes = msg.changes;
		for (var k=0;k<changes.length;k+=1){
			var change = changes[k];
			console.log('1', change);
			if ((change.predId && (change.predId == myid || (!imhost && predictions[change.predId])))) {
				continue;
			}
			console.log('2', change);
			if (changes.correction)
				console.log(change);
			var last = world[change.x][change.y];
			//var mytile = world[playerpos.x][playerpos.y];
			if (topItem(last).creature && topItem(change.imgtile).creature && topItem(last).id == topItem(change.imgtile).id){
				topItem(change.imgtile).walking = topItem(last).walking;
				topItem(change.imgtile).walkstart = topItem(last).walkstart;
			}
			if (!changes.correction && !topItem(change.imgtile).creature && change.x==playerpos.x && change.y==playerpos.y && hp>0){
				//ad hoc glitch fix
				change.imgtile.push(topItem(last));
				world[change.x][change.y]=change.imgtile;
			} else if (!changes.correction && !(playerpos.default || hp<=0) && topItem(change.imgtile).creature && topItem(change.imgtile).id == topItem(world[playerpos.x][playerpos.y]).id && (change.x!=playerpos.x || change.y!=playerpos.y)){
				//ad hoc glitch fix 2
				change.imgtile.pop();
				world[change.x][change.y]=change.imgtile;
			} else {
				world[change.x][change.y]=change.imgtile;
			}
		}
	}
	
	
	// Inventory functions
	  
	function getFirstClearInvSpot(){
		for (var y=0;y<3;y++){
			for (var x=0;x<8;x++){
				if (!inventory.items[x][y]){
					return {x:x,y:y};
				}
			}
		}
	}
	
	function getFirstUnempty(id){
		//if (!itemtypes[id].stackable) return getFirstClearInvSpot();
		for (var y=0;y<3;y++){
			for (var x=0;x<8;x++){
				if (!inventory.items[x][y]){
					return {x:x,y:y};
				} else if (inventory.items[x][y].imgid == id && inventory.items[x][y].count<10){
					return {x:x,y:y,count:inventory.items[x][y].count};
				}
			}
		}
	}
	  
	function addToInv(msg){
		var item = msg.item;	//an item is just a count and an imgid
		if (!itemtypes[item.imgid].stackable){
			var invpos = getFirstClearInvSpot();
			if (invpos){
				inventory.items[invpos.x][invpos.y]=item;
			}
			return;
		}
		while (item.count > 0){
			var pos = getFirstUnempty(item.imgid);
			pos.count = pos.count || 0;
			var s = pos.count+item.count;
			if (s>10){
				inventory.items[pos.x][pos.y] = {imgid:item.imgid,count:10};
				item.count = s-10;
			} else {
				inventory.items[pos.x][pos.y] = {imgid:item.imgid,count:s};
				item.count = 0;
			}
		}
	}
	  
	function addToEq(msg){
		var item = msg.item;
		var index = msg.index;
		if (!inventory.equips[index]){
			inventory.equips[index] = item;
		}
	}
		
	function removeFromInv(msg){	
		if (inventory.items[msg.x][msg.y].imgid==msg.id){
			if (inventory.items[msg.x][msg.y].count > 1){
				inventory.items[msg.x][msg.y].count -= 1;
			} else {
				inventory.items[msg.x][msg.y]=false;
			}
		}
	}
	
	function removeFromEq(msg){	
		if (inventory.equips[msg.index].count > 1){
			inventory.equips[msg.index].count -= 1;
		} else {
			inventory.equips[msg.index]=false;
		}
	}
		
	
	// Hotkeys
		
	function doHotkey(id,coor){
		var tx,ty;
		var bbreak=false;
		for (var x=0;x<8;x++){
			for (var y=0;y<3;y++){
				if (inventory.items[x][y]){
					if (inventory.items[x][y].imgid==id){
						tx=x;
						ty=y;
						bbreak=true;
						break;
					}
				}
			}
			if(bbreak) break;
		}
		if (coor){
			tx = coor.x;
			ty = coor.y;
		}
		var swap = false;
		var eq;
		if ((tx || tx==0) && (ty || ty==0)){
			var type = typelist[id];
			if (type == "item"){
				dragfromx=tx; dragfromy=ty; dragfrom="inv";
				processClick();
			} else if (type == "weapon"){
				eq = LEFT;
				swap = true;
			} else if (type == "ammo"){
				eq = AMMO;
				swap = true;
			} else if (type == "torso"){
				eq = TORSO;
				swap = true;
			} else if (type == "legs"){
				eq = LEGS;
				swap = true;
			} else if (type == "head"){
				eq = HEAD;
				swap = true;
			} else if (type == "boots"){
				eq = BOOTS;
				swap = true;
			}
			if (swap){
				if (inventory.equips[eq]){
					if (inventory.equips[eq].imgid == id && (!itemtypes[id].stackable || inventory.equips[eq].count == 10))
						return;
				}
				dragfrom="inv"; dragfromx=tx; dragfromy=ty;
				dragto="eq"; dragtox=eq;
				processDrag();
			}
		}
	}
	
	
	// Drawing
	
	function drawItemid(imgid,x,y,mouse){
		var coor = imglist[imgid];
		if (imglist[imgid].length>0){
			var eff = itemtypes[imgid].animationdelay || 1000;
			var i = Math.floor((TIME%(imglist[imgid].length*eff))/eff);
			coor = imglist[imgid][i];
		}
		ctx.drawImage(coor.tileset, coor.x, coor.y, 32, 32, x, y, 32, 32);
		if (mouse)
			console.log(imgid, coor.x, coor.y, x, y);
	}
	
	function drawImage(elem,x,y){
		if (elem.coor){
			ctx.drawImage(elem.tileset, elem.x, elem.y, elem.width, elem.height, x, y, elem.width, elem.height);
		} else 
			ctx.drawImage(elem, x, y);
	}
	
	function _offset(){
		TIME = getTime();
		if (!inworld(playerpos)) return {x:0,y:0};
		var me = topItem(world[playerpos.x][playerpos.y]);
		var OFFSET = {x:0,y:0};
		if (me.walking){
			if (!me.walkstart)
				me.walkstart = TIME;
			T = (TIME-me.walkstart)/(me.dir < 4 ? WALK_DELAY : WALK_DIAGONAL);
			me.t = T;
			OFFSET = {x:Math.floor((lerp(me.frompos.x,me.pos.x,T)-playerpos.x)*32),y:Math.floor((lerp(me.frompos.y,me.pos.y,T)-playerpos.y)*32),T:T};
		}
		return OFFSET;
	}
	
	function drawWorld(){
		if (!world || !gamestarted) return;
		var me;
		if (inworld(playerpos))
			me = topItem(world[playerpos.x][playerpos.y]);
		var creatures = [];
		for (var x=-10;x<=10;x++){
			var tx = playerpos.x+x;
			for (var y=-10;y<=10;y++){
				var ty = playerpos.y+y;
				var tile = !world[tx] ? false : world[tx][ty];
				if(!tile) {
					ctx.fillStyle="#000000"; 
					ctx.fillRect((x+9)*32-OFFSET.x,(y+9)*32-OFFSET.y,32,32);
					tile = [];//[48];	//void
				}
				for (var k=0;k<tile.length;k+=1){
					if (!tile[k].creature) {
						var imgid = tile[k];
						if (imglist[imgid].length && itemtypes[imgid].x_repeat && itemtypes[imgid].y_repeat) {
							var x_repeat =  itemtypes[imgid].x_repeat;
							var y_repeat =  itemtypes[imgid].y_repeat;
							var idx = mod(ty,y_repeat)*x_repeat + mod(tx,x_repeat);		//(ty%y_repeat)*x_repeat + (tx%x_repeat);
							drawImage(imglist[imgid][idx],(x+9)*32-OFFSET.x,(y+9)*32-OFFSET.y);
						} else {
							drawItemid(imgid,(x+9)*32-OFFSET.x,(y+9)*32-OFFSET.y);
						}
					} else {
						//drawItemid(tile[k].imgid,(x+9)*32,(y+9)*32);
						creatures.push(tile[k]);
					}
				}
			}
		}
		//creatures are drawn later because they might be walking
		for (var i in creatures){
			var c = creatures[i];
			if (!c.walking) {
				drawItemid(c.imgid,(c.pos.x-playerpos.x+9)*32-OFFSET.x,(c.pos.y-playerpos.y+9)*32-OFFSET.y);
				c.frompos = c.pos;
				c.t = 0;
			} else {
				//console.log(c.walking,c.dir,c.pos,c.frompos,c.t,c.walk_delay,c.walkstart);
				if (!c.walkstart)
					c.walkstart = getTime();
				c.t = (TIME-c.walkstart)/(c.dir < 4 ? c.walk_delay : c.walk_delay * 1.4 );	// WALK_DELAY : WALK_DIAGONAL);
				if (c.t>=1){
					c.walking = false;
					c.walkstart = 0;
					c.t=1;
				}
				drawItemid(c.imgid,Math.floor((lerp(c.frompos.x,c.pos.x,c.t)-playerpos.x+9)*32)-OFFSET.x,Math.floor((lerp(c.frompos.y,c.pos.y,c.t)-playerpos.y+9)*32)-OFFSET.y);
			}
		}
		for (var i in creatures){
			var c = creatures[i];
			drawNickAtPos(c);
			if (c==me)
				drawLifeBarAtPos(c, hp/maxhp);	//master of ad hoc, catches invisible Nicks {invisible:true}
			else
				drawLifeBarAtPos(c, Nicks[c.id] && Nicks[c.id].hp);	//, c==me ? {x:0,y:0});
		}
	}
	  
	function drawHP(){
		ctx.fillStyle="#640000";
		ctx.fillRect(608+128,32*3-16+8,96,8);
		ctx.fillStyle="#FF0000";
		ctx.fillRect(608+128,32*3-16+8,Math.max(0,hp/maxhp*96),8);
	}
	  
	function drawInventory(){
		drawImage(invimg,608,0);
		ctx.fillStyle = "#000000"; ctx.font = "bold 12px Tahoma";
		
		for (var x=0;x<8;x++)
		for (var y=0;y<3;y++){
			var item = inventory.items[x][y];		//supposed to be {count:,imgid:}, might be false/undefined
			if (item){
				//ctx.drawImage(imglist[item.imgid],608+x*32,224+y*32);
				drawItemid(item.imgid,608+x*32,224+y*32);
				if (itemtypes[item.imgid].stackable){	//(stackablelist[item.imgid]){
				  drawImage(numberlist[item.count],608+x*32,224+y*32);	//how many you've got
				}
			}
		}
		for (var x=0;x<3;x++)
		for (var y=0;y<4;y++){
			var item = inventory.equips[equiptable[x][y]];
			if (item){
				//ctx.drawImage(imglist[item.imgid],608+x*32,64+y*32);
				drawItemid(item.imgid,608+x*32,64+y*32);
				if (itemtypes[item.imgid].stackable){	//stackablelist[item.imgid]){
				  drawImage(numberlist[item.count],608+x*32,64+y*32);	//how many you've got
				}
			} else if (emptyeqimgs[x][y]){
				drawImage(emptyeqimgs[x][y],608+x*32,64+y*32);
			}
		}
		
		ctx.fillStyle = "#404040"; //"rgba(63, 63, 63, 1.0)"; //"#000000";
		ctx.font = "32px Arial";
		
		for (var x=0;x<=9;x++){//hotkeys
			var hk = hotkeys[x];
			var xx = x;
			var yy = 0;
			if (xx==0){xx=10;}
			if (xx>5) {yy=1; xx-=5;}
			var x_ = 608+96+(xx-1)*32;
			var y_ = yy*32;
			
			ctx.textAlign = "center";
			//ctx.fillText(x,x_+16,y_+12+10);	//16px
			ctx.fillText(x,x_+16,y_+23+5);	//32px
			//ctx.fillText(x,x_+16,y_+25);	//24px
			ctx.textAlign = "start";
			if (hk){
				//drawImage(imglist[hk],x_,y_);
				drawItemid(hk,x_,y_);
			}
		}
		drawHP();
		if (hp<=0){
			//ctx.fillText("Dead.",608+160,(96-10)+15);
		}
		if (followthemouse > 0){
			//drawImage(imglist[followthemouse],mouseposx-16,mouseposy-16);
			//if (inv !map)	//remove followthemouse if the drag is from the map (because map dragging is a ping-dependant thing)
				drawItemid(followthemouse,Math.floor(mouseposx-16),Math.floor(mouseposy-16), true);
		} 
	}
	
	function drawEffects(){
		for (var k in distanceeffects){
			var eff = distanceeffects[k];
			if (eff){
				var t = (TIME-eff.start)/EFFECTD_MS;
				if (t>=1){
					delete distanceeffects[k];
					continue;
				}
				var frompos=worldtoscreen(eff.frompos);
				var drawpos = {x:(frompos.x+eff.vec.x*t)*32,y:(frompos.y+eff.vec.y*t)*32}
				if (Math.abs(drawpos.x)<608 && Math.abs(drawpos.y)<608){
					if (distanimationlist[eff.id].length){ //it is an array
						var dir = dirBetween(eff.frompos, eff.topos, distanimationlist[eff.id].length>4);
						drawImage(distanimationlist[eff.id][dir],drawpos.x-OFFSET.x,drawpos.y-OFFSET.y);
					} else
						drawImage(distanimationlist[eff.id],drawpos.x-OFFSET.x,drawpos.y-OFFSET.y);
				}
			}
		}
		for (var k in magiceffects){
			var eff = magiceffects[k];
			if (eff){
				var t = (TIME-eff.start)/EFFECTN_MS;
				if (t>=1){
					delete magiceffects[k];
					continue;
				}
				var pos=worldtoscreen(eff.pos);
				var image = magicanimationlist[eff.id];
				if (magicanimationlist[eff.id].length){ //it is an array
					var i = Math.floor(magicanimationlist[eff.id].length*t);
					image = magicanimationlist[eff.id][i];
				}
				if (eff.offset)
					drawImage(image,pos.x*32+eff.offset.x-OFFSET.x,pos.y*32+eff.offset.y-OFFSET.y);
				else
					drawImage(image,pos.x*32-OFFSET.x,pos.y*32-OFFSET.y);
			}
		}
		for (var k in damageeffects){	//it floats up
			var eff = damageeffects[k];
			if (eff){
				var t = (TIME-eff.start)/EFFECTN_MS;
				if (t>=1){
					delete damageeffects[k];
					continue;
				}
				var pos = worldtoscreen(eff.pos);
				var vec = {x:0,y:-1};
				var drawpos = {x:(pos.x+vec.x*t)*32+16,y:(pos.y+vec.y*t)*32}
				ctx.textAlign = "center";     
				ctx.font="14px Tahoma";
				ctx.fillStyle=eff.color;
				ctx.lineWidth = 2;
				ctx.strokeStyle = '#000000';
				ctx.strokeText(eff.text,drawpos.x-OFFSET.x,drawpos.y+16-2+14/2-OFFSET.y);
				ctx.lineWidth = 1;
				ctx.fillText(eff.text,drawpos.x-OFFSET.x,drawpos.y+16-2+14/2-OFFSET.y);
				ctx.textAlign = "start";
			}
		}
	}
	
	function percentToColor(hppercent){
		var color = "#00FF00";
		if (hppercent < 1) color = "#7FFFA4";	//light green;
		if (hppercent < 0.75) color = "yellow";
		if (hppercent < 0.5) color = "orange";
		if (hppercent < 0.25) color = "red";
		return color;
	}
	
	function drawNickAtPos(c,offset){
		offset = offset || OFFSET;
		var spos = worldtoscreen({x:lerp(c.frompos.x,c.pos.x,c.t),y:lerp(c.frompos.y,c.pos.y,c.t)});
		ctx.font="10px Tahoma";
		ctx.textAlign = "center";
		ctx.fillStyle="#000000";
		ctx.lineWidth = 2;
		ctx.strokeText(c.nick,Math.floor(spos.x*32)+16-offset.x,Math.floor(spos.y*32)+16-20-4-offset.y);
		ctx.fillStyle="#FFFFFF";    
		ctx.lineWidth = 1;
		ctx.fillText(c.nick,Math.floor(spos.x*32)+16-offset.x,Math.floor(spos.y*32)+16-20-4-offset.y);
		ctx.textAlign = "start"; 
	}
		
	function drawLifeBarAtPos(c,hp,offset){
		offset = offset || OFFSET;
		var spos = worldtoscreen({x:lerp(c.frompos.x,c.pos.x,c.t),y:lerp(c.frompos.y,c.pos.y,c.t)});
		ctx.fillStyle="#640000";	//dark red
		ctx.fillRect(Math.floor(spos.x*32)-offset.x, Math.floor(spos.y*32)-4-offset.y,32,2);	//(spos.y*32)+32+2,32,2);
		var color = percentToColor(hp);
		ctx.fillStyle=color;
		ctx.fillRect(Math.floor(spos.x*32)-offset.x,Math.floor(spos.y*32)-4-offset.y,Math.max(0,Math.floor(hp*32)),2);
	}
	
	EFFECTN_MS = 500;
	EFFECTD_MS = 300;
	underscore_on = false; underscore_count = 0;
	
	OFFSET = {x:0,y:0};
	TIME = 0;
	var canvascrosshair = false;
	
	var last_time = 0;
	
	function drawgame(){
		if (!world || !gamestarted) return;

		if ((team == 0 || hp<=0) && positions.length>0 && positions_index>-1) {	//speccing
			playerpos = positions[positions_index] || (positions_index=0 && positions[0]);
		}
			
		OFFSET = _offset();
		
		drawWorld();	//erases previous effects
		
		var delta_time = TIME - last_time;
		last_time = TIME;

		/*if (followthemouse){
			canvas.style.cursor = "none";
		} else */
		if (followthemouse || (mouseposx<608-9 && (inventory.equips[LEFT] || inventory.equips[RIGHT]))){
			if (!canvascrosshair){
				canvas.style.cursor = "url(./sprites/crosshair-best.png) 9 9, auto";
				canvascrosshair = true;
			}
		} else {
			canvas.style.cursor = "default";
			canvascrosshair = false;
		}
		
		var weapon = (inventory.equips[LEFT] || inventory.equips[RIGHT]);
		if (mouseposx<608-9 && weapon && getCookie("debugline")=="1"){
			var state = {};
			var topos = screentoworld(mouseposx,mouseposy)
			var range = itemtypes[weapon.imgid].range;
			bresenham(playerpos, topos, function (x,y){
				var pos_ = newpos(x,y);
				if (inworld(newpos(x,y))){
					var pos = worldtoscreen(newpos(x,y));
					ctx.fillStyle = "#000000";
					if (playerpos.x==x && playerpos.y==y){
						ctx.fillStyle = "#808080";
					} else if (rangepos(playerpos,pos_)>range){
						state.hit = true;
						return;
					} else if (topItem(getTile(x,y)).creature && !state.hit){
						state.hit = true;
						ctx.fillStyle = "#FF0000";
					} else if (itemtypes[topItem(getTile(x,y))].blocking && !state.hit){
						state.hit = true;
						//ctx.fillStyle = "#0000FF";
						ctx.fillStyle = "#0000FF";
					} else if (topos.x==x && topos.y==y && !state.hit){
						ctx.fillStyle = "#0000FF";
					} else if (state.hit){
						return; //ctx.fillStyle = "#000000";
					}
					ctx.globalAlpha=0.5;
					ctx.fillRect(pos.x*32,pos.y*32,32,32);
					ctx.globalAlpha=1.0;
				}
			});
		}
		
		if (document.cookie.indexOf("debug")>-1){
			//draw coordinates
			ctx.fillStyle = "#FFFFFF";
			ctx.font = "20px Tahoma";
			ctx.fillText(playerpos.x+", "+playerpos.y, 608-ctx.measureText(playerpos.x+", "+playerpos.y).width-5, 608-5-ctx.font.substr(0,ctx.font.indexOf("px")));
			//draw ping
			ctx.fillText(my_ping, 608-ctx.measureText(my_ping).width-5, 608-5);
			//draw fps
			ctx.fillText(Math.floor(1000/delta_time) + " fps", 0+5, 608-5);
		}
		
		drawEffects();
		drawInventory();
				
		//draw messages
		if (newmessages.length>5) newmessages=newmessages.slice(newmessages.length-5);
		var messages = systemmessages.concat(newmessages);
		var j=0;
		ctx.fillStyle = "#FFFFFF";
		ctx.strokeStyle = "#000000";
		ctx.font="bold 15px Times New Roman"; 
		for (var i=0;i<messages.length;i++){
			var text = messages[i][0];
			var nick = messages[i][1];
			var team_ = messages[i][2];
			var color = messages[i][3] || "#FFFFFF";
			var left = 10;
			var teamcolors = ["#FFFFFF", "#FF2020", "#2020FF", "#CCCCCC",]; //["#FFFFFF", "#FF0000", "#0000FF"];
			if (nick){
				if (team_)
					ctx.fillStyle = teamcolors[team_];
				ctx.font="bold 15px Times New Roman";
				ctx.lineWidth = 2;
				ctx.strokeText(nick,left,13+j*15);
				ctx.lineWidth = 1;
				ctx.fillText(nick,left,13+j*15);
				left += ctx.measureText(nick).width;
				ctx.fillStyle = "#FFFFFF";
				ctx.font="bold 15px Times New Roman"; 
			}
			var wid = ctx.measureText(text).width;
			if (wid+left>608){
				text = cropToWidth(text,608-left);
			}
			ctx.fillStyle = color;
			ctx.lineWidth = 2;
			ctx.strokeText(text,left,13+j*15);
			ctx.lineWidth = 1;
			ctx.fillText(text,left,13+j*15);
			j+=1;
		}
		if (talking){
			var text='> '+talking_string;
			if (ctx.measureText(text).width>608-10-ctx.measureText('_').width)
				text = cropToWidth(text,608-10-ctx.measureText('_').width);
			if (underscore_on) text+='_';
			underscore_count+=1; if (underscore_count>=20) {underscore_on=!underscore_on; underscore_count=0;} //20*30 ~600ms

			ctx.lineWidth = 2;
			ctx.strokeText(text,10,13+j*15);
			ctx.lineWidth = 1;
			ctx.fillText(text,10,13+j*15);
		}
		if(status_message){
			ctx.textAlign = "center";     
			ctx.lineWidth = 2;
			ctx.strokeText(status_message,304,608);
			ctx.lineWidth = 1;
			ctx.fillText(status_message,304,608);
			ctx.textAlign = "start";     
		}
		
		if (countdown){
			ctx.font = "100px Tahoma";
			var size = ctx.measureText(countdown).width;
			var desiredsize = 608;
			if (size > desiredsize){
				//font was 100px
				var fontsize = Math.floor(100*desiredsize/size);
				ctx.font = fontsize+"px Tahoma";
			}
			ctx.fillStyle = countdown_color;
			ctx.textAlign = "center";
			ctx.lineWidth = 2; ctx.strokeText(countdown, 304, 304+50);
			ctx.lineWidth = 1; ctx.fillText(countdown, 304, 304+50);
			ctx.textAlign = "start";
		}

		FREE_FOR_ALL = 2;
		if (score && room_game_options.mode_selected != FREE_FOR_ALL){		//ugly. modes[mode_selected].show_score ? .. ideally a flag sent by the host
			ctx.font = "20px Times New Roman";
			var right = 608-6;
			var bottom = 20;
			ctx.textAlign = "end";
			ctx.fillStyle = "#0000FF";
			ctx.lineWidth = 1; ctx.fillText(score.blue, right, bottom);
			var wid = ctx.measureText(score.blue).width;
			right-=wid;
			ctx.fillStyle = "#FFFFFF";
			ctx.lineWidth = 2; ctx.strokeText(" x ", right, bottom);
			ctx.lineWidth = 1; ctx.fillText(" x ", right, bottom);
			var wid = ctx.measureText(" x ").width;
			right-=wid;
			ctx.fillStyle = "#FF0000";
			ctx.lineWidth = 1; ctx.fillText(score.red, right, bottom);
			ctx.textAlign = "start";
		}
		if (timer && false){	//timers are bugged, do not show
			ctx.font = "20px Times New Roman";
			var right = 608-6;
			var bottom = (room_game_options.mode_selected != FREE_FOR_ALL) ? 40 : 20;
			ctx.textAlign = "end";
			ctx.fillStyle = "#FFFFFF";
			if (blinkingtimer && (getTime() % 500) > 250)
				ctx.fillStyle = "#FF6060";
			ctx.lineWidth = 2; ctx.strokeText(timer, right, bottom);
			ctx.lineWidth = 1; ctx.fillText(timer, right, bottom);
			ctx.textAlign = "start";
		}
		
		//drawFrags();
		
		updateKeys();
	}
	
	function drawFrags(){
		//608 384//416
		ctx.fillStyle = "#6B6B6B";
		//ctx.fillRect(608,416-2,288,3);
		ctx.fillStyle = "#6B6B6B";
		//ctx.fillRect(608,416,288,224);
		ctx.font = "14px bold Tahoma";
		ctx.fillStyle = "#000000";	//"#FFFFFF";
		ctx.fillText("Players", 608+6, 416+14);
		ctx.fillText("Kills", 768, 416+14);
		ctx.fillText("Deaths", 848, 416+14);
		var Reds = []; var Blues = []; var Greens = []; var dy = 14;
		for (var i in frags){
				frags[i].team == 1 ? Reds.push(frags[i]) : frags[i].team == 2 ? Blues.push(frags[i]) : Greens.push(frags[i]);
				//Nicks[i].frags
		}
		ctx.fillStyle = "#000000";
		//ctx.fillRect(608, 416+14+1, 288, 2); 
		ctx.fillStyle = "#FF0000";
		var bottom = 416+14+1+dy;
		for (var r in Reds){
			ctx.fillText(Reds[r].nick, 608+6, bottom);
			ctx.fillText(Reds[r].kills, 768, bottom);
			ctx.fillText(Reds[r].deaths, 848, bottom);
			bottom += dy+1;
		}
		//if(Reds.length>0)
		//	ctx.fillRect(608, bottom-dy+1, 288, 1); 
		ctx.fillStyle = "#0000FF";
		for (var b in Blues){
			ctx.fillText(Blues[b].nick, 608+6, bottom);
			ctx.fillText(Blues[b].kills, 768, bottom);
			ctx.fillText(Blues[b].deaths, 848, bottom);
			bottom += dy+1;
		}
		//if(Blues.length>0)
		//	ctx.fillRect(608, bottom-dy+1, 288, 1); 
		ctx.fillStyle = "#000000";
		for (var b in Greens){
			ctx.fillText(Greens[b].nick, 608+6, bottom);
			ctx.fillText(Greens[b].kills, 768, bottom);
			ctx.fillText(Greens[b].deaths, 848, bottom);
			bottom += dy+1;
		}
	}
	
	
	// Util for drawing
	
	function worldtoscreen(pos){
		return {x:pos.x-playerpos.x+9,y:pos.y-playerpos.y+9};
	}
	
	function screentoworld(x,y){
			return {x:playerpos.x+Math.floor(x/32)-9, y:playerpos.y+Math.floor(y/32)-9};
	}
	
	
	// some game callbacks
	
	function restartVars(){	
		inventory = {equips:[],items:[]};
		for (var x=0;x<8;x++){
			inventory.items.push([]);
		}
		if (!gamestarted) 
			world = false;
		distanceeffects = [];
		magiceffects = [];
		damageeffects = [];
		talkeffects = [];
		hp = 100;		
		maxhp = 100;
		invisible = false;
		invis_pass = "nothing";
		invis_hashes = {nothing:{}};
		talking_string = "";
		talking = false;
		status_message = "";
		countdown = false;
		playerpos.default = true;
	}
	
	function emptyInventory(){
		inventory = {equips:[],items:[]};
		for (var x=0;x<8;x++){
			inventory.items.push([]);
		}
	}

	
	// Host callbacks
	
	hostcallbacks = [];
	function hoston(name,callback){
		hostcallbacks.push({type:name,callback:callback});
	}
	
	//game functions
	
	hoston('world', function(msg){
		countdown=false;
		if (imhost)
			msg.world = copyWorld(msg.world);	//so it isn't imagegrid directly
		worldReceived(msg)
	});
	
	hoston('changes', function(msg){
		changesReceived(msg); 
		if (msg.nicks) 
			Nicks=msg.nicks;
	});
	
	hoston('addtoinv', addToInv);
	hoston('addtoeq', addToEq);
	hoston('removefrominv', removeFromInv);
	hoston('removefromeq', removeFromEq);
	
	hoston('hp', function (msg) {
		hp=msg.hp;
		maxhp=msg.maxhp;
	});			
	
	hoston('distanceeffect', function(msg){
		msg.start=getTime();
		msg.vec=subpos(msg.topos,msg.frompos);
		distanceeffects.push(msg);
	});
	
	/*hoston('magiceffect', function(msg){
		msg.start=getTime();
		magiceffects.push(msg);
	});*/
	
	/*hoston('magiceffects', function (msg) {
								var start=getTime();
								msg.magiceffects.forEach(function (i) {i.start=start;});
								magiceffects=magiceffects.concat(msg.magiceffects);
	});*/
	
	/*hoston('damageeffects', function (msg) {
								var start=getTime();
								msg.damageeffects.forEach(function (i) {i.start=start;});
								damageeffects=damageeffects.concat(msg.damageeffects);
	});*/	
	
	hoston('effects', function (msg) {
							var start=getTime();
							msg.magiceffects.forEach(function (i) {i.start=start});
							magiceffects=magiceffects.concat(msg.magiceffects);
							msg.damageeffects.forEach(function (i) {i.start=start;});
							damageeffects=damageeffects.concat(msg.damageeffects);
							msg.distanceeffects.forEach(function (i) {i.start=start; i.vec=subpos(i.topos,i.frompos);});
							distanceeffects=distanceeffects.concat(msg.distanceeffects);
	});
	
	hoston('invisible', function (msg) {
		if (msg.invisible){
			socketemit("invis_hash", {invis_hash:hash(pos_to_string(playerpos), invis_pass)});  //the host might be invis..
		}
		//if (!imhost) {
			if (!invisible && msg.invisible){
				topItem(world[playerpos.x][playerpos.y]).imgid = 45;
			} else if (invisible && !msg.invisible){
				topItem(world[playerpos.x][playerpos.y]).imgid = msg.player_imgid;
			}
		//}
		invisible=msg.invisible; 
	});	
	
	hoston('wearoffinvincible', function (msg) {
		topItem(world[playerpos.x][playerpos.y]).imgid = msg.player_imgid;
	});
	
	hoston('invis_pass', function (msg){
		invis_pass = msg.invis_pass;
		invis_hashes[invis_pass] = {};
		if (invisible){
			socketemit("invis_hash", {invis_hash:hash(pos_to_string(playerpos), invis_pass)});	//the host might be invisible too
		}
	});
	
	hoston('invis_hash', function (msg){
		if (msg.expire){
			//delete invis_hashes[invis_pass][msg.hash];
		} else {
			invis_hashes[invis_pass][msg.invis_hash]=true;
		}
	});
	
	hoston('speed', function (msg) { 
		speed = msg.speed; 
	});
	
	hoston('pos', function (msg) {	
		if (!imhost && msg.fail){
			//correction
			console.log('pos fail', playerpos, msg.pos, world[playerpos.x][playerpos.y], world[msg.pos.x][msg.pos.y], msg.tile);

			var me2 = topItem(world[playerpos.x][playerpos.y]);
			if (me2.creature && me2.nick == name_){	
				world[playerpos.x][playerpos.y].pop();
			}

			var me = topItem(world[msg.pos.x][msg.pos.y]);
			if (!me.creature || me.nick != name_){
				var tile = msg.tile;
				me = topItem(tile);
				if (!me.creature){	//likely because invisible
					me = me2;
					tile.push(me2);
				}
				world[msg.pos.x][msg.pos.y] = tile;
			}

			me.pos = msg.pos;
			me.walking = false;

			playerpos = msg.pos;
		} else if (!imhost && msg.start){
			playerpos = msg.pos;
		}
	});
		
	hoston('positions', function (msg) { 
		positions = msg.positions;
		Nicks = msg.nicks
	});
	
	hoston('haskilled', function (msg) { 	//deprecated. see 'statusmessage' and checkcreature at hostapp.js
							var killername = id_names[msg.killer].name; 
							var killedname = id_names[msg.killed].name; 
							if (msg.killer != msg.killed)
								appendText("* "+killername+" has killed "+killedname+".",'',GAMEONLY);
							else
								appendText("* "+killername+" killed himself.",'',GAMEONLY);
							if (msg.killed==myid)
								appendText("* You died.",'',GAMEONLY);
	});
										
	hoston('gamestopped', function () { 
		gamestarted=false;
		restartVars(); 
		finalscreen=false; 
		hideCanvas(); 
		gameEnded();
	});
	
	hoston('restartVars', restartVars);
	hoston('emptyInventory', emptyInventory);
	
	hoston('kick', function () { 
		alert("You were kicked."); 
	});
	
	hoston('ban', function () { 
		alert("You were banned."); 
	});
	
	hoston('team', function (data) {
		id_names[data.id].team=data.team;
		updateNames();
		if (gamestarted){
			var s = "* "+id_names[data.id].name+" was moved to ";
			if (data.ffa && data.team!=0)
				s+="game";
			else
				s+=(data.team==0 ? "Spectators" : (data.team==1 ? "Red" : "Blue"));
			//appendText("* "+id_names[data.id].name+" was moved to "+(data.team==0 ? "Spectators" : (data.team==1 ? "Red" : "Blue")));
			appendText(s);
		}
		if (data.id==myid){
			var lastteam = team;
			team = data.team;
			if (gamestarted){
				systemmessages = [];//appendText(
				//systemmessages.push(["[Press ESC to toggle between chat and game. Press T to talk in-game.]",'',false, "#0000CC"]);
				//if (!team)
					//newmessages.push(["* You are spectating. Press TAB to switch who you're following. Press F for free-roaming.",'']);
			}
		}
	}); 
	
	hoston('getTimeStamps', function (data) {
		conn.send({type:'timestamp', timestamp: getTime(), id:data.id}); 
	});
	
	hoston("sync'd", onSync);
	
	my_ping = 0;
	window.ping = function () { !imhost && conn.send({type:'ping', timestamp: getTime()}) };
	hoston("ping", function (data) { my_ping = getTime() - data.timestamp; });	//console.log("ping is " + (getTime() - data.timestamp)); });
	setInterval(function () {if (drawingRoom || drawingGame) ping();}, 1000);
	
	//room functions
	
	hoston('mytimelimit', function (msg) { 
		room_game_options.timelimit = msg.value; 
	});

	hoston('myscorelimit', function (msg) {
		room_game_options.scorelimit = msg.value;
	});
	
	hoston('size_selected', function (msg) { 
		room_game_options.size_selected = msg.value; 
	});
	
	hoston('terrain_selected', function (msg) { 
		room_game_options.map_selected = msg.value; 
	});
	
	hoston('gamemode_selected', function (msg) { 
		room_game_options.mode_selected = msg.value; 
	});
	
	hoston('lockedNames', function (msg) { 
		lockedNames = msg.value; 
	});
	
	hoston('chat', function (d) {
						if (d.message.length > MSGLENLIMIT) d.message = d.message.substring(0,MSGLENLIMIT);	//I'll do this in the host resending too
						var nome = id_names[d.id] ? id_names[d.id].name : "no_name_error";
						var team_ = id_names[d.id] ? id_names[d.id].team : false;
						if (d.team) team_ = d.team;
						appendText(d.message, nome, false, team_);
	});
	
	hoston('nicks', function (msg) { 
		Nicks = msg.nicks; 
		frags = msg.frags
	});
	
	hoston('countdown', function (msg) { 
		countdown = msg.value; 
		countdown_color = msg.color; 
	});
	
	hoston('clearCountdown', function () { 
		countdown = false; 
	});
	
	hoston('locked', function () {	//locked before the match starts
		locked=true;
	});
	
	hoston('unlocked', function () {
		locked=false;
	});
	
	hoston('score', function (msg) { 
		score = msg.score; 
	});
	
	hoston('timer', function (msg) { 
		timer = msg.timer; 
	});
	
	hoston('blinkingtimer', function (msg) { 
		blinkingtimer = msg.value; 
	});
	
	hoston('statusmessage', function (msg) {
		appendText(msg.text,'',msg.which);
	});
	
	hoston('name', function (data){
		id_names[data.id]={id:data.id,name:data.name,team:data.team};	//teams: 0 spec, 1 red, 2 blue
		updateNames();
		appendText("* "+data.name+" has joined the room");
		//alerter();
	});
	
	hoston('names', function (data){
		id_names = data.names;
		connected();
	});
	
	hoston('leave', function (data){
		appendText("* "+id_names[data.id].name+" has left the room");
		delete id_names[data.id];
		updateNames();
	});
	
	hoston('kicked', function (data){
		appendText("* "+id_names[data.id].name+" was kicked by "+id_names[hostid].name);
		delete id_names[data.id];
		updateNames();
	});
	
	hoston('banned', function(data){
		appendText("* "+id_names[data.id].name+" was banned by "+id_names[hostid].name);
		delete id_names[data.id];
		updateNames();
	});
	
	
	//itemtypes -- move to (???)

	itemtypes =		[	{id:0,blocking:false,movable:false,stackable:false,imgid:0},						//grass
						{id:1,blocking:true,movable:false,stackable:false,imgid:1,creature:true},			//creature
						{id:2,blocking:true,movable:false,stackable:false,imgid:2,pathblocking:true},		//tree
						{id:3,blocking:false,movable:true,stackable:false,imgid:3,slot:[LEFT,RIGHT],range:2},//sword
						{id:4,blocking:false,movable:true,stackable:false,imgid:4,slot:[LEFT,RIGHT],range:9},//bow
						{id:5,blocking:false,movable:true,stackable:true,imgid:5,slot:[AMMO]},				//arrow
						{id:6,blocking:false,movable:true,stackable:true,imgid:6,slot:[LEFT,RIGHT],range:7},//fireball rune
						{id:7,blocking:false,movable:true,stackable:true,imgid:7,slot:[LEFT,RIGHT],range:7},//magic wall rune
						{id:8,blocking:true,movable:false,stackable:false,imgid:8,pathblocking:true,animationdelay:500},		//magic wall
						{id:9,blocking:false,movable:true,stackable:true,imgid:9},							//life potion
						{id:10,blocking:false,movable:true,stackable:true,imgid:10},						//invisibility potion
						{id:11,blocking:false,movable:true,stackable:true,imgid:11},						//haste potion
						{id:12,blocking:true,movable:false,stackable:false,imgid:12,pathblocking:true},		//fruity tree
						{id:13,blocking:false,movable:true,stackable:true,imgid:13},						//apple
						{id:14,blocking:true,movable:false,stackable:false,imgid:14,pathblocking:true},		//stone wall
						{id:15,blocking:true,movable:false,stackable:false,imgid:15,pathblocking:true},		//closed door
						{id:16,blocking:false,movable:false,stackable:false,imgid:16},						//open door
						{id:17,blocking:true,movable:false,stackable:false,imgid:17,pathblocking:false},	//water
						{id:18,blocking:true,movable:false,stackable:false,imgid:18},						//red player
						{id:19,blocking:true,movable:false,stackable:false,imgid:19},						//blue player
						{id:20, blocking:true, movable:false, stackable:false, imgid:20, pathblocking:false},	//bush
						{id:21, blocking:false, movable:false, stackable:false, imgid:21, x_repeat:2, y_repeat:2},	//grass with texture
						{id:22,blocking:true,movable:false,stackable:false,imgid:22,pathblocking:true},		//fir tree
						{id:23,blocking:true,movable:false,stackable:false,imgid:23},						//branch
						{id:24,blocking:false,movable:false,stackable:false,imgid:24},						//snow
						{id:25,blocking:true,movable:false,stackable:false,imgid:25,pathblocking:true},		//snowy fir tree
						{id:26,blocking:true,movable:false,stackable:false,imgid:26,pathblocking:true},		//snowy dead tree twisted
						{id:27,blocking:true,movable:false,stackable:false,imgid:27,pathblocking:true},		//snowy dead tree half alive
						{id:28, blocking:false, movable:false, stackable:false, imgid:28, x_repeat:4, y_repeat:4},						//sand
						{id:29, blocking:true, movable:false, stackable:false, imgid:29, pathblocking:true},		//palm tree
						{id:30,blocking:true,movable:false,stackable:false,imgid:30,pathblocking:true},		//cactus thick
						{id:31,blocking:true,movable:false,stackable:false,imgid:31,pathblocking:true},		//cactus sharp
						{id:32,blocking:true,movable:false,stackable:false,imgid:32},						//green player
						{id:33,blocking:true,movable:false,stackable:false,imgid:33},						//dragon
						{id:34,blocking:true,movable:false,stackable:false,imgid:34},						//dummy
						{id:35,blocking:true,movable:false,stackable:false,imgid:35,pathblocking:true},		//tree
						{id:36,blocking:true,movable:false,stackable:false,imgid:36,animationdelay:200},	//red player invincible
						{id:37,blocking:true,movable:false,stackable:false,imgid:37,animationdelay:200},	//blue player invincible
						{id:38,blocking:true,movable:false,stackable:false,imgid:38,animationdelay:200},	//green player invincible
						{id:39,blocking:false,movable:false,stackable:false,imgid:39},						//ice
						{id:40,blocking:false,movable:true,stackable:true,imgid:40,slot:[LEFT,RIGHT],range:7},//healing rune
						{id:41,blocking:false,movable:true,stackable:false,imgid:41,armor:4,slot:[TORSO]},	//leather armor
						{id:42,blocking:false,movable:true,stackable:false,imgid:42,armor:1,slot:[LEGS]},	//leather legs
						{id:43,blocking:false,movable:true,stackable:false,imgid:43,armor:1,slot:[HEAD]},	//leather helmet
						{id:44,blocking:false,movable:true,stackable:false,imgid:44,armor:1,slot:[BOOTS]},	//leather boots
						{id:45,blocking:true,movable:false,stackable:false,imgid:45,creature:true,animationdelay:500},		//magic dust creature
						{id:46,blocking:false,movable:true,stackable:true,imgid:46,slot:[LEFT,RIGHT],range:7},//poison field rune
						{id:47,blocking:false,movable:false,stackable:false,imgid:47,animationdelay:250},	//poison gas
						{id:48,blocking:true,movable:false,stackable:false,imgid:48,x_repeat:4,y_repeat:4},	//void tile
						{id:49,blocking:true,movable:false,stackable:false,imgid:49,usable:true},	//lever
						{id:50,blocking:true,movable:false,stackable:false,imgid:50,usable:true}	//pulled lever
					];

	typelist = [false,false,false,"weapon","weapon","ammo","weapon","weapon",false,"item","item","item",false,"item",false,false,false,false];
	typelist[40] = "weapon";
	typelist[41] = "torso";
	typelist[42] = "legs";
	typelist[43] = "head";
	typelist[44] = "boots";
	typelist[46] = "weapon";

	
	// Movement
	  
	last_walk = 0;
	function dirMove(dir){
		if (hp > 0 && team != 0){
			var time = getTime();
			if (time - last_walk >= (dir < 4 ? WALK_DELAY : WALK_DIAGONAL)/speed){
				var p = /*imhost ? undefined :*/ genPredId();
				var expected;
				if (!imhost){
					expected = predict('move', {predId: p, dir: dir}, p);
					if (expected){
						socketemit('move', {predId:p, dir:dir, expected: expected, timestamp: time, totile: getTile(playerpos)});
						if (invisible)
							conn.send({type: "invis_hash", invis_hash: hash(pos_to_string(playerpos), invis_pass)});
					}
				} else {
					expected = predict('move', {predId: p, dir: dir}, p);
					if (expected){
						socketemit('move', {predId: p, dir: dir, expected: expected, timestamp: time, totile: getTile(playerpos)});		//,timestamp:time	//you send the expected flag, it returns fail if his simulation differs
						if (invisible)
							socketemit("invis_hash", {invis_hash: hash(pos_to_string(playerpos), invis_pass)});
					}
				}
				last_walk=time;
			}
		} else {
			playerpos = deltapos(playerpos, dir);
			playerpos.x = Math.max(0, Math.min(playerpos.x, world.length - 1));
			playerpos.y = Math.max(0, Math.min(playerpos.y, world[0].length - 1));
		}
	}
	  
	  
	// Key events
	
	var keyboard = {};
	  
	window.keyUnpressed = function (ev){
		var arrows=((ev.which)||(ev.keyCode));
		keyboard[arrows]=false;
	}
	
	usingkeyboard = false;
	
	window.updateKeys = function (){
		if (usingkeyboard){
			if (keyboard[39] || (!talking && keyboard[68])){	//right	//d
				dirMove(EAST);
			} else if (keyboard[37] || (!talking && keyboard[65])){	//left	//a
				dirMove(WEST);
			} else if (keyboard[38] || (!talking && keyboard[87])){	//up	//w
				dirMove(NORTH);
			} else if (keyboard[40] || (!talking && keyboard[83])){	//down	//s
				dirMove(SOUTH);
			} else if (!talking && keyboard[90]){	//z
				dirMove(SOUTHWEST);
			} else if (!talking && keyboard[67]){	//c
				dirMove(SOUTHEAST);
			} else if (!talking && keyboard[81]){	//q
				dirMove(NORTHWEST);
			} else if (!talking && keyboard[69]){	//e
				dirMove(NORTHEAST);
			}
		}
		if (touching && touchingmove){
			dirMove(touchfromx);
		}
	}
	
	
	window.keyPressed = function (ev) {
		if (drawingLoading) { return;}
		var arrows=((ev.which)||(ev.keyCode));
		keyboard[arrows]=true;
		if (arrows==27){	//esc
			if (gamestarted){
				if (drawingGame)
					hideCanvas();
				else
					showCanvas();
			}
			return;
		}
		if (hostleft) 
			return;
		if (!drawingGame) {
			if (drawingRoom && arrows == 9){	//tab
				ev.preventDefault(); 
				chatfocus = mychat;
			} if (chatfocus){
				if (arrows == 8){	//backspace
					chatfocus.msg = chatfocus.msg.substring(0,chatfocus.msg.length-1);
					ev.preventDefault();	//won't write '\backspace'
				} else if (arrows == 13){	//enter
					ev.preventDefault();
					if(chatfocus.msg.length==0){ return;}
					if (chatfocus.onsubmit)
						chatfocus.onsubmit(chatfocus);
				}
				return;
			}
			return; //all below are game functions
		}
		if (arrows==84 && gamestarted && !talking){	//T
			talking=true;
			ev.preventDefault();	//won't write 't'
			return;
		} else if (talking && gamestarted){
			if (arrows == 8){	//backspace
				talking_string = talking_string.substring(0,talking_string.length-1);
				ev.preventDefault();	//won't write '\backspace'
			} else if (arrows == 13){	//enter
				if(talking_string.length==0){talking=false; return;}
				if (!(talking_string.substr(0,1)=='/')){
					if (imhost){
						broadcast('chat',{id:myid,message:talking_string});
					} else {
						conn.send({type:'chat',message:talking_string});
						appendText(talking_string, name_, false, team);
					}
				} else {	
					var words = talking_string.split(" ");
					var com = words.shift();
					var param = words.join(" ");
					socketemit("command", {com:com,param:param});
				}
				talking_string = "";
				talking=false;
			}
			return;
		}
		if (arrows == 66 && gamestarted){	//B //screenshot //debug
			window.open(canvas.toDataURL(),'_blank');
		}
		if (!locked && !usingkeyboard){
			if (arrows==39 || (!talking && arrows==68)){	//right	//d
				dirMove(EAST);
			} else if (arrows==37 || (!talking && arrows==65)){	//left	//a
				dirMove(WEST);
			} else if (arrows==38 || (!talking && arrows==87)){	//up	//w
				dirMove(NORTH);
			} else if (arrows==40 || (!talking && arrows==83)){	//down	//s
				dirMove(SOUTH);
			} else if (!talking && arrows==90){	//z
				dirMove(SOUTHWEST);
			} else if (!talking && arrows==67){	//c
				dirMove(SOUTHEAST);
			} else if (!talking && arrows==81){	//q
				dirMove(NORTHWEST);
			} else if (!talking && arrows==69){	//e
				dirMove(NORTHEAST);
			}
		}
		//ev.preventDefault();
		if (arrows==9 && (team==0 || hp<=0) && gamestarted){	//TAB //this will change who you're following
			if(!ev.shiftKey)
				positions_index=(positions_index+1)%positions.length;
			else
				positions_index=(positions.length+positions_index-1)%positions.length;
		} else if (arrows==70 && (team==0 || hp<=0) && gamestarted){	//F is free roaming
			positions_index=-1;
		} else if (!talking && arrows>=48 && arrows <= 57){
			var key = arrows-48;	//0,1,2,...
			if (hotkeys[key]){
				doHotkey(hotkeys[key]);
			}
		}
		if (arrows==9)
			ev.preventDefault();
		ev.preventDefault();
	}
	  
	window.keyPressed2 = function (ev){
		if (talking){
			var charCode = ev.which;
			var charStr = String.fromCharCode(charCode);
			if (charCode) {	
				if (talking_string.length < MSGLENLIMIT)
					talking_string += charStr;
			}
			ev.preventDefault();
		}
		else if (!drawingGame && chatfocus){
			var charCode = ev.which;
			var charStr = String.fromCharCode(charCode);
			if (charCode) {	
				if (chatfocus.msg.length < MSGLENLIMIT)
					chatfocus.msg += charStr;
			}
			ev.preventDefault();
		}
	}
	
	document.addEventListener('keypress', keyPressed2);
	document.body.addEventListener('keydown', keyPressed);
	document.body.addEventListener('keyup', keyUnpressed);
	  
	  

	// Mouse events
	
	followthemouse = 0;
	tempfollow = 0;
	mouseDown = false;
	mouseposx = 0;
	mouseposy = 0;

	
	dragfrom=0;
	dragfromx=0;
	dragfromy=0;
	dragfrom_origx=0;
	dragfrom_origy=0;
	dragto=0;
	dragtox=0;
	dragtoy=0;
	dragto_origx=0;
	dragto_origy=0;
	
	window.mouseMoved = function (ev) {
		if (drawingNicknamePrompt){
			nnMouseMoved(ev);
			return;
		} else if (drawingRoom){
			roomMouseMoved(ev);
			return;
		}
		if (!drawingGame) return;
		mouseposx = ev.clientX-canvasposition.left;
		mouseposy = ev.clientY-canvasposition.top;
		if (tempfollow && mouseDown)
			followthemouse = tempfollow;
	}

	movebuttontable = {[1]:NORTH,[3]:WEST,[5]:EAST,[7]:SOUTH};
	
	function getDragXY(x,y){
		var drag,dragx,dragy;
		if (x>=0 && x<608 && y>=0 && y<608){	//to do: consider the offset
			//ctx.fillRect((x+9)*32-OFFSET.x,(y+9)*32-OFFSET.y,32,32);
			drag="map";
			dragx=playerpos.x+Math.floor((x+OFFSET.x)/32)-9;
			dragy=playerpos.y+Math.floor((y+OFFSET.y)/32)-9;
		} else if (x>=608 && y >=224 && y < 320){	
			drag="inv";		//you won't send this
			dragx=Math.floor((x-608)/32);
			dragy=Math.floor((y-224)/32);
		} else if (x>=608 && x<608+96 && y>=64 && y<192){
			drag="eq";
			var x=Math.floor((x-608)/32);
			var y=Math.floor((y-64)/32);
			dragx=equiptable[x][y];
			if(!dragx && dragx!=HEAD){
				drag=false;
			}
		} else if (x>=608+96 && y < 64) {	//hotkey, 0 to 9
			drag="hotkey";
			dragx = Math.floor((x-(608+96))/32)+1;
			dragy = Math.floor(y/32);
			if (dragy==1) { dragx+=5; }
			if (dragx==10) { dragx=0; }
		} else if (x>=33 && x<=128 && y>=356 && y<=451) {
			drag="movebuttons";
			var x = Math.floor((x-33)/32);
			var y = Math.floor((y-356)/32);
			dragx = movebuttontable[y*3+x];
			if (!dragx && dragx != NORTH){
				drag = false;
			}
		} else {
			drag=false;
		}
		return {drag:drag,dragx:dragx,dragy:dragy,origx:x,origy:y};
	}
  
	window.mousePressed = function (ev) {
		if (drawingNicknamePrompt){
			nnMousePressed(ev);
			return;
		} else if (drawingRoom){
			roomMousePressed(ev);
			return;
		}
		if (!drawingGame) return;
		mouseDown = true;
		if (hp<=0 || !team) return;
		var x = ev.clientX-canvasposition.left;
		var y = ev.clientY-canvasposition.top;
		dragfromcx = x; dragfromcy=y;
		ev.preventDefault();
		var d = getDragXY(x,y);
		dragfrom = d.drag; dragfromx=d.dragx; dragfromy=d.dragy; dragfrom_origx=d.origx; dragfrom_origy=d.origy;
		if (dragfrom == "map"){
			var id = (world[dragfromx] && world[dragfromx][dragfromy]) ? topItem(world[dragfromx][dragfromy]) : false;
			if (itemtypes[id] && itemtypes[id].movable && rangepos(newpos(dragfromx,dragfromy),playerpos)<=1)
				tempfollow = id;
		} else if (dragfrom == "inv"){
			if (inventory.items[dragfromx][dragfromy] && inventory.items[dragfromx][dragfromy].imgid>0){
				tempfollow = inventory.items[dragfromx][dragfromy].imgid;
			}
		} else if (dragfrom == "eq"){
			if (dragfromx || dragfromx === HEAD)
				tempfollow = inventory.equips[dragfromx].imgid;
		}
	}
	
	window.mouseReleased = function (ev) {
		if (drawingNicknamePrompt){
			nnMouseReleased(ev);
			return;
		} else if (drawingRoom){
			roomMouseReleased(ev);
			return;
		}
		if (!drawingGame) return;
		mouseDown = false;
		var wasfollowing = followthemouse != 0;
		followthemouse = 0;
		tempfollow = 0;
		if (hp<=0 || !team) return;
		var x = ev.clientX-canvasposition.left;
		var y = ev.clientY-canvasposition.top;
		var d = getDragXY(x,y);
		dragto = d.drag; dragtox=d.dragx; dragtoy=d.dragy; dragto_origx=d.origx; dragto_origy=d.origy;
		if (dragfrom && dragto){
			if ((!wasfollowing && dragfrom=="map" && dragto=="map")||(dragfrom_origx==dragto_origx && dragfrom_origy==dragto_origy)){	//clicks without moving the mouse
				if (ev.shiftKey || ev.which == 3)	//3=right click
					onshiftclick(ev);
				else
					processClick();
			} else if (dragfrom==dragto && dragfromx==dragtox && dragfromy==dragtoy){
				//
			} else {
				processDrag();
			}
		}
	}
	
	window.mouseOut = function (ev) {
		if (drawingRoom){
			roomMouseOut(ev);
			return;
		}
		mouseDown = false;
		followthemouse = 0;
		tempfollow = 0;
		dragfrom = false;
	}
	
	function processDrag(){
		if (hp<=0 || !team) return;
		//if (locked) return;	//free to drag, not free to use
		if (dragfrom=="map" && dragto=="map"){
			socketemit("moveitem",{from:{t:"map",pos:{x:dragfromx,y:dragfromy}},to:{t:"map",pos:{x:dragtox,y:dragtoy}}});
		} else if (dragfrom=="inv" && dragto=="map"){
			var fromtile = inventory.items[dragfromx][dragfromy];
			if (fromtile){
				inventory.items[dragfromx][dragfromy]=false;//if it fails because the totile is blocking, a inv change with addToInv will be sent to us
				socketemit("moveitem",{from:{t:"inv",id:fromtile.imgid,count:fromtile.count},to:{t:"map",pos:{x:dragtox,y:dragtoy}}});
				}
		} else if (dragfrom=="map" && dragto=="inv"){
			socketemit("moveitem",{from:{t:"map",pos:{x:dragfromx,y:dragfromy}},to:{t:"inv"}});
		} else if (dragfrom=="inv" && dragto=="inv"){	//internal, wont send anything to server
			var fromtile = inventory.items[dragfromx][dragfromy];
			var totile = inventory.items[dragtox][dragtoy];
			if (fromtile){
				if(!totile){
					inventory.items[dragfromx][dragfromy]=false;
					inventory.items[dragtox][dragtoy]=fromtile;
				} else if (fromtile.imgid==totile.imgid){
					var c1 = fromtile.count;
					var c2 = totile.count;
					fromtile.count = clamp(c1 + c2 - 10,0,10);
					totile.count = clamp(c1 + c2, 0, 10);
					if (fromtile.count == 0){
						inventory.items[dragfromx][dragfromy]=false;
					}
				}
			}
		} else if (dragfrom=="inv" && dragto=="eq"){	//when dragging from or to eq, dragx is index and dragy isnt anything
			var fromtile = inventory.items[dragfromx][dragfromy];
			if (fromtile)
			if (itemtypes[fromtile.imgid].slot.indexOf(dragtox)>-1){	//checking in the client just to avoid sending useless msgs, but will check in the server too	//equiplist[fromtile.imgid][dragtox]
				if (inventory.equips[dragtox]){
					if (fromtile.imgid==inventory.equips[dragtox].imgid && itemtypes[fromtile.imgid].stackable){
						var c1 = fromtile.count;
						var c2 = inventory.equips[dragtox].count;
						fromtile.count = clamp(c1 + c2 - 10,0,10);
						inventory.equips[dragtox].count = clamp(c1 + c2, 0, 10);
						if (fromtile.count == 0){
							inventory.items[dragfromx][dragfromy] = false;
						}
						socketemit("equipitem",{id:fromtile.imgid,index:dragtox,count:c1});
						return;
					}
					var temp = inventory.equips[dragtox];
					inventory.equips[dragtox] = fromtile;
					inventory.items[dragfromx][dragfromy] = temp;
					socketemit("unequipitem",{index:dragtox});
					socketemit("equipitem",{id:fromtile.imgid,index:dragtox,count:fromtile.count});
					return;
				}
				inventory.equips[dragtox]=fromtile;
				inventory.items[dragfromx][dragfromy]=false;
				socketemit("equipitem",{id:fromtile.imgid,index:dragtox,count:fromtile.count});//you merely send a equipitem/inequipitem, and it will check your inv and things
			}
		} else if (dragfrom=="eq" && dragto=="inv"){
			var totile = inventory.items[dragtox][dragtoy];
			var from = inventory.equips[dragfromx];
			if (from)
			if (!totile){
				inventory.items[dragtox][dragtoy]=from;
				inventory.equips[dragfromx]=false;
				socketemit("unequipitem",{index:dragfromx});	//id is unnecessary
			}
		} else if (dragfrom=="eq" && dragto=="map"){
			var from = inventory.equips[dragfromx];
			if (from){
				inventory.equips[dragfromx]=false;
				//socketemit("unequipitem",{index:dragfromx});	//id is unnecessary
				socketemit("moveitem",{from:{t:"eq",index:dragfromx},to:{t:"map",pos:{x:dragtox,y:dragtoy}}});
			}
		} else if (dragfrom=="map" && dragto=="eq"){	//will receive a msg from the server confirming the equipping
			socketemit("moveitem",{from:{t:"map",pos:{x:dragfromx,y:dragfromy}},to:{t:"eq",index:dragtox}});
		} else if (dragfrom=="map" && dragto=="inv"){
			socketemit("moveitem",{from:{t:"map",pos:{x:dragfromx,y:dragfromy}},to:{t:"inv"}});
		} 
		else if (dragfrom=="inv" && dragto=="hotkey"){
			var fromtile = inventory.items[dragfromx][dragfromy];
			if (fromtile){
				hotkeys[dragtox]=fromtile.imgid;	//only need the id
			}
		} else if (dragfrom=="eq" && dragto=="hotkey"){
			var from = inventory.equips[dragfromx];
			if (from){
				hotkeys[dragtox]=from.imgid;	//only need the id
			}
		}
	}
	
	last_use = 0;
	casted = false;
	function processClick(){
		if (hp<=0 || !team) return;
		if (dragfrom=="map" && dragto=="map"){
			var t = topItem(getTile(dragtox,dragtoy));
			if (rangepos(playerpos,newpos(dragtox,dragtoy)) <= 1 && t && !t.creature && itemtypes[t].movable){
				dragfrom="map";
				dragto="inv";
				processDrag();	//the most obvious action	//again, free to drag, not free to use
			} else {
				if (locked) return;
				var time = getTime();
				if (time-last_use >= USE_DELAY && (!casted || time-last_use >= CAST_EXHAUST)){
					var p = imhost ? undefined : genPredId();
					socketemit("usemap", {pos:{x:dragtox,y:dragtoy},timestamp:time});
					last_use = time;
					casted = runes[((inventory.equips[LEFT]||false).imgid||(inventory.equips[RIGHT]||false).imgid)];
				}
			}
		} else if (dragfrom == "inv"){
			var item = inventory.items[dragfromx][dragfromy];
			if (item && (typelist[item.imgid] && typelist[item.imgid] != "item")){
				doHotkey(item.imgid,{x:dragfromx,y:dragfromy});
			} else if (item){	// && usablelist[item.imgid]
				if (locked) return;
				socketemit("useinv", {id:item.imgid,x:dragfromx,y:dragfromy});	//sending x and y just so it can be sent back if you're gonna remove
			}
		} else if (dragto == "hotkey"){	//same effect as doHotkey()
			doHotkey(hotkeys[dragtox]);
		}
	}
	
	function onshiftclick(ev){	//shift+click on the canvas
		if (hp<=0 || !team) return;
		ev.preventDefault();
		if (dragfrom == "map"){	//shift+click on the map will try to pick up an item
			dragfrom="map";
			dragto="inv";
			processDrag();
		} else if (dragfrom == "hotkey"){	//clear the hotkey space
			hotkeys[dragtox] = false;
		} else if (dragfrom == "inv"){	//splits the item in two (if stackable)
			var item = inventory.items[dragfromx][dragfromy];
			if (item.count>1){
				var i0 = Math.ceil(item.count/2);
				var i1 = item.count - i0;
				item.count=i0;
				var invpos = getFirstClearInvSpot();
				if (invpos){
					inventory.items[invpos.x][invpos.y]={imgid:item.imgid,count:i1};
				}
			}
		}
	}
	


	//Touch events

        touching = false;
	touchingmap = false
	touchfromx=false;
	touchfromy=false;
	touchingmove=false;


        window.mytouchstart = function(ev){
               console.log("touchstart");
		touching = true;
		var x = ev.changedTouches[0].clientX-canvasposition.left;
                var y = ev.changedTouches[0].clientY-canvasposition.top;
                //dragfromcx = x; dragfromcy=y;
                ev.preventDefault();
                var d = getDragXY(x,y);
                //dragfrom = d.drag; dragfromx=d.dragx; dragfromy=d.dragy; dragfrom_origx=d.origx; dragfrom_origy=d.origy;
		if (d.drag == "map"){
			touchingmap=true;
			touchfromx=d.dragx;
			touchfromy=d.dragy;
		} else if (d.drag == "movebuttons"){
			touchingmove=true;
			touchfromx=d.dragx;	//dir
			//touchfromy=d.dragy;
		}
        };
        window.mytouchend = function (ev){
		console.log("touchend");
		if (touching && touchingmap){
			var x = ev.changedTouches[0].clientX-canvasposition.left;
                	var y = ev.changedTouches[0].clientY-canvasposition.top;
                	//dragfromcx = x; dragfromcy=y;
                	ev.preventDefault();
                	var d = getDragXY(x,y);
                	//dragfrom = d.drag; dragfromx=d.dragx; dragfromy=d.dragy; dragfrom_origx=d.origx; dragfrom_origy=d.origy;
                	if (d.drag == "map"){
                	        //touchingmap=true;
                	        //touchfromx=d.dragx;
                	        //touchfromy=d.dragy;
				if (touchfromx != d.dragx || touchfromy != d.dragy){
					var dir = dirBetween(newpos(touchfromx,touchfromy),newpos(d.dragx,d.dragy),true)
					dirMove(dir);
				} else {
					dragfrom=dragto="map";
					dragtox=d.dragx;
					dragtoy=d.dragy;
					processClick();
				}
                	}
		} 

                touching = false;
		touchingmap=false;
        };
        window.mytouchmove = function(ev){
		console.log("touchmove");
		
	};

	document.body.addEventListener("touchstart", mytouchstart);
	document.body.addEventListener("touchend", mytouchend);
	document.body.addEventListener("touchmove", mytouchmove);


	
	// Some util
	
	function inworld(pos) { 
			return pos.x >= 0 && pos.x < Wwidth && pos.y >= 0 && pos.y < Wheight; 
	}
	

	function getTile_(pos){
		if (inworld(pos)){
			return world[pos.x][pos.y];
		}
		return false;
	}
	
	function getTile(x,y){
		if (!y && y!=0)
			return getTile_(x);
		return getTile_(newpos(x,y));
	}
	
	function socketemit(name,data){	
		data.type=name;
		if(!imhost){
			conn.send(data);
		} else {
			if (gamestarted && clients[hostid].playing){
				for (var i=0;i<peercallbacksgame.length;i+=1){
					var d = peercallbacksgame[i];
					if (data.type==d.type){
						d.callback({peer:hostid},data);
						return;
					}
				}
			}
			//chat and things
			for (var i=0;i<peercallbacksother.length;i+=1){
				var d = peercallbacksother[i];
				if (data.type==d.type){
					d.callback({peer:hostid},data);
					break;
				}
			}
		}
	}


	// window.onbeforeunload
	
	window.onbeforeunload = function () {
		for (var i=0;i<=9;i+=1){	//save hotkeys in cookies
			setCookie(i,hotkeys[i] || 0);
		}
		if (imhost){
			socket.emit('leaving');
		} else {
			conn.send('leaving');
		}
	};
	
	// window.onload
	
	window.onload = function () {
		var alerter;	//= setupAlert()
		canvas = document.getElementById("MyCanvas");
		ctx = canvas.getContext("2d");
		canvasposition = canvas.getBoundingClientRect();
		var getElem_ = document.getElementById.bind(document);
		getElem = function (id){
			var ret = getCoor(id) || getCoorNumbers(id) || getCoorEffects(id) || getCoorCreatures(id) || getCoorGrayscale(id) || getElem_(id);
			if (!ret)
				throw("getElem: invalid id " + id);
			return ret;
		}
		imglist = [getElem("grass"),		//a 1->1 correspondence between imgid and itemid
					getElem("pix"),	//1
					getElem("tree"),	//2
					getElem("sword"),	//3
					getElem("bow"),		//4
					getElem("arrow"),	//5
					getElem("fireballrune"),	//6
					getElem("magicwallrune"),	//7
					[getElem("magicwall1"), getElem("magicwall2"), getElem("magicwall3")],	//getElem("magicwall"),		//8	//
					getElem("lifepotion"),		//9
					getElem("invispotion"),		//10
					getElem("hastepotion"),		//11
					getElem("fruitytree"),		//12
					getElem("apple"),			//13
					getElem("stonewall"),		//14
					getElem("door"),			//15
					false,	//getElem("opendoor"),		//16
					getElem("water"),			//17
					getElem("redPlayer"),		//18
					getElem("bluePlayer"),		//19
					getElem("bush"),			//20
					/*getElem("grass_"),	*/[getElem("grass1"), getElem("grass2"), getElem("grass3"), getElem("grass4")],	//21	//getElem("grass2"),			//21
					/*getElem("besttree"),*/getElem("firtree"),			//22
					getElem("branch"),			//23
					//getElem("snow"),			//24
					getElem("snow1"),			//24
					getElem("snowyfirtree"),	//25
					getElem("snowydeadtree_twisted"),	//26
					getElem("snowydeadtree_halfalive"),	//27
					//getElem("sand"),	28
					[getElem("sand1"),getElem("sand2"),getElem("sand3"),getElem("sand4"),getElem("sand5"),getElem("sand6"),getElem("sand7"),getElem("sand8"),
						getElem("sand9"),getElem("sand10"),getElem("sand11"),getElem("sand12"),getElem("sand13"),getElem("sand14"),getElem("sand15"),getElem("sand16")],	//28
					getElem("palmtree"),		//29
					getElem("cactus_thick"),	//30
					getElem("cactus_sharp"),	//31
					getElem("greenPlayer"),	//32
					getElem("dragon"),			//33
					getElem("dummy"),			//34
					/*getElem("besttree"),*/getElem("tree"),			//35
					[getElem("redPlayer_aura"), getElem("redPlayer")],	//36
					[getElem("bluePlayer_aura"), getElem("bluePlayer")],	//37
					[getElem("greenPlayer_aura"), getElem("greenPlayer")],//38
					getElem("ice"),				//39
					getElem("intensehealingrune"),		//40
					getElem("leatherarmor"),	//41
					getElem("leatherlegs"),		//42
					getElem("leatherhelmet"),	//43
					getElem("leatherboots"),	//44
					[getElem("magicdust2"), getElem("magicdust3"), getElem("magicdust4")],		//45
					getElem("poisonfieldrune"),	//46
					[getElem("poisongas0"), getElem("poisongas1"), getElem("poisongas2"), getElem("poisongas3")],		//47
					//[getElem("void1"), getElem("void2"), getElem("void3"), getElem("void4"),getElem("void5"), getElem("void6"), getElem("void7"), getElem("void8"),
					 		//getElem("void9"), getElem("void10"), getElem("void11"), getElem("void12"),getElem("void13"), getElem("void14"), getElem("void15"), getElem("void16")]		//48
					false,	//48
					getElem("lever"),
					getElem("lever_pulled")
				];
					
		setaleft = document.getElementById("setaleft");
		setaright = document.getElementById("setaright");
		setaup = document.getElementById("setaup");
		setadown = document.getElementById("setadown");
					
		distanimationlist = [getElem("sword"), 	//for dist effects
							 [getElem("arrow_north"), getElem("arrow_east"), getElem("arrow_south"), getElem("arrow_west"), getElem("arrow_southwest"), getElem("arrow_southeast"), getElem("arrow_northwest"), getElem("arrow_northeast")],
							 getElem("frozenstar"),
							 [getElem("fireball_north"), getElem("fireball_east"), getElem("fireball_south"), getElem("fireball_west"), getElem("fireball_southwest"), getElem("fireball_southeast"), getElem("fireball_northwest"), getElem("fireball_northeast")],
							 [getElem("poisonspit_north"), getElem("poisonspit_east"), getElem("poisonspit_south"), getElem("poisonspit_west"), getElem("poisonspit_southwest"), getElem("poisonspit_southeast"), getElem("poisonspit_northwest"), getElem("poisonspit_northeast")]
							];
							 
		magicanimationlist = [false,//getElem("critical"),
							   [getElem("firehit1"), getElem("firehit2"), getElem("firehit3"), getElem("firehit4"), getElem("firehit5")],
							   [getElem("drawblood1"), getElem("drawblood2"), getElem("drawblood3"), getElem("drawblood4")],
							   [getElem("poff1"), getElem("poff2"), getElem("poff3"), getElem("poff4")],
							   [getElem("magicdust1"), getElem("magicdust2"), getElem("magicdust3"), getElem("magicdust4")],
							   [getElem("splash1"), getElem("splash2"), getElem("splash3"), getElem("splash4")],
							   [getElem("blocktest1"), getElem("blocktest2"), getElem("blocktest3")],
							   [getElem("energy1"), getElem("energy2"), getElem("energy3"), getElem("energy4"), getElem("energy5"), getElem("energy6"), getElem("energy7"), getElem("energy8")],
							   [getElem("poisonhit1"), getElem("poisonhit2"), getElem("poisonhit3"), getElem("poisonhit4"), getElem("poisonhit5"), getElem("poisonhit6"), getElem("poisonhit7")]
							  ];
							   
	   numberlist = [getElem("n0"),
							getElem("n1"),
							getElem("n2"),
							getElem("n3"),
							getElem("n4"),
							getElem("n5"),
							getElem("n6"),
							getElem("n7"),
							getElem("n8"),
							getElem("n9"),
							getElem("n10")];
					
		emptyeqimgs = [[],[],[]];
		emptyeqimgs[0][1]=getElem("grayscale_hand_left");
		emptyeqimgs[2][1]=getElem("grayscale_hand_right");
		emptyeqimgs[2][2]=getElem("grayscale_arrow");
		emptyeqimgs[1][0]=getElem("grayscale_helmet");
		emptyeqimgs[1][1]=getElem("grayscale_armor");
		emptyeqimgs[1][2]=getElem("grayscale_legs");
		emptyeqimgs[1][3]=getElem("grayscale_boots");
		
		itemoffset=[];
		itemoffset[16]={x:0,y:-12};	//open door
		
		runes = {6:true,7:true,40:true};
		
		invimg = document.getElementById("inventory");
		
		
		//move below to start of file (variable declarations)
		inventory = {equips:[],items:[]};
		for (var x=0;x<8;x++){inventory.items.push([]);}
		
		loadHotkeysFromCookies();

		
		drawingLoading = false;		//end Loading, start Connecting
		if (url(document.referrer)!=window.location.host)	//change this; js var keeping track??
			drawingNicknamePrompt = true;
		else {
			setTimeout(function () { onNick(getCookie("name")); }, 0);
		}

	};	
	
	
	//socket = io.connect('http://'+window.location.host+'/main', {'sync disconnect on unload': true });	//called in play.html
	
	//move callbacks to outside window.onload
	
	// Socket.io
		
	socket.on('title', function (title){
						document.title = title + ' - TileBattle';
						roomTitle = title;
						alerter = setupAlert();
	});
	
	socket.on('hostid', function (data){
							hostid = data.id;
							console.log("hostid is "+hostid);
							if (hostid!=myid){
								console.log(data.serveraddress);
								conn = (!data.server) ? peer.connect(hostid) : socket; //io.connect(data.serveraddress, {'sync disconnect on unload': true });	//data.id is namespace
								if (data.server){
									conn.send = function (data) {
										//conn.emit('data', data);
										socket.emit('data', data); //para hostapp tratar
									}
								}
								
								drawingConnectingSignaling = false;
								drawingConnectingHost = true;
								
								if (!data.server){
									conn.on(/*!data.server ?*/ 'open' /*: 'connect'*/, function(){
										console.log(peer);
										console.log(conn);
									  console.log('sending');
									  conn.send({type:'name',name:name_,id:myid});//envia name
									  //syncToHost();
									});
								} else {
								    conn.send({type:'name',name:name_,id:myid});//envia name
								}
								conn.on('data', function(data){
									for (var i=0;i<hostcallbacks.length;i+=1){
										var d=hostcallbacks[i];
										if (data.type==d.type){
											d.callback(data);
											return;
										}
									}
								});
								//conn.on('close', function () {alert("Disconnected");});
								//setuppeer();	//now the host also predicts movement! world != imagegrid from now on
							} else {
								imhost = true;
								clients[hostid]={peerid:hostid,playing:false,host:true};
								//setuphost();
								console.log("You host!");
								appendText("* You host!",'',CHATONLY);
								connected();
							}
						
	});
	
	socket.on('servermessage', function (data) {
		appendText(data, "", CHATONLY);
	});
	
	socket.on('newnickname', function (data) {
		id_names[data.id].name = data.nick;
		updateNames();
		if (data.id == myid){
			name_ = data.nick;
			//document.cookie = "name="+name_+"; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";
			setCookie("name", name_);
		}
	});
	
	socket.on('host left', function () { appendText("The host disconnected."); hostleft = true;});

	socket.on('room is full', function () {
		alert("The room is full.");
	});
	
	
	// Peer
	
	function makePeerHeartbeater ( peer ) {
		var timeoutId = 0;
		function heartbeat () {
			timeoutId = setTimeout( heartbeat, 20000 );
			if ( peer.socket._wsOpen() ) {
				peer.socket.send( {type:'HEARTBEAT'} );
			}
		}
		// Start 
		heartbeat();
		// return
		return {
			start : function () {
				if ( timeoutId === 0 ) { heartbeat(); }
			},
			stop : function () {
				clearTimeout( timeoutId );
				timeoutId = 0;
			}
		};
	}
		
	function connectToBroker () {
		if (isOffline){
			myid = genPredId(20);
			id_names[myid] = {id:myid, name:name_, team:0};
			socket.emit('start', {id:myid, name:name_, room:roomname});
			drawingConnectingBroker = false;
			if (!imhost)	//if I am in fact host then this won't work, because no broker 	//this is for debugging on static rooms
				drawingConnectingSignaling = true;
			return;
		}

		peer = new Peer(genPredId(20), {host: true ? window.location.hostname : 'tilebattlebroker.herokuapp.com', port: (true ? window.location.port : 80), path: '/myapp', 
										config: {'iceServers': [
												{ url: 'stun:stun.l.google.com:19302' }]}
										});
		
		var heartbeater = makePeerHeartbeater( peer );

		//Current Fix:
		var last_id = null;
		var reconnected = false;
		
		peer.on('open', function(id) {
			//Current Fix:
			if (id == null){
				peer.id = last_id;
			} else {
				last_id = id;
			}
			
			console.log('My peer ID is: ' + id);
			if (!reconnected){
				myid = id;
				id_names[id]={id:id,name:name_,team:0};
				socket.emit('start',{id:myid,name:name_,room:roomname});
				drawingConnectingBroker = false;
				if (!imhost)
					drawingConnectingSignaling = true;
			}
			
		});
							
		peer.on('connection', function(conn) {
					if (imhost){
						console.log("connection");
						conns.push(conn);
						//sendallinputs(conn);
						conn.on('open', function () {
							syncToPeer(conn);
						});
						var client = clients[conn.peer] = {conn:conn,peerid:conn.peer,playing:false};
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
							// move these \/ to peercallbacksother
							if (data=="leaving"){
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
								id_names[conn.peer]={id:conn.peer,name:data.name,team:0};
								data.id = conn.peer;
								data.team = 0;
								//broadcast
								conns.forEach(function(conn2) { if(conn2!=conn) conn2.send(data); });
								conn.send({type:'names',names:id_names});
								updateNames();
								if (gamestarted){
									conn.send({type:"world",world:imagegrid});
								}
								appendText("* "+data.name+" has joined the room");
								sendallinputs(conn);
								alerter();
							} else if (data.type=="chat"){
								if (data.message.length > MSGLENLIMIT) data.message = data.message.substring(0,MSGLENLIMIT);
								data.id = conn.peer;
								var nome = id_names[data.id] ? id_names[data.id].name : "no_name_error";
								//appendText(data.message, nome);
								broadcast('chat', data, conn);
							}
						});
					}
		});
							
		peer.on('disconnected', function() {
			//alert("disconnected from the signalling server");
			//Current Fix:
			peer.id = last_id;
			peer._lastServerId = last_id;
			console.log("reconnecting:",peer.id, peer._lastServerId);
			peer.reconnect();
			reconnected = true;
		});
		
		peer.on('error', function(err) {
			console.log("error: "+err.toString());
			if(err.type!='disconnected' && err.type!='network'){//FATAL
				alert("error: "+err.toString());
			}
		});	
	}
