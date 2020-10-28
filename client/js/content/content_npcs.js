// This is content_npcs
// Every npc should be defined here, and should be indexed by name
// {name:, imgid:, hp:, behavior: function () {}}
// consider createcreature : (pos, hp, imgid, npc)
// right now we have a behaviors table at hostapp, we need to bring it here
// protocol for this: globalize needed methods, but pass all other variables as arguments, e.g. grid, creaturesH

//basic needed methods

function getClosestTarget(self, creatures){
	var dist = 10000;
	var lastc = false;
	for (var i in creatures){
		var c = creatures[i];
		if (!c.invisible && !c.npc){
			if (rangepos(c.pos, self.pos) < dist){
				lastc = c;
				dist = rangepos(c.pos, self.pos);
			}
		}
	}
	return lastc;
}

function getPathToTarget(self, targetpos){
	return A_star_npc(self.pos, targetpos, extracost);
}

function getPathAwayFromTarget(self, targetpos){
	return A_star_npc_flee(self.pos, targetpos, extracost);
}

function extracost(node){
	if (inworldH(node) && !isblocking(topItem(getTileH(node)))){
		if (getField(getTileH(node))){
			return 3;
		}
		return 0;
	}
	return 1000;
}

//reference
/*
if(followCreature){
    walkUpdateTicks += interval;
    if(forceUpdateFollowPath || walkUpdateTicks >= 2000){
      walkUpdateTicks = 0;
      forceUpdateFollowPath = false;
      isUpdatingPath = true;
    }
  }
 */


function followCreature(self, target, interval){
	if (!self.path){
		self.path = getPathToTarget(self, target.pos);
		self.walkUpdateTicks = 0;
	}
	self.walkUpdateTicks += interval;
	if (self.path && self.path.length>1){
		var dir = dirBetween(self.path[0], self.path[1], true);
		var worked = moveByDir(self, dir);
		self.path.shift();
		if (!worked || self.walkUpdateTicks >= 2000 || self.path.length <= 1){
			self.path = false;	//found obstacle, recalculate path	//or, 2 seconds has passed, recalculate path //or, path ended, recalculate path
		}
		return dir;
	} else {
		return false;
	}
}

function fleeFromCreature(self, target, interval){
	if (!self.path){
		self.path = getPathAwayFromTarget(self, target.pos);
		self.walkUpdateTicks = 0;
	}
	self.walkUpdateTicks += interval;
	if (self.path && self.path.length>1){
		var dir = dirBetween(self.path[0], self.path[1], true);
		var worked = moveByDir(self, dir);
		self.path.shift();
		if (!worked || self.walkUpdateTicks >= 2000 || self.path.length <= 1){
			self.path = false;	//found obstacle, recalculate path	//or, 2 seconds has passed, recalculate path //or, path ended, recalculate path
		}
		return dir;
	} else {
		return false;
	}
}

function castAtCreature(self, target, spell){	//spell is function taking (c,pos,origin)
	spell(self, target.pos, self.pos);	//working sol
}



var skeleton_npc = function (self, creatures, interval) {
		//follows and attacks randomly from a list -> self.genotype.attacklist ?? keep to a distance. self.genotype.preferred_dist
		if (!self.target || self.target.removed || self.target.invisible){
			self.target = getClosestTarget(self, creatures);
			self.path = false;
			self.walkUpdateTicks = 0;
		}
		if (self.target){
			//cast attacks
			// ...
			if (R(2) == 0){
				var atk = self.genotype.spells[R(self.genotype.spells.length)];
				castAtCreature(self, self.target, atk);
				self.exhaust = self.cast_delay || self.walk_delay * 2;
			} else {
				// walk
				var pref_dist = self.genotype.preferred_dist || 1;
				if (rangepos(self.pos, self.target.pos) > pref_dist){
					var dir = followCreature(self, self.target, interval);
					self.exhaust = dir < 4 ? self.walk_delay : self.walk_delay * 1.4;
				} else if (rangepos(self.pos, self.target.pos) == pref_dist) {
					//
					self.path = false;
				} else {	// < d
					var dir = fleeFromCreature(self, self.target, interval);
					self.exhaust = dir < 4 ? self.walk_delay : self.walk_delay * 1.4;
				}
			}
		}
};

//FSM
//próximo, garras e mordida,
//meio distante, cauda
//distante o suficiente para não se queimar, gfb
//em linha reta, fire wave
//Mas agora só tenho gfb e firewave



function setupnpcs(){
	npcs = {
		dragon: {name: "Dragon", imgid: 33, hp: 60, spells: [spells.castFB] ,behavior: function (self, creatures, interval) {
			//moveByDir(self, R(4));
			skeleton_npc(self, creatures, interval);
		},
		preferred_dist: 3,
		walk_delay: 300,
		cast_delay: 1000
		},
		dummy: {name: "Dummy", imgid: 34, hp: 40, behavior: function (self, creatures, interval) {
			moveByDir(self, R(4));
		}}
	};

	if (typeof exports != "undefined"){
		global.npcs = npcs;
	}
}
