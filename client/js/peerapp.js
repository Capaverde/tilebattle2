//remake this
//remove setuppeer,
//remove useless functions (playerusemap, playeruse, etc)
//walking only!

//function setuppeer(){
	
	predictions = {};
	
	predict = function (name, data, pid) {
		var cb=predictcallbacks[name];
		if (cb){
			var c = topItem(world[playerpos.x][playerpos.y]);
			if (pid)
				predictions[pid] = {name:name, pos:playerpos, data:data};	//I should add a prediction timeout, just to clean the table...
			/*c.pos = playerpos;
			c.invisible = invisible;
			c.inventory = inventory;*/
			var expected = cb(data);
			playerpos = c.pos;
			return expected;
		}
	}

	predictcallbacks = {};

	function predicton(name, callback){
		predictcallbacks[name] = callback;
	}
	
	predicton('move', function (msg) {
		var c = topItem(world[playerpos.x][playerpos.y]);
		if (hp <= 0)
			return; 
		var dir = msg.dir;
		return moveByDirP(c, dir);
	});
				

	//
	//prediction!!
	//everything is an itemimage.

	
	//item things, only what is needed
	
	function itemitypeP(i){	//i is just the image
		return itemtypes[i];
	}
	
	
	//movement
	function getTile(x, y){
		try {
			return world[x][y];
		} catch(e) {
			return false;
		}
	}
	
	function newpos(x, y){
		return {x:x, y:y};
	}

	
NORTH = 0
EAST = 1
SOUTH = 2
WEST = 3
SOUTHWEST = 4
SOUTHEAST = 5
NORTHWEST = 6
NORTHEAST = 7
	
	var directions = [newpos(0, -1), newpos(1, 0), newpos(0, 1), newpos(-1, 0), newpos(-1, 1), newpos(1, 1), newpos(-1, -1), newpos(1, -1)];
	
	deltapos = function deltapos (pos, dir) { 
		var dp = directions[dir]; 
		return newpos(pos.x + dp.x, pos.y + dp.y);
	}
	
	function inworld(pos) { 
		return pos.x >= 0 && pos.x < world.length && pos.y >= 0 && pos.y < world[0].length; 
	}
	
	function moveByDirP(c, dir) {
		if (!c.pos){
			console.log(c);
			return;
		}
		c.frompos = {x:c.pos.x, y:c.pos.y};
		c.dir = dir;
		var r = moveCreatureP(c, deltapos(c.pos, dir));
		if (r) {
			c.walkstart = getTime();
			c.walking = true;
		}
		return r;
	}
	
	function topItem(tile) { 
		return tile[tile.length-1];
	}
	
	function isblockingP(item){
		if (item.creature) 
			return true;
		return itemitypeP(item).blocking;
	}
	
	function moveCreatureP(c, topos){
		if(!inworld(topos))
			return false;
		var h = hash(pos_to_string(topos), invis_pass);
		if (invis_hashes[invis_pass][hash(pos_to_string(topos), invis_pass)]){ 	//tries to walk into an invisible player
			console.log("false"); 
			return false; 
		}
		var fromtile = getTile(c.pos.x, c.pos.y);
		var totile = getTile(topos.x, topos.y);
		if (totile && !isblockingP(topItem(totile))){
			if (!c.invisible){
				totile.push(fromtile.pop());
			} else {
				totile.push(fromtile.pop());
				//
			}
			c.pos = topos;
			return true;	//worked
		}
		return false;
	}
	
//}