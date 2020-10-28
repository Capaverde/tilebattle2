	STATE_ROOMLIST = UI.newstate(function (ctx) {
		UI.drawer.drawRect(0, 0, UI.width, UI.height, "#9e9e9e");
	});
	UI.setstate(STATE_ROOMLIST);
	
	
	(function () {
	
	var Wid = 640;
	var X = (UI.width-Wid)/2;
	var Hei = 480;
	var Y = (UI.height-Hei)/2;
	
	UI.newobj({type:'rect',x:X, y:Y, width:Wid, height:Hei, color:"#6e6e6e"});
	//title
	UI.newobj({type:'text',x:X+15, y:Y+15+20, color:"#ffffff", font:"20px Tahoma", text:"Room List"});
	UI.newobj({type:'rect',x:X+15, y:Y+15+20+3, width:Wid-30, height:3, color:"#8e8e8e"});
	
	var room_counter = UI.newobj({type:'text', 
				x:X+15+Wid-30, align:"end",
				y: Y+15+20, color:"#ffffff", font:"12px Tahoma", get text() { return this.players+" players in "+this.rooms+" rooms";},
				players:0,rooms:0});
	
	UI.newobj({type:'rect',x:X+15, y:Y+15+60, width:Wid-30-105-8, height:Hei-15-60-15, color:"#8e8e8e"});
	UI.newobj({type:'text',x:X+15+2+8, y:Y+15+60+22-(22-12)/2-2, color:"#ffffff", font:"12px Tahoma", text:"Room Name"});
	UI.newobj({type:'text',x:X+15+2+8+260, y:Y+15+60+22-(22-12)/2-2, color:"#ffffff", font:"12px Tahoma", text:"Players"});
	UI.newobj({type:'text',x:X+15+2+8+260+60+60, y:Y+15+60+22-(22-12)/2-2, color:"#ffffff", font:"12px Tahoma", text:"Pass"});
	
	
	UI.newobj({type:'button',x:X+15+Wid-30-105, y:Y+15+60, width:105, height:26, 
				color: "#8e8e8e", holdcolor: "#AeAeAe", textcolor:"#ffffff", font:"12px Tahoma", text:"Refresh",
				onclick: function () {  refreshRooms(); }});
	join_room = UI.newobj({type:'button',x:X+15+Wid-30-105, y:Y+15+60+30, width:105, height:26, 
				color: "#8e8e8e", holdcolor: "#AeAeAe", textcolor:"#ffffff", font:"12px Tahoma", text:"Join Room",
				disabled: true, disabledcolor: "#5e5e5e",
				onclick: function () { window.location = selected_room.url; }});
	UI.newobj({type:'button',x:X+15+Wid-30-105, y:Y+15+60+30*2, width:105, height:26, 
				color: "#8e8e8e", holdcolor: "#AeAeAe", textcolor:"#ffffff", font:"12px Tahoma", text:"Create Room",
				onclick: function () { UI.setstate(STATE_CREATEROOM); }});
	UI.newobj({type:'button',x:X+15+Wid-30-105, y:Y+Hei-15-26, width:105, height:26, 
				color: "#8e8e8e", holdcolor: "#AeAeAe", textcolor:"#ffffff", font:"12px Tahoma", text:"Logout",
				onclick: function () { UI.setstate(STATE_NICKNAME); }});
	
	
	UI.newobj({type:'rect',x:X+15+2, y:Y+15+60+22, width:Wid-30-105-8-4, height:Hei-15-60-15-22-2, color:"#6e6e6e"});
	
	var room_scroll = UI.newobj({type:'vertical-scroll',x:X+Wid-15-105-8-2-16-2, min_y:Y+15+60+22+2, width:16, height: 0, bound_height:Hei-15-60-15-22-2-2-2, color:"#8e8e8e"});

	
	var room_view = UI.newobj({type:'view',x:X+15+2, y:Y+15+60+22+2, width:Wid-30-2-105-8-2-2-16-2, height:Hei-15-60-15-22-2-2-2, color:"#6e6e6e",scroll:room_scroll});
	
	room_scroll.view = room_view;
	
	var selected_room = false;
	
	function addRoom(room,k){
		UI.newchildobj(room_view,{type:'rect',x:2, y:24*k, width:Wid-30-105-8-2-2-16-2, height:22, color:"#6e6e6e",	//"#878787"
		url: /* (!isHeroku && !isLocalhost)*/ true ? './play.html?room='+room.name :	'./room?id='+room.name,
		onmousedown:function () { 
			if (selected_room)
				selected_room.color = "#6e6e6e";
			selected_room=this; 
			this.color = "#878787";
			join_room.disabled = false;
		}});
		UI.newchildobj(room_view,{type:'text',x:2+8, y:24*k+22-(22-12)/2-2, color:"#ffffff", font:"12px Tahoma", text:room.title, maxwidth:260});
		UI.newchildobj(room_view,{type:'text',x:2+8+260, y:24*k+22-(22-12)/2-2, color:"#ffffff", font:"12px Tahoma", text:room.players+"/"+room.max_players});
		UI.newchildobj(room_view,{type:'text',x:2+8+260+60+60, y:24*k+22-(22-12)/2-2, color:"#ffffff", font:"12px Tahoma", text:room.haspass});
		room_view.canvas.height = 24*k+22;
	}
		
	function receiveRooms(rooms){
		room_counter.players = 0;
		for (var k=0;k<rooms.length;k+=1){
			var room = rooms[k];
			addRoom(room,k);
			room_counter.players += room.players;
		}
		//if (rooms.length == 0)
			;//$(roomlist).append('<tr><td>No rooms yet.</td></tr>');
		room_counter.rooms = rooms.length;
	}
	
	function refreshRooms(){	//refresh button, onclick="refreshRooms()"
		room_view.clear();
		selected_room = false;
		join_room.disabled = true;
		socket.emit("getrooms");
	}
	
	window.receiveRooms	= receiveRooms;
	window.refreshRooms	= refreshRooms;
	})();
