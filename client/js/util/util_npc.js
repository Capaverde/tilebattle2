//basic pathfinding

/*

void Npc::doMoveTo(Position target)
{
	std::list<Direction> listDir;
	if(!g_game.getPathToEx(this, target, listDir, 1, 1, true, true))
		return;

	startAutoWalk(listDir);
}

*/

function reconstruct_path(P){
	var path = [];
	while (P){
		path.unshift(P);
		P = P.previous;
	}
	return path;
}

function A_star(node_start, node_end, D, H, get_neighbors, extracost, flags){
	node_start.G = 0;
	node_start.H = H(node_start, node_end);
	var open_set = [node_start];
	var open_hash = {};
	open_hash[node_start.hash] = node_start;
	var closed_set = [];
	var closed_hash = {};
	var count = 0;
	extracost = extracost || function () { return 0; };
	while (!flags.max_iterations || closed_set.length < flags.max_iterations){
		if (open_set.length == 0){
			console.log("no path from start point to end point");
			return false;
		}
		open_set.sort(function (node_a, node_b) { 
			return (node_a.G + node_a.H) - (node_b.G + node_b.H);
		});
		var P = open_set[0];
		//if (P.hash == node_end.hash){
		if (H(P, node_end) <= 1 && !flags.fleeing){	//ad hoc, 'if neighbor' instead of 'if end' because node_end might be blocking and extracost puts it at the very end of open_set
			console.log("finished at "+ closed_set.length + " iterations");
			//console.log(reconstruct_path(P));
			return reconstruct_path(P);
		}
		var neighbors = get_neighbors(P);
		for (var i = 0; i < neighbors.length; i++){
			var n = neighbors[i];
			if (!closed_hash[n.hash]){
				if (!open_hash[n.hash]){
					open_hash[n.hash] = n;
					open_set.push(n);
					n.previous = P;
					n.G = P.G + D(P, n) + extracost(n);
					n.H = H(n, node_end);
				} else {
					n = open_hash[n.hash];
					var newG = P.G + D(P, n) + extracost(n);
					if (newG < n.G){
						n.previous = P;
						n.G = newG;
						n.H = H(n, node_end);	//unnecessary?
					}
				}
			}
		}
		open_set.splice(0,1);
		closed_set.push(P);
		closed_hash[P.hash] = true;
	}
	if (!flags.reconstruct_depleted){
		console.log("iterations depleted");
		return false;
	} else {
		open_set.sort(function (node_a, node_b) { 
			return (node_a.G + node_a.H) - (node_b.G + node_b.H);
		});
		var P = open_set[0];
		return reconstruct_path(P);
	}
}

function Node(x,y){
	this.x = x;
	this.y = y;
	this.hash = x+' '+y;
}

function get_neighbors(node){
	var neighbors = [];
	for (var x=-1;x<=1;x++)
	for (var y=-1;y<=1;y++){
		if (x==0 && y==0)
			continue;
		//if (Math.abs(x)==1 && Math.abs(y) == 1)
		//	continue;
		//if (!(x==0 || y==0))
			//continue;
		var n_node = new Node(node.x+x,node.y+y);
		//if (inworld(n_node) && !isblocking(topItem(getTile(n_node))))
			neighbors.push(n_node);
	}
	return neighbors;
}

D = function (A, B) { return Math.sqrt(Math.pow(A.x-B.x, 2)+Math.pow(A.y-B.y, 2)); };	//euclidean distance
H = D;
H2 = function (A, B) { return -(Math.sqrt(Math.pow(A.x-B.x,2)+Math.pow(A.y-B.y,2))); };

function A_star_npc(frompos, topos, extracost){
	return A_star(new Node(frompos.x, frompos.y), new Node(topos.x, topos.y), D, H, get_neighbors, extracost, {max_iterations: 100});
}

function A_star_npc_flee(frompos, topos, extracost){
	return A_star(new Node(frompos.x, frompos.y), new Node(topos.x, topos.y), D, H2, get_neighbors, extracost, {reconstruct_depleted: true, max_iterations: 100, fleeing: true});		//max iterations = 100 will guarantee this won't run forever
	//cost = euclidean dist is the same, but heuristic = negative distance = you're rewarded for getting away
	//this is experimental
}

if (typeof exports != "undefined"){
	global.Node = Node;
	global.A_star = A_star;
	global.A_star_npc = A_star_npc;
	global.A_star_npc_flee = A_star_npc_flee;
}


// and fleeing?
// http://gamedev.stackexchange.com/questions/43947/pathfinding-for-fleeing