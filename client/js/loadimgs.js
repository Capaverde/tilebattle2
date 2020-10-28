/*var tileset = new Image();
tileset.src = "./sprites/tileset.png";
tileset.style.display = "none";

var numbers = new Image();
numbers.src = "./numbers/numbers.png";
numbers.style.display = "none";*/


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

image_id_url_effects = [	//both magic and distance effects
	// effects -->
	//["critical", "./sprites/critical.png"],
	["firefield", "./sprites/firefield.png"],
	["firehit1", "./sprites/firehit1.png"],
	["firehit2", "./sprites/firehit2.png"],
	["firehit3", "./sprites/firehit3.png"],
	["firehit4", "./sprites/firehit4.png"],
	["firehit5", "./sprites/firehit5.png"],
	["drawblood", "./sprites/drawblood.png"],
	["drawblood1", "./sprites/drawblood1.png"],
	["drawblood2", "./sprites/drawblood2.png"],
	["drawblood3", "./sprites/drawblood3.png"],
	["drawblood4", "./sprites/drawblood4.png"],
	["poff", "./sprites/poff2.png"],
	["poff1", "./sprites/poff1.png"],
	["poff2", "./sprites/poff2.png"],
	["poff3", "./sprites/poff3.png"],
	["poff4", "./sprites/poff4.png"],
	["magicdust", "./sprites/magicdust3.png"],
	["magicdust1", "./sprites/magicdust1.png"],
	["magicdust2", "./sprites/magicdust2.png"],
	["magicdust3", "./sprites/magicdust3.png"],
	["magicdust4", "./sprites/magicdust4.png"],
	["magicdust5", "./sprites/magicdust5.png"],
	["splash", "./sprites/splash.png"],
	["splash1", "./sprites/splash1.png"],
	["splash2", "./sprites/splash2.png"],
	["splash3", "./sprites/splash3.png"],
	["splash4", "./sprites/splash4.png"],
	["block", "./sprites/block.png"],
	["blockold1", "./sprites/blockold1.png"],
	["blockold2", "./sprites/blockold2.png"],
	["blockold3", "./sprites/blockold3.png"],
	["blockold4", "./sprites/blockold4.png"],
	["blocktest1", "./sprites/924.png"],
	["blocktest2", "./sprites/925.png"],
	["blocktest3", "./sprites/926.png"],
	["block1", "./sprites/1388.png"],
	["block2", "./sprites/1389.png"],
	["block3", "./sprites/1390.png"],
	["block4", "./sprites/1391.png"],
	["block5", "./sprites/1392.png"],
	["block6", "./sprites/1393.png"],
	["block7", "./sprites/1394.png"],
	["block8", "./sprites/1395.png"],
	["energy1", "./sprites/1396.png"],
	["energy2", "./sprites/1397.png"],
	["energy3", "./sprites/1398.png"],
	["energy4", "./sprites/1399.png"],
	["energy5", "./sprites/1400.png"],
	["energy6", "./sprites/1401.png"],
	["energy7", "./sprites/1402.png"],
	["energy8", "./sprites/1403.png"],
	["poisonhit1", "./sprites/1381.png"],
	["poisonhit2", "./sprites/1382.png"],
	["poisonhit3", "./sprites/1383.png"],
	["poisonhit4", "./sprites/1384.png"],
	["poisonhit5", "./sprites/1385.png"],
	["poisonhit6", "./sprites/1386.png"],
	["poisonhit7", "./sprites/1387.png"],

	// dist effects -->
	["arrow_north", "./sprites/arrow_north.png"],
	["arrow_east", "./sprites/arrow_east.png"],
	["arrow_south", "./sprites/arrow_south.png"],
	["arrow_west", "./sprites/arrow_west.png"],
	["arrow_southwest", "./sprites/arrow_southwest.png"],
	["arrow_southeast", "./sprites/arrow_southeast.png"],
	["arrow_northwest", "./sprites/arrow_northwest.png"],
	["arrow_northeast", "./sprites/arrow_northeast.png"],
	["frozenstar", "./sprites/frozenstar.png"],
	["fireball_north", "./sprites/fireball_north.png"],
	["fireball_east", "./sprites/fireball_east.png"],
	["fireball_south", "./sprites/fireball_south.png"],
	["fireball_west", "./sprites/fireball_west.png"],
	["fireball_southwest", "./sprites/fireball_southwest.png"],
	["fireball_southeast", "./sprites/fireball_southeast.png"],
	["fireball_northwest", "./sprites/fireball_northwest.png"],
	["fireball_northeast", "./sprites/fireball_northeast.png"],
	["poisonspit_north", "./sprites/5300.png"],
	["poisonspit_east", "./sprites/5306.png"],
	["poisonspit_south", "./sprites/5304.png"],
	["poisonspit_west", "./sprites/5302.png"],
	["poisonspit_southwest", "./sprites/5303.png"],
	["poisonspit_southeast", "./sprites/5305.png"],
	["poisonspit_northwest", "./sprites/5301.png"],
	["poisonspit_northeast", "./sprites/5307.png"]
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

image_id_url_numbers = [
	// numbers -->
	["n0", "./numbers/0.png"],
	["n1", "./numbers/1.png"],
	["n2", "./numbers/2.png"],
	["n3", "./numbers/3.png"],
	["n4", "./numbers/4.png"],
	["n5", "./numbers/5.png"],
	["n6", "./numbers/6.png"],
	["n7", "./numbers/7.png"],
	["n8", "./numbers/8.png"],
	["n9", "./numbers/9.png"],
	["n10", "./numbers/10.png"]
];

image_id_url_grayscale = [
	//grayscale -->	
	["grayscale_sword", "./sprites/grayscale_sword.png"],
	["grayscale_fireballrune", "./sprites/grayscale_fireballrune.png"],
	["grayscale_arrow", "./sprites/grayscale_arrow.png"],
	["grayscale_shield", "./sprites/grayscale_shield.png"],
	["grayscale_armor", "./sprites/grayscale_chain_armor.png"],
	["grayscale_legs", "./sprites/grayscale_leather_legs.png"],
	["grayscale_helmet", "./sprites/grayscale_helmet.png"],
	["grayscale_boots", "./sprites/grayscale_boots.png"],
	["grayscale_hand_left", "./sprites/grayscale_hand_left.png"],
	["grayscale_hand_right", "./sprites/grayscale_hand_right.png"]

];

image_id_url_other = [
	["critical", "./sprites/critical.png"],
	
	["setaleft", "./sprites/setaleft.png"],
	["setaright", "./sprites/setaright.png"], 
	["setaup", "./sprites/setaup.png"],
	["setadown", "./sprites/setadown.png"], 

	["opendoor", "./sprites/opendoor.png"],

	["inventory", "./sprites/inventory.png"],

	["tileset", "./sprites/tileset.png"],
	["numbers", "./numbers/numbers.png"],
	["effects", "./sprites/effects.png"],
	["tscreatures", "./sprites/creatures.png"],
	["grayscale", "./sprites/grayscale.png"]
];


var tileset_coor = {};

for (var i = 0; i < image_id_url_ts.length; i++){ 
		var id = image_id_url_ts[i][0];
		tileset_coor[id] = {x:(i%10)*32, y:32*(i-(i%10))/10, coor:true};
}

function getCoor(id){
	if (tileset_coor[id])
		return {x:tileset_coor[id].x, y:tileset_coor[id].y, width:32, height:32, tileset:tileset, coor:true};
}

var numbers_coor = {};

for (var i = 0; i < image_id_url_numbers.length; i++){ 
		var id = image_id_url_numbers[i][0];
		numbers_coor[id] = {x:i*17,y:0,coor:true};
}

function getCoorNumbers(id){
	if (numbers_coor[id])
		return {x:numbers_coor[id].x, y:numbers_coor[id].y, width:17, height:14, tileset:numbers, coor:true};
}

var effects_coor = {};

for (var i = 0; i < image_id_url_effects.length; i++){ 
		var id = image_id_url_effects[i][0];
		effects_coor[id] = {x:(i%10)*32, y:32*(i-(i%10))/10, coor:true};
}

function getCoorEffects(id){
	if (effects_coor[id])
		return {x:effects_coor[id].x, y:effects_coor[id].y, width:32, height:32, tileset:effects, coor:true};
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

var grayscale_coor = {};

for (var i = 0; i < image_id_url_grayscale.length; i++){ 
		var id = image_id_url_grayscale[i][0];
		grayscale_coor[id] = {x:(i%10)*32, y:32*(i-(i%10))/10, coor:true};
}

function getCoorGrayscale(id){
	if (grayscale_coor[id])
		return {x:grayscale_coor[id].x, y:grayscale_coor[id].y, width:32, height:32, tileset:grayscale, coor:true};
}




function loadimgs(image_id_url){
	var container = document.getElementById("holder-div");

	for (var i=0;i<image_id_url.length;i++){
		var iiu = image_id_url[i];
		var id = iiu[0];
		var url = iiu[1];
		var img = new Image();
		//url = "myimg.jpg",

		(function (img){
			img.onload = function () { container.appendChild(img); };
			img.src = url;
			img.id = id;
			img.style.display = "none";
			if (isLocal)
				;	//if in Chrome, requests for different (file://) files will be considered cross-origin, tainting the canvas and impossibilitating things like getImageData
		})(img);
	}
}

if (typeof exports != "undefined"){
	exports.image_id_url_ts = image_id_url_ts;
	exports.image_id_url_numbers = image_id_url_numbers;
	exports.image_id_url_effects = image_id_url_effects;
	exports.image_id_url_creatures = image_id_url_creatures;
	exports.image_id_url_grayscale = image_id_url_grayscale;
	exports.image_id_url_other = image_id_url_other;
} else {
	//loadimgs(image_id_url_numbers);
	loadimgs(image_id_url_other);
}