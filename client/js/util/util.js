// Constants

HEAD=0;
TORSO=1;
LEGS=2;
BOOTS=3;
RIGHT=4;
LEFT=5;
AMMO=6;


// Math

function clamp(t, min, max){
	return Math.min(max, Math.max(min, t));
}

function lerp(start, end, t){
	t = clamp(t, 0, 1);
	return start + (end - start) * t;
}

function identity(x){ 
	return x;
}

function mod(a,b){
	var r = a%b;
	if (r<0)
		r+=b;
	return r;
}


// Random

function R(n) { 
	return Math.floor(n*Math.random()); 
}

var chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function genChar() { 
	return chars[R(chars.length)]; 
}

function genPredId(n) { 
	return Array.apply(null, Array(n||10)).map(genChar).join("");	//62^10 = 8.4e+17 ~ 840 quadrillions
}


// Tests

var isNode = false;

if (typeof exports !== 'undefined'){
	isNode = true;
}

var isLocal = !isNode && !window.location.host;

var isHeroku = !isNode && window.location.hostname == 'tilebattle.herokuapp.com';

var isLocalhost = !isNode && window.location.hostname == 'localhost';

var isGamejolt = !isNode && window.location.hostname.indexOf("gamejolt") > -1;

var isOffline = false;	//testing offline, no broker, connecting to localhost/deathmatchstatic

// Cookies

var useStorage;

if (!isNode && typeof window.localStorage !== "undefined"){
	(function () {
		var mod = 'test';
	    try {
	        localStorage.setItem(mod, mod);
	        localStorage.removeItem(mod);
	        //return true;
			useStorage = true;
	    } catch(e) {
	        //return false;
			useStorage = false;
	    }
	})();	//javascript doesn't have block scope, so without this closure 'mod' would be made global
}


function getCookie(name){
	if (useStorage){
		return window.localStorage.getItem(name);
	}
	name = name.toString();
	var value = false;
	var s1 = document.cookie.indexOf(name + "=");
	if (s1 > -1) {
		var s2 = document.cookie.indexOf(";", s1);
		value = document.cookie.substring(s1 + name.length + 1, s2 == -1 ? document.cookie.length : s2);
	}
	return value;
}

function setCookie(name, value){
	if (useStorage){
		window.localStorage.setItem(name,value);
		return;
	}
	document.cookie = name+"="+value+"; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/";
}
  
function deleteAllCookies() {
	var c = document.cookie.split("; ");
	for (i in c) 
		document.cookie =/^[^=]+/.exec(c[i])[0]+"=;expires=Thu, 01 Jan 1970 00:00:00 GMT";    
}


// Positions

function newpos(x,y) {
	return {x:x,y:y};
}

function rangepos(pos1,pos2) {
	return Math.max(Math.abs(pos1.x-pos2.x),Math.abs(pos1.y-pos2.y));
}

function subpos(pos1,pos2){
	return {x:pos1.x-pos2.x,y:pos1.y-pos2.y};
}

function cmppos(pos0, pos1){
	return pos0.x == pos1.x && pos0.y == pos1.y;
}

function dirBetween(cpos,c2pos,diagonals){
	var dir;
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

function dirBetween_futr(frompos, topos, diagonals){
	var dirs = [SOUTHEAST, SOUTH, SOUTHWEST, WEST, NORTHWEST, NORTH, NORTHEAST, EAST];
	var dx = topos.x - frompos.x,
		dy = topos.y - frompos.y;
	var atan = Math.atan2(dy, dx);
	if (diagonals){
		var N = atan/(Math.pi/8);
		if (N<0) N+=16;
		
	}
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


//Url meddling

if (typeof window !== 'undefined' && window.location){
	QueryString = (function(a) {	//usage: paramvalue = QueryString["param"]
		if (a == "") return {};
		var b = {};
		for (var i = 0; i < a.length; ++i)
		{
			var p=a[i].split('=');
			if (p.length != 2) continue;
			b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
		}
		return b;
	})(window.location.search.substr(1).split('&'));
}

function url(url){
  return url && url.match(/:\/\/(.[^/]+)/)[1];
}


// Other

function getTime(){
	return new Date().getTime();
}

function cropToWidth(text,width){
	var w = width+1;
	var lastw = w;
	var l0 = 0;
	var l1 = text.length;
	var l;
	var t2;
	while (true){
		l = Math.floor((l1+l0)/2);
		t2 = text.substring(0,l);
		lastw = w;
		w = ctx.measureText(t2).width;
		if (l1-l0<2) {
			console.log('1 '+l0+' '+l1+' '+w+' '+width); 
			return t2;
		}
		if (w>width){
			//l0=l0;
			l1=l;
		} else if (w<width) {
			l0=l;
			//l1=l1;
		} else {
			console.log('2 '+l0+' '+l1+' '+w+' '+width); 
			return t2;
		}
	}
}


// Game redundancies

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

function createItem(itid,count) {
	return [itid,count];
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

function topItem(tile){ 
	return tile[tile.length-1];
}

function getImgid(t) {
	if (t.creature) {
		if (t.invisible) {
			return 'i';
		} 
		return {creature:true,id:t.id,peerid:t.peerid,imgid:t.imgid,hp:t.hp/t.maxhp,nick:t.nick,walking:t.walking,walk_delay:t.walk_delay,pos:t.pos,frompos:t.frompos,dir:t.dir};
	}
	return t[0];	//itemitype(t).imgid;	//mostly their  ids and imgids are the same -- sprites might vary though , animations etc
}

function copyWorld(world){	//for hosts
	var ret = [];
	for (var x = 0; x < world.length; x++){
		ret[x] = [];
		for (var y = 0; y < world[0].length; y++){
			var tile = world[x][y];
			ret[x][y] = tile;
		}
	}
	return ret;
}



if (typeof exports != "undefined"){
	global.clamp = clamp;
	global.dirBetween = dirBetween;
	global.genPredId = genPredId;
	global.make2dArray = make2dArray;
	global.createItem = createItem;
	global.newpos = newpos;
	global.cmppos = cmppos;
	global.R = R;
	global.makeimagetile = makeimagetile;
	global.getImgid = getImgid;

	global.directions = [newpos(0, -1), newpos(1, 0), newpos(0, 1), newpos(-1, 0), newpos(-1, 1), newpos(1, 1), newpos(-1, -1), newpos(1, -1)];
	global.rangepos = rangepos;
	global.topItem = topItem;
}

