// This is content_modes
// To do: distribute modes into files at /../modes/ and create a builder to join them into this one
// Do the same for a content_npcs and a content_maps and a content_spells
// Make it modular!!

// Properties: name, id, detectWin (callback for hostapp.js's detectWin), map (reference? or ...), onPlayerDeath (decides respawn, etc), 
// Map: might be generator, hard data or id .. for now it's like this ..


// map creation

// define 

	//map grass
 var grass = 0;
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



function createGrassMap(width,height){
	var grid = make2dArray(width,height,function () { return [createItem(0,1)];});
	//5% trees
	for (var k=0;k<width*height/20;k+=1){
		var pos = newpos(R(width),R(height));
		var tile = grid[pos.x][pos.y];
		if(tile.length==1){
			if(R(5)<4)
				tile.push(createItem(tree,1));
		}
	}
	return grid;
}

function createForestMap(width, height){
	var grid = make2dArray(width, height, function () { return [createItem(grass,1)]; });
	//10% trees/10	//40% trees/2.5
	for (var k=0; k < width*height/10; k+=1){
		var pos = newpos(R(width), R(height));
		var tile = grid[pos.x][pos.y];
		if(tile.length == 1){	//only grass
			if(R(2) < 1)
				tile.push(createItem(firtree, 1));
			else	
				tile.push(createItem(tree, 1));
		}
	}

	return grid;
}

function createWallsAround(grid){
	for (var x = 0; x< grid.length; x++){

	}
}


function createSnowMap(width, height){
	var grid = make2dArray(width,height,function () { return [createItem(snow,1)];});
	//lakes
	//50% of map
	var lagos = false;
	if (lagos){
		var lakes = R(5)+1;
		var partes_iguais = Math.floor(width*height*0.5/lakes);
		var lake_width = Math.floor(Math.sqrt(partes_iguais));
		var lake_height = Math.floor(partes_iguais/lake_width);
		for (var k=0;k<lakes;k++){
			var pos = newpos(R(width-lake_width),R(height-lake_height));
			for (var x=0;x<lake_width && pos.x+x<width;x++)
			for (var y=0;y<lake_height && pos.y+y<height;y++){
				var tile = grid[pos.x][pos.y];
				tile[0]=createItem(ice,1);
			}
		}
	}
	
	//3% trees
	for (var k=0;k<width*height/33;k+=1){
		var pos = newpos(R(width),R(height));
		var tile = grid[pos.x][pos.y];
		if(tile.length==1 && getImgid(tile[0]) == snow){	//only snow
			if(R(3)<2)
				tile.push(createItem(snowy_fir_tree,1));
			else {
				if (R(2)<1)
					tile.push(createItem(snowy_dead_tree_twisted,1));
				else
					tile.push(createItem(snowy_dead_tree_halfalive,1));
				
			}
		}
	}
	return grid;
}

function createDesertMap(width, height){
	grid = make2dArray(width,height,function () { return [createItem(sand,1)];});
	//2.5% trees
	for (var k=0; k < width*height/40; k+=1){
		var pos = newpos(R(width), R(height));
		var tile = grid[pos.x][pos.y];
		if(tile.length==1){	//only sand
			if(R(2)<1)
				tile.push(createItem(palm_tree,1));
			else {
				//if (R(2)<1)
					tile.push(createItem(cactus_thick,1));
				//else
				//	tile.push(createItem(cactus_sharp,1));
			}
		}
	}
	for (var k=0;k<width*height/100;k+=1){ //small plants
		//
	}
	return grid;
}

// var maps = [{name:"Forest", type:"generator", generator: createForestMap},...]; at content_maps
mapCreators = [createForestMap, createSnowMap, createDesertMap];		


	var result = ["DRAW", "RED SCORES", "BLUE SCORES"];
	var resultend = ["DRAW", "RED WINS", "BLUE WINS"];
	var resultc = ['white', 'red', 'blue'];



var modes = [

	 {name: "Team Versus", id: 0, 
		start_config: function (options) {	// called each new round or each startgame? which have more than 1 round? team versus was the only one but not anymore
									// so it doesn't matter, call it in startgame, if necessary create a start_round_config later...
			this.state.gameover = false;
			this.state.options = options;
		},
		onStartup: function () {
			//walls and doors around spawn
			//spawnred = {x:9,y:25}, spawnblue={x:?,y:25}

			LX=4;RX=8;LY=22;RY=26;MY=24

			for (var ax=LX; ax<= RX; ax++){
				for (var ay=LY; ay<=RY; ay++){
					if ((ax==LX || ax==RX || ay==LY || ay == RY) && !(ax==RX && ay==MY)){
						getTileH(ax, ay).push(createItem(14, 1));
					} else if (ax==RX && ay==MY){
						getTileH(ax, ay).push(createItem(15, 1));
					}
				}
			}

  LX=41;RX=45;LY=22;RY=26;MY=24

			for (var ax=LX; ax<= RX; ax++){
				for (var ay=LY; ay<=RY; ay++){
					if ((ax==LX || ax==RX || ay==LY || ay == RY) && !(ax==LX && ay==MY)){
						getTileH(ax, ay).push(createItem(14, 1));
					} else if (ax==LX && ay==MY){
						getTileH(ax, ay).push(createItem(15, 1));
					}
				}
			}

		},
		map: function () { 
			return mapCreators[this.state.options.map_selected]; 	//the standard map
		},
		onPlayerDeath: function (player, score) {
			// Nothing, no respawn // maybe score++ ? frags should be standardized, no changing
			var res = (player.team == RED) ? BLUE : RED;
			score[res]++;
			refreshScore();
		},
		detectWin: function (creatures, frags, score) {
			if (!this.state.gameover){
				var players = creatures.filter(function (t) { return !t.npc;});
				var reds = players.filter(function (t) { return t.team == RED; });
				var blues = players.filter(function (t) { return t.team == BLUE; });
				if (reds.length == 0 || blues.length == 0) {	//match ended
					// no new round, no map change, no nothing
					var res = reds.length > blues.length ? RED : BLUE;
					timer_locked = true;	//locks the time counter
					broadcast('countdown', {value:resultend[res], color:resultc[res]});
					broadcast('statusmessage', {text:resultend[res] + " (" + score[RED] + "x" + score[BLUE] + ")", which:false});
					schedule = []; 
					schedulecount = 0;
					addschedule(stopgame, 10);
					this.state.gameover = true;
				}
			}
		},
		config: {},	//immutable
		state: {gameover:false}	//aux	//mutable
	}, 

	{name: "Team Deathmatch", id: 1, 
		start_config: function (options) {
			this.state.gameover = false;
			this.state.options = options;
		}, 
		onStartup: function () {
			//walls and doors around spawn
			//spawnred = {x:9,y:25}, spawnblue={x:?,y:25}
  //Assuming 50x50 map.

			LX=4;RX=8;LY=22;RY=26;MY=24

			for (var ax=LX; ax<= RX; ax++){
				for (var ay=LY; ay<=RY; ay++){
					if ((ax==LX || ax==RX || ay==LY || ay == RY) && !(ax==RX && ay==MY)){
						getTileH(ax, ay).push(createItem(14, 1));
					} else if (ax==RX && ay==MY){
						getTileH(ax, ay).push(createItem(15, 1));
					}
				}
			}

  LX=43;RX=47;LY=22;RY=26;MY=24

			for (var ax=LX; ax<= RX; ax++){
				for (var ay=LY; ay<=RY; ay++){
					if ((ax==LX || ax==RX || ay==LY || ay == RY) && !(ax==LX && ay==MY)){
						getTileH(ax, ay).push(createItem(14, 1));
					} else if (ax==LX && ay==MY){
						getTileH(ax, ay).push(createItem(15, 1));
					}
				}
			}
		},
		map: function () { 
			return mapCreators[this.state.options.map_selected]; 	//the standard map
		},
		onPlayerDeath: function (player, score) {
			setRespawnInterval(player);		//change later: -- set the spawn pos, etc
			var res = (player.team == RED) ? BLUE : RED;
			score[res]++;
			refreshScore();
		},
		detectWin: function (creatures, frags, score) {
			if (!this.state.gameover){
				var res = score[RED] > score [BLUE] ? RED : BLUE;
				if (score[res] < this.state.options.scorelimit) {
					//
				} else {	//>=scorelimit, match ended
					timer_locked = true;	//locks the time counter
					broadcast('countdown', {value:resultend[res], color:resultc[res]});
					broadcast('statusmessage', {text:resultend[res] + " (" + score[RED] + "x" + score[BLUE] + ")", which:false});
					schedule = []; 
					schedulecount = 0;	//<<= (no node) não altera o schedulecount do hostapp ! // método clearSchedules ?
					addschedule(stopgame, 10);
					this.state.gameover = true;
				}
			}
		},
		config: {},	//immutable
		state: {gameover:false}	//aux	//mutable
	},

	 {name: "Free For All", id: 2, 
		start_config: function (options) {
			this.state.gameover = false;
			this.state.options = options;
		}, 
		onStartup: function (grid) {
			//
		},
		map: function () { 
			return mapCreators[this.state.options.map_selected]; 	//the standard map
		},
		onPlayerDeath: function (player, score) {
			setRespawnInterval(player);		//change later: -- set the spawn pos, etc	//frags already change in ha.js by definition
		},
		detectWin: function (creatures, frags, score) {
			if (!this.state.gameover){
				for (peerid in frags){
					if (frags[peerid].kills >= this.state.options.scorelimit){
						broadcast('countdown', {value:id_names[peerid].name+' Wins', color:'white'});
						broadcast('statusmessage', {text:"* "+id_names[peerid].name+' Wins! ('+frags[peerid].kills+' kills - '+frags[peerid].deaths+' deaths)', which:false});	//both game and chat
						schedule = []; 
						schedulecount = 0;
						addschedule(stopgame, 10);
						this.state.gameover = true;
						return;
					}
				}
			}
		},
		config: {free_for_all:true},	//immutable
		state: {gameover:false}	//aux	//mutable
	}, 

	{name:"PvE Demo", id: 3, 
		start_config: function (options) {
			this.state.gameover = false;
			this.state.options = options;
		}, 
		onStartup: function (grid) {
			//minimal things like npc placement //npcs are a separate thing from the map since their purpose would vary from mode to mode
			//this is before players are placed	//to alter players use onPlayerSpawn
			//to set their placement... define spawn pos (?)
			//map is loaded before players... set a function in config that chooses the player's spawn pos based on team and map dimensions
			var x = Math.floor(grid.length/2);
			var y = Math.floor(grid[0].length/2);
			//var dragon = createCreature(newpos(x,y), 100, monsterByName['dragon'], true);
			//createUniqueItem -> onUse (ground use) summon random monster around pos || a lever to be pulled || regular lever onUse change itemid in itemtypesH

			//walls and doors around spawn
			//spawnred = {x:9,y:25}, spawnblue={x:?,y:25}

			LX=4;RX=8;LY=12;RY=16;MY=14

			for (var ax=LX; ax<= RX; ax++){
				for (var ay=LY; ay<=RY; ay++){
					if ((ax==LX || ax==RX || ay==LY || ay == RY) && !(ax==RX && ay==MY)){
						getTileH(ax, ay).push(createItem(14, 1));
					} else if (ax==RX && ay==MY){
						getTileH(ax, ay).push(createItem(15, 1));
					}
				}
			}



			var lever = createItem(49,1);

			getTileH(x,y).push(lever);	//common lever, provisory
			lever.onUse = function (c, self, pos) { 
				if (self[0]==49)	//only on unpulled
					var dragon = createNpc("dragon", newpos(x,y+1));
					if (dragon){
						magiceffectsH.push({id:energy, pos:dragon.pos});
					}
			};
		},
		map: function () {
			return function (width, height) {
				return make2dArray(width,height,function () { return [createItem(grass2,1)];});	//for now
			}
		},
		onPlayerSpawn: function (player, score) {
			//called in newRound after player spawn. Gives starting inventory, etc.
		},
		onPlayerDeath: function (player, score) {
			// where to respawn?
			setRespawnInterval(player);		//change later: -- set the spawn pos, etc
		},
		detectWin: function (creatures, frags, score) {
			//nothing, never happens
		},
		config: {},
		state: {gameover:false}
	} 
	
];


if (typeof exports != "undefined"){
	global.modes = modes;
}
