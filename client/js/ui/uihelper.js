//UI Helper


//view
//create private canvas
/*
obj.view = true;
var canvas = document.createElement('canvas');
canvas.width = obj.width;
canvas.height = obj.height;
canvas.style.display = "none";
obj.ctx = canvas.getContext("2d");

	*/

var setaup = new Image();

(function (img){
	//img.onload = function () { container.appendChild(img); };
	img.src = "./sprites/setaup.png";
	//img.id = id;
	img.style.display = "none";
})(setaup);	

var setadown = new Image();

(function (img){
	//img.onload = function () { container.appendChild(img); };
	img.src = "./sprites/setadown.png";
	//img.id = id;
	img.style.display = "none";
})(setadown);

function Obj(obj,helper){
	switch(obj.type){
		case 'rect':
			obj.draw = function () {
				this.drawer.drawRect(this.x, this.y, this.width, this.height, this.color);
			}
			break;
		case 'text':
			obj.draw = function () {
				if (this.align)
					this.drawer.ctx.textAlign = this.align;
				this.drawer.drawText(this.x, this.y, this.color, this.font, this.text);
				this.drawer.ctx.textAlign = "start";
			}
			break;
		case 'button':
			obj.draw = function () {
				var c = (this.disabled && this.disabledcolor) ? this.disabledcolor : (this.holding && this.holdcolor) ? this.holdcolor : this.color;
				this.drawer.drawRect(this.x, this.y, this.width, this.height, c);
				if (this.rovering && this.holdcolor && !this.disabled){
					this.drawer.ctx.strokeStyle = this.holdcolor;
					this.drawer.ctx.lineWidth = 1;
					this.drawer.ctx.strokeRect(this.x,this.y,this.width,this.height);
				}
				if (this.text){
					this.drawer.ctx.fillStyle = this.textcolor;
					this.drawer.ctx.font = this.font;
					this.drawer.ctx.textAlign = "center";
					this.drawer.ctx.fillText(this.text,this.x+this.width/2,this.y+this.height-(this.height-this.drawer.getFontSize(this.font))/2);
					this.drawer.ctx.textAlign = "start";
				}
			}
			obj.onmouseup = function () {
				if (this.disabled)
					return;
				obj.onclick();
			}
			break;
		case 'textinput':
			obj.draw = function () {
				this.drawer.drawRect(this.x, this.y, this.width, this.height, this.background_color);
				this.drawer.ctx.fillStyle = this.textcolor;
				this.drawer.ctx.font = this.font;
				this.drawer.ctx.fillText(this.msg,this.x+8,this.y+this.drawer.getFontSize(this.font)+3);
				if (helper.focus == this && helper.blinking){
					var w = this.drawer.ctx.measureText(this.msg).width;
					this.drawer.ctx.fillRect(this.x+8+w,this.y+(this.height-this.drawer.getFontSize(this.font))/2,1,this.drawer.getFontSize(this.font));
				}
			}
			obj.onmousedown = function () {
				helper.focus = this;
			}
			obj.onroverin = function () {
				helper.canvas.style.cursor = "text";
			}
			obj.onroverout = function () {
				helper.canvas.style.cursor = "default";
			}
			break;
		case 'img':
			obj.draw = function () {
				this.drawer.drawImage(this.elem, this.x, this.y);
			}
			break;
		case 'vertical-scroll':
			helper.newobj({type:'button', x:obj.x, y:obj.min_y, width:obj.width, height:21, color:"#8e8e8e", holdcolor: "#AeAeAe",
							onclick: function () { 
								obj.y = clamp(obj.y-10,obj.min_y+21+2,obj.min_y+obj.bound_height-obj.height-21-2); } });
			helper.newobj({type:'img', x:obj.x+(obj.width-17)/2, y:obj.min_y, width:17, height:21, elem: setaup});
			helper.newobj({type:'button', x:obj.x, y:obj.min_y+obj.bound_height-21, width:obj.width, height:21, color:"#8e8e8e", holdcolor: "#AeAeAe", 
							onclick: function () { 
								obj.y = clamp(obj.y+10,obj.min_y+21+2,obj.min_y+obj.bound_height-obj.height-21-2);} });
			helper.newobj({type:'img', x:obj.x+(obj.width-17)/2, y:obj.min_y+obj.bound_height-21, width:17, height:21, elem: setadown});
		
		
			obj.y = obj.min_y+21+2;
			if (obj.height)
				delete obj.height;
			Object.defineProperty(obj, "height", {get : function () {  return (this.bound_height-2*(21+2))*clamp(this.view.height/this.view.canvas.height, 0, 1);} });
			obj.draw = function () {
				this.drawer.drawRect(this.x, this.y, this.width, this.height, this.color);
			}
			obj.ondrag = function (fromx,fromy,tox,toy) {
				var dy = toy-fromy;
				if (fromy < this.min_y && toy > fromy)
					return;
				if (fromy >= this.min_y+this.bound_height && toy < fromy)
					return;
				this.y = clamp(this.y+dy, this.min_y+21+2, this.min_y+this.bound_height-this.height-21-2);
			}
			break;
		case 'view':
			obj.view = true;
			obj.canvas = document.createElement('canvas');
			obj.canvas.width = obj.width;
			obj.canvas.height = obj.height;
			obj.canvas.style.display = "none";
			obj.ctx = obj.canvas.getContext("2d");
			obj.children = [];
			obj.draw = function () {
				if (this.color){
					this.ctx.fillStyle = this.color;
					this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
				}
				for (var c in this.children){
					var child = this.children[c];
					child.draw();	//drawn on private canvas
				}
				var w = Math.min(this.width,this.canvas.width), h = Math.min(this.height, this.canvas.height);
				helper.ctx.drawImage(this.canvas, 0+this.offx, 0+this.offy, w, h, this.x, this.y, w, h);
			}
			obj.clear = function () {
				obj.children.splice(0,obj.children.length);
			}
			if (obj.scroll)
				switch (obj.scroll.type){	//every view has a scroll
					case 'vertical-scroll':
						obj.offx = 0;
						Object.defineProperty(obj, "offy", { get : function () { return (this.scroll.y-(this.scroll.min_y+21+2))*(this.canvas.height)/(this.scroll.bound_height-2*(21+2)); } });
						break;
					case 'horizontal-scroll':
						Object.defineProperty(obj, "offx", { get : function () { return (this.scroll.x-(this.scroll.min_x+21+2))*(this.canvas.width)/(this.scroll.bound_width-2*(21+2)); } });
						obj.offy = 0;
						break;
					default:
						obj.offx = 0;
						obj.offy = 0;
						break;
				}
			break;
	}
	return obj;
}

function isInside(x,y,obj){
	return ((x-obj.x)>=0 && (x-obj.x)<obj.width) && ((y-obj.y)>=0 && (y-obj.y)<obj.height);
}

function Drawer(ctx){
	var drawer = {
		ctx : ctx,
		getFontSize : function (f) {
			var i = f.indexOf("px");
			var space_i = f.lastIndexOf(" ",i);
			return 1*(f.substring(space_i+1,i));
		},
		drawRect : function (x,y,w,h,c) {
			this.ctx.fillStyle = c;
			this.ctx.fillRect(x,y,w,h);
		},
		drawText : function (x,y,c,f,t) {
			this.ctx.fillStyle = c;
			this.ctx.font = f;
			this.ctx.fillText(t,x,y);
		},
		drawImage : function (i,x,y) {
			this.ctx.drawImage(i,x,y);
		}
	};
	return drawer;
}

function Helper(canvas){
	var helper = {
		canvas : canvas,
		width : canvas.width,
		height : canvas.height,
		canvasposition : canvas.getBoundingClientRect(),
		ctx : canvas.getContext('2d'),
		drawer : Drawer(canvas.getContext('2d')),
		state : 0,
		states : {},
		state_count : 0,
		holdingobj : false,
		draggingobj : false,
		draw : function (){
			var state = this.states[this.state];
			var objects = state.objects;
			this.ctx.fillStyle = "#ffffff";
			this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
			state.initdraw(this.ctx);
			for (var o=0;o<objects.length;o++){
				var obj = objects[o];
				if (obj && obj.draw){
					obj.draw();
				}
			}
			this.interval = requestAnimationFrame(function () { helper.draw(); });
		},
		newstate : function (initdraw){
			var state = this.state_count++;
			this.states[state] = {objects:[],initdraw:initdraw};
			return state;
		},
		setstate : function (state){
			this.state = state;
		},
		newobj : function(obj){
			obj.drawer = Drawer(this.ctx);
			var o = Obj(obj,this);
			this.states[this.state].objects.push(o);
			return o;
		},
		newchildobj : function(parent,obj){
			var o = Obj(obj,this);
			o.parent = parent;
			if (parent.type == 'view')
				o.drawer = Drawer(parent.ctx);	//parent must be a view
			parent.children.push(o);
			return o;
		},
		removeobj : function(obj){
			var index = this.states[this.state].objects.indexOf(obj);
			if (index > -1)
				this.states[this.state].objects.splice(index,1);
		},
		
		
		mousedown : function (ev){
			var x = ev.clientX-this.canvasposition.left;
			var y = ev.clientY-this.canvasposition.top;
			var state = this.states[this.state];
			var objects = state.objects;
			helper.focus = false;
			for (var o=0;o<objects.length;o++){
				var obj = objects[o];
				if (obj && obj.onmousedown && isInside(x,y,obj)){
					obj.onmousedown();
				} else if (obj && isInside(x,y,obj) && obj.type != 'view'){
					obj.holding = true;
					if (obj.ondrag){
						obj.dragging = true;
						obj.fromdragx = x;
						obj.fromdragy = y;
						obj.dragpointx = x-obj.x;
						obj.dragpointy = y-obj.y;
					}
				} else if (obj && isInside(x,y,obj) && obj.type == 'view'){
					for (var c in obj.children){
						var child = obj.children[c];
						if (child && isInside(x-obj.x+obj.offx,y-obj.y+obj.offy, child) && child.onmousedown){
							child.onmousedown();
						}
					}
				}
			}
		},
		mouseup : function (ev){
			var x = ev.clientX-this.canvasposition.left;
			var y = ev.clientY-this.canvasposition.top;
			var state = this.states[this.state];
			var objects = state.objects;
			for (var o=0;o<objects.length;o++){
				var obj = objects[o];
				if (obj && obj.onmouseup && isInside(x,y,obj) && obj.holding){
					obj.onmouseup();
				}
				if (obj && obj.holding){
					obj.holding = false;
				}
				if (obj && obj.dragging){
					obj.dragging = false;
				}
			}
		},
		mousemove : function (ev){
			var x = ev.clientX-this.canvasposition.left;
			var y = ev.clientY-this.canvasposition.top;
			var state = this.states[this.state];
			var objects = state.objects;
			for (var o=0;o<objects.length;o++){
				var obj = objects[o];
				if (obj && isInside(x,y,obj)){
					obj.rovering = true;
					if (obj.onroverin){
						obj.onroverin();
					}
				} else if (obj && obj.rovering){
					obj.rovering = false;
					if (obj.onroverout){
						obj.onroverout();
					}
				}
				if (obj && obj.dragging){
					obj.ondrag(obj.fromdragx, obj.fromdragy, x, y);
					obj.fromdragx = x;
					obj.fromdragy = y;
				}
			}
		},
		mouseout : function (ev){
			
		},
		keydown : function (ev) {
			var arrows=((ev.which)||(ev.keyCode));
			if (this.focus){
				if (arrows == 8){	//backspace
					this.focus.msg = this.focus.msg.substring(0,this.focus.msg.length-1);
					if (this.focus.msg.length == 0)
						this.focus.onempty();
					ev.preventDefault();	//won't write '\backspace'
				} else if (arrows == 13){	//enter
					ev.preventDefault();
					if(this.focus.msg.length==0){ return;}
					if (this.focus.onsubmit)
						this.focus.onsubmit();
				}
			}
		},
		keypress : function (ev){
			if (this.focus){
				var charCode = ev.which;
				var charStr = String.fromCharCode(charCode);
				if (charCode) {	
					if (!this.focus.maxlen || this.focus.msg.length < this.focus.maxlen){
						this.focus.msg += charStr;
						this.focus.oninput();
					}
				}
				ev.preventDefault();
			}
		},
		start : function () {
			if (this.interval)
				throw "UI already running, at: uihelper.js, helper.start";
			//this.interval = setInterval(function () { helper.draw(); }, 0);
			this.interval = requestAnimationFrame(function () { helper.draw(); });
			this.blinking_interval = setInterval(function () { helper.blinking = !helper.blinking; }, 500);
			this.canvas.addEventListener("mousedown", function (ev) { helper.mousedown(ev); });
			this.canvas.addEventListener("mouseup", function (ev) { helper.mouseup(ev); });
			this.canvas.addEventListener("mousemove", function (ev) { helper.mousemove(ev); });
			this.canvas.addEventListener("mouseout", function (ev) { helper.mouseout(ev); });
			window.addEventListener("keydown", function (ev) { helper.keydown(ev); });
			window.addEventListener("keypress", function (ev) { helper.keypress(ev); });
			
		},
		stop : function () {
			//clearInterval(this.interval);
			cancelAnimationFrame(this.interval);
			this.interval = false;
		}
	};
	
	canvas.addEventListener("contextmenu", function () { return false; });
		
	return helper;
}