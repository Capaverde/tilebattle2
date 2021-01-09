//popup asking resolution
//map = array of empty arrays, wxh
//palette, items loaded from items.js
//savemap function, aka export, into map.json

function make2dArray(w, h, callback) {
	var v = [];
	for (var x = 0; x < w; x++) {
		v[x] = [];
		for (var y = 0; y < h; y++) {
			v[x][y] = callback ? callback(x,y) : 0;
		}
	}
	return v;
}

var map = make2dArray(50, 50, function () { return [ [0,1] ];} );

	var itemtypes = [	{id:0, blocking: false, movable: false, stackable: false, imgid: 0},	//grass
						{id:1, blocking: true, movable: false, stackable: false, imgid: 1, creature: true},	//creature //just for filling purposes
						{id:2, blocking: true, movable: false, stackable: false, imgid: 2,pathblocking: true, hp: 200},	//tree
						{id:3, blocking: false, movable: true, stackable: false, imgid: 3, usewith: true, range: 2, animationid: 0, critical: 0.10, mult: 2,type: "slashing"},	//sword
						{id:4, blocking: false, movable: true, stackable: false, imgid: 4, usewith: true, range: 9, animationid: 1, ammo: 5, critical: 0.05, mult: 3, type: "piercing"},		//bow
						{id:5, blocking: false, movable: true, stackable: true, imgid: 5, usewith: false},		//arrow	
						{id:6, blocking: false, movable: true, stackable: true, imgid: 6, usewith: true, range: 9, animationid: 3, removeonuse: true},	//fireball rune
						{id:7, blocking: false, movable: true, stackable: true, imgid: 7, usewith: true, range: 9, removeonuse: true, ignorecreaturesinthepath: true},	//magic wall rune
						{id:8, blocking: true, movable: false, stackable: false, imgid: 8, pathblocking: true},	//magic wall
						{id:9, blocking: false, movable: true, stackable: true, imgid: 9, usewith: false, use: true, removeonuse: true},	//life potion
						{id:10, blocking: false, movable: true, stackable: true, imgid: 10, usewith: false, use: true, removeonuse: true},	//invisibility potion
						{id:11, blocking: false, movable: true, stackable: true, imgid: 11, usewith: false, use: true, removeonuse: true},  //haste potion
						{id:12, blocking: true, movable: false, stackable: false, imgid: 12, pathblocking: true, usemap: true},	//fruity tree
						{id:13, blocking: false, movable: true, stackable: true, imgid: 13, usewith: false, use: true}, //,effect:makeEffectFeed(50),removeonuse: true},	//apple
						{id:14, blocking: true, movable: false, stackable: false, imgid: 14, pathblocking: true}, //,hp:400,drop:dropStoneWall,pillar:true},	//stone wall
						{id:15, blocking: true, movable: false, stackable: false, imgid: 15, pathblocking: true}, //, usemap:true,effect:effectOpenDoor,hp:200},	//closed door
						{id:16, blocking: false, movable: false, stackable: false, imgid: 16},	//open door
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
						{id:40, blocking:false, movable: true, stackable: true, imgid: 40, usewith: true, range: 9, removeonuse: true},	//healing rune
						{id:41, blocking:false, movable: true, stackable: false, imgid: 41, armor: 4},	//leather armor
						{id:42, blocking:false, movable: true, stackable: false, imgid: 42, armor: 1},	//leather legs
						{id:43, blocking:false, movable: true, stackable: false, imgid: 43, armor: 1},	//leather helmet
						{id:44, blocking:false, movable: true, stackable: false, imgid: 44, armor: 1},	//leather boots
						{id:45, blocking:true, movable: false, stackable: false, imgid: 45, creature: true},			//magic dust creature
						{id:46, blocking:false, movable: true, stackable: true, imgid: 46, usewith:true, range:9, removeonuse: true},		//poison field rune
						{id:47, blocking:false, movable: false, stackable: false, imgid: 47, field: 'poison'},	//poison gas
						{id:48, blocking:true, movable: false, stackable: false, imgid: 48},	//void
						{id:49, blocking:true, movable:false, stackable:false, imgid:49},	//lever	//onUse:..change imgid //uniqueOnUse at createUniqueItem
						{id:50, blocking:true, movable:false, stackable:false, imgid:50}	//pulled lever
					];



var mycanvas = document.getElementById("canvas");
var ctx = mycanvas.getContext("2d");



image_id_url_ts = [		//all these are 32x32
	["grass", "./sprites/grass.png"],
	//img id="tree", "/tree.png" style="display:none" /-->
	["sword", "./sprites/sword.png"],
	["bow", "./sprites/bow.png"],
	["arrow", "./sprites/arrow.png"],
	["fireballrune", "./sprites/fireballrune.png"],
	["magicwallrune", "./sprites/magicwallrune.png"],
	["magicwall", "./sprites/magicwall.png"],
	["magicwall1", "./sprites/magicwall1.png"],
	["magicwall2", "./sprites/magicwall2.png"],
	["magicwall3", "./sprites/magicwall3.png"],
	["lifepotion", "./sprites/lifepotion.png"],
	["invispotion", "./sprites/lifebluepotion.png"],
	["hastepotion", "./sprites/lifegreenpotion.png"],
	["fruitytree", "./sprites/fruitytree.png"],
	["apple", "./sprites/apple.png"],
	["stonewall", "./sprites/stonewall.png"],
	["door", "./sprites/door.png"],
	//["opendoor", "./sprites/opendoor.png"],	//except this one, but I'll replace it
	["water", "./sprites/water.png"],
	
	["bush", "./sprites/bush.png"], 
	["intensehealingrune", "./sprites/healingrune.png"],
	["poisonfieldrune", "./sprites/poisonfieldrune.png"],
	["poisongas0", "./sprites/poisongas0.png"],
	["poisongas1", "./sprites/poisongas1.png"],
	["poisongas2", "./sprites/poisongas2.png"],
	["poisongas3", "./sprites/poisongas3.png"],

	["lever", "./sprites/Lever.png"],
	["lever_pulled","./sprites/Lever2.png"],

	//

	// equips -->
	["leatherarmor", "./sprites/46.png"],
	["leatherlegs", "./sprites/47.png"],
	["leatherhelmet", "./sprites/48.png"],
	["leatherboots", "./sprites/49.png"],
	
	// map -->
	
	["grass_", "./sprites/grass_.png"], 
	["grass0", "./sprites/grass0.png"], 
	["grass1", "./sprites/grass1.png"], 
	["grass2", "./sprites/grass2.png"], 
	["grass3", "./sprites/grass3.png"], 
	["grass4", "./sprites/grass4.png"], 
	//img id="firtree", "/Fir_Tree32.png" style="display:none" /--> 
	["branch", "./sprites/branch.png"], 
	["firtree", "./sprites/forest_pine_sombra.png"], //trees/fir-tree.png"],	//
	["tree", "./sprites/forest_arvore_sombra.png"], //trees/oak-tree.png"],	//
	["besttree", "./sprites/trees/besttree.png"], //trees/oak-tree.png"],	//

	["snow", "./sprites/snow.png"], //old
	["snow1", "./sprites/18037.png"],
	["snowyfirtree", "./sprites/snowyfirtree.png"],
	["snowydeadtree_twisted", "./sprites/snowydeadtree_twisted.png"],
	["snowydeadtree_halfalive", "./sprites/snowydeadtree_halfalive.png"],
	["ice", "./sprites/Ice_Tile.png"], 

	["sand", "./sprites/sand.png"], 
	["sand1", "./sprites/4790.png"],
	["sand2", "./sprites/4791.png"],
	["sand3", "./sprites/4792.png"],
	["sand4", "./sprites/4793.png"],
	["sand5", "./sprites/4794.png"],
	["sand6", "./sprites/4795.png"],
	["sand7", "./sprites/4796.png"],
	["sand8", "./sprites/4797.png"],
	["sand9", "./sprites/4798.png"],
	["sand10", "./sprites/4799.png"],
	["sand11", "./sprites/4800.png"],
	["sand12", "./sprites/4801.png"],
	["sand13", "./sprites/4802.png"],
	["sand14", "./sprites/4803.png"],
	["sand15", "./sprites/4804.png"],
	["sand16", "./sprites/4805.png"],
	["palmtree", "./sprites/palmtree.png"],
	["cactus_thick", "./sprites/cactus_thick.png"],
	["cactus_sharp", "./sprites/cactus_sharp.png"],

];

image_id_url_creatures = [
	["pix", "./sprites/pix.png"], 

	["red", "./sprites/red.png"], 
	["blue", "./sprites/blue.png"], 
	["green", "./sprites/green.png"], 

	["redPlayer", "./sprites/Red_Player.png"], 
	["bluePlayer", "./sprites/Blue_Player.png"],
	["greenPlayer", "./sprites/Green_Player.png"],
	["redPlayer_aura", "./sprites/Red_Player_aura.png"], 
	["bluePlayer_aura", "./sprites/Blue_Player_aura.png"],
	["greenPlayer_aura", "./sprites/Green_Player_aura.png"],

	["dragon", "./sprites/dragon.png"], 
	["dummy", "./sprites/Dummy.png"]

];


var tileset = new Image();
tileset.src = "./tileset.png";
//tileset.style.display = "none";
//document.body.appendChild(tileset);

var tscreatures = new Image();
tscreatures.src = "./creatures.png";
//tscreatures.style.display = "none";
//document.body.appendChild(tscreatures);

var tileset_coor = {};

for (var i = 0; i < image_id_url_ts.length; i++){ 
		var id = image_id_url_ts[i][0];
		tileset_coor[id] = {x:(i%10)*32, y:32*(i-(i%10))/10, coor:true};
}

function getCoor(id){
	if (tileset_coor[id])
		return {x:tileset_coor[id].x, y:tileset_coor[id].y, width:32, height:32, tileset:tileset, coor:true};
}



var creatures_coor = {};

for (var i = 0; i < image_id_url_creatures.length; i++){ 
		var id = image_id_url_creatures[i][0];
		creatures_coor[id] = {x:(i%10)*32, y:32*(i-(i%10))/10, coor:true};
}

function getCoorCreatures(id){
	if (creatures_coor[id])
		return {x:creatures_coor[id].x, y:creatures_coor[id].y, width:32, height:32, tileset:tscreatures, coor:true};
}



var getElem_ = document.getElementById.bind(document);
getElem = function (id){
			var ret = getCoor(id) || /* getCoorNumbers(id) || getCoorEffects(id) ||*/  getCoorCreatures(id) /*|| getCoorGrayscale(id)*/ || getElem_(id);
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
					false, //[getElem("magicdust2"), getElem("magicdust3"), getElem("magicdust4")],		//45
					getElem("poisonfieldrune"),	//46
					[getElem("poisongas0"), getElem("poisongas1"), getElem("poisongas2"), getElem("poisongas3")],		//47
					//[getElem("void1"), getElem("void2"), getElem("void3"), getElem("void4"),getElem("void5"), getElem("void6"), getElem("void7"), getElem("void8"),
					 		//getElem("void9"), getElem("void10"), getElem("void11"), getElem("void12"),getElem("void13"), getElem("void14"), getElem("void15"), getElem("void16")]		//48
					false,	//48
					getElem("lever"),	//49
					getElem("lever_pulled")	//50
				];

var secondcanvas = document.getElementById("tilesetcanvas");
var secondctx = secondcanvas.getContext("2d");
	console.log(secondctx);

function seconddraw(){
	for (var i=0;i<imglist.length;i++){
		var coor = imglist[i];
		if (coor) {
			if (coor.length>0) coor=coor[0];
			coor.i = i;
			var x = i%10;
			var y = (i-x)/10;
			//console.log(coor, coor.tileset, coor.x, coor.y, 32, 32, x*32, y*32, 32, 32);
			secondctx.drawImage(coor.tileset, coor.x, coor.y, 32, 32, x*32, y*32, 32, 32);
			//console.log("nuthin");
		}
	}
}
setTimeout(seconddraw, 100);

var secondcanvasposition = secondcanvas.getBoundingClientRect();

function secondclick(ev){
	var x = ev.clientX - secondcanvasposition.x;
	var y = ev.clientY - secondcanvasposition.y;
	var tx = Math.floor(x/32);
	var ty = Math.floor(y/32);
	var imgid = ty*10+tx;
	if (imgid < imglist.length) followthemouse = imgid;

}

secondcanvas.addEventListener("click", secondclick);




TIME = 0;

	function drawItemid(imgid,x,y,mouse){
		var coor = imglist[imgid];
		if (imglist[imgid].length>0){
			var eff = itemtypes[imgid].animationdelay || 1000;
			var i = Math.floor((TIME%(imglist[imgid].length*eff))/eff);
			coor = imglist[imgid][i];
		}
		ctx.drawImage(coor.tileset, coor.x, coor.y, 32, 32, x, y, 32, 32);
		//if (mouse)
		//	console.log(imgid, coor.x, coor.y, x, y);
	}


function draw(){
	//ctx.clearRect();
	ctx.fillRect(0,0, 864, 608);
    for (var x = 0+mapoffsetdraw.x; x<27+mapoffsetdraw.x/*map.length*/; x++){
	if (!map[x]) continue;
        for (var y = 0+mapoffsetdraw.y; y<19+mapoffsetdraw.y/*map[x].length*/; y++){
		if (!map[x][y]) continue;
            //myctx.drawImage(imgid, x*32, y*32, 32, 32);
            //myctx.drawImage(coor.tileset, coor.x, coor.y, 32, 32, x, y, 32, 32);
            for (var i = 0; i< map[x][y].length; i++){
                drawItemid(map[x][y][i][0],(x-mapoffsetdraw.x)*32,(y-mapoffsetdraw.y)*32);
            }
        }
    }
}

setInterval(draw, 100);


followthemouse = 21;
canvasposition = canvas.getBoundingClientRect();
eraser = false;

function onmouseclick(e){
	var x = e.clientX-canvasposition.left; var y = e.clientY-canvasposition.top;
	var tx = Math.floor(x/32)+mapoffsetdraw.x; var ty = Math.floor(y/32)+mapoffsetdraw.y;
	if (!eraser)
		map[tx][ty].push([followthemouse, 1]);
	else {
		map[tx][ty].pop();
	}
}

mycanvas.addEventListener('click', onmouseclick);

mapoffsetdraw = {x:0,y:0};

function onkeypressed(e){
	var key = e.keyCode;
		console.log(key);
	if (key == 37) { //left
		mapoffsetdraw.x -= 1;
	} else if (key == 38) { //up
		mapoffsetdraw.y -= 1;
	} else if (key == 39) { //right
		mapoffsetdraw.x += 1;
	} else if (key == 40) { //down
		mapoffsetdraw.y += 1;
	} else if (key == 69) { //E
		eraser = !eraser;
	} else if (key == 83) { //S
		saveMap();
	}
}

document.addEventListener('keydown', onkeypressed);


function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

function saveMap(){
    //console.log(JSON.stringify(map));
    download("map.json", JSON.stringify(map));
}

