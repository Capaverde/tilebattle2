//var plot = require('plot2png');

//plot.plot_callback("output.png",function(x){return x*x;},-10,10);
//plot.plot_array("output2.png", [0,1,2,4,8,16]);


/*
var fs = require("fs"),
  PNG = require("pngjs").PNG;

fs.createReadStream("in.png")
  .pipe(
    new PNG({
      filterType: 4,
    })
  )
  .on("parsed", function () {
    for (var y = 0; y < this.height; y++) {
      for (var x = 0; x < this.width; x++) {
        var idx = (this.width * y + x) << 2;

        // invert color
        this.data[idx] = 255 - this.data[idx];
        this.data[idx + 1] = 255 - this.data[idx + 1];
        this.data[idx + 2] = 255 - this.data[idx + 2];

        // and reduce opacity
        this.data[idx + 3] = this.data[idx + 3] >> 1;
      }
    }

    this.pack().pipe(fs.createWriteStream("out.png"));
  });

*/


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
//	["opendoor", "./sprites/opendoor.png"],	//except this one, but I'll replace it
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
	["besttree", "./sprites/besttree.png"], //trees/oak-tree.png"],	//

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

var tileset_coor = {};

for (var i = 0; i < image_id_url_ts.length; i++){ 
		var id = image_id_url_ts[i][0];
		tileset_coor[id] = {x:(i%10)*32, y:32*(i-(i%10))/10, coor:true};
}

function getCoor(id){
	if (tileset_coor[id])
		return {x:tileset_coor[id].x, y:tileset_coor[id].y, width:32, height:32, tileset:tileset, coor:true};
}



let PNG = require("pngjs").PNG;
let fs = require("fs");

fs.createReadStream("tileset.png")
  .pipe(
    new PNG({
      filterType: 4,
    })
  )
  .on("parsed", function () {

for (var i=0;i<image_id_url_ts.length;i++){

let newfile = new PNG({ width: 32, height: 32 });

for (let y = 0; y < newfile.height; y++) {
  for (let x = 0; x < newfile.width; x++) {
    let idx = (newfile.width * y + x) << 2;
    let tx=(i%10)*32;
    let ty=32*(i-(i%10))/10;
    let idx2 = (this.width * (ty + y) + (tx +x)) << 2;
    //let col = (x < newfile.width >> 1) ^ (y < newfile.height >> 1) ? 0xe5 : 0xff;

    newfile.data[idx] = this.data[idx2];
    newfile.data[idx + 1] = this.data[idx2+1];
    newfile.data[idx + 2] = this.data[idx2+2];
    newfile.data[idx + 3] = this.data[idx2+3];
  }
}

newfile
  .pack()
  .pipe(fs.createWriteStream(__dirname + image_id_url_ts[i][1].substring(1)))
  .on("finish", function () {
    console.log("Written!");
  });

}

});

//console.log(image_id_url_ts.length);
