	STATE_CREATEROOM = UI.newstate(function (ctx) {
		UI.drawer.drawRect(0, 0, UI.width, UI.height, "#9e9e9e");
	});
	UI.setstate(STATE_CREATEROOM);
	
	
	(function () {
	
	var Wid = 340;
	var X = (UI.width-Wid)/2;
	var Hei = 15+2*20+32*3+26+15;
	var Y = (UI.height-Hei)/2;
	UI.newobj({type:'rect',x:X, y:Y, width:Wid, height:Hei, color:"#6e6e6e"});
	//title
	UI.newobj({type:'text',x:X+15, y:Y+15+20, color:"#ffffff", font:"20px Tahoma", text:"Create Room"});
	UI.newobj({type:'rect',x:X+15, y:Y+15+20+3, width:Wid-30, height:3, color:"#8e8e8e"});
	
	
	//y+h-(h-this.getFontSize(f))/2-2
	UI.newobj({type:'rect',x:X+15, y:Y+15+2*20, width:Wid-30, height:26, color:"#8e8e8e"});
	UI.newobj({type:'text',x:X+15+8, y:Y+15+2*20+26-(26-12)/2-2, color:"#ffffff", font:"12px Tahoma", text:"Room Name:"});
	room_name = UI.newobj({type:'textinput',x:X+15+100, y:Y+15+2*20+2, width:Wid-30-100-2, height:22, background_color: "#4e4e4e", textcolor:"#ffffff", font:"12px Tahoma", msg:""});
	
	if (getCookie("name")){
		room_name.msg = getCookie("name")+"'s Room";
	}
	
	UI.newobj({type:'rect',x:X+15, y:Y+15+2*20+26+6, width:Wid-30, height:26, color:"#8e8e8e"});
	UI.newobj({type:'text',x:X+15+8, y:Y+15+2*20+26+6+26-(26-12)/2-2, color:"#ffffff", font:"12px Tahoma", text:"Password:"});
	room_pass = UI.newobj({type:'textinput',x:X+15+100, y:Y+15+2*20+26+6+2, width:Wid-30-100-2, height:22, background_color: "#4e4e4e", textcolor:"#ffffff", font:"12px Tahoma", msg:""});

	
	UI.newobj({type:'text', x:X+15, y:Y+15+2*20+32*2+12+4, color:"#ffffff", font:"12px Tahoma", text:"Max Players:"});
	
	max_players = UI.newobj({type:'text', x:X+Wid-60-15, y:Y+15+2*20+32*2+12+4, color:"#ffffff", font:"12px Tahoma", text:"10", N:10});
	
	
	//setaup = document.getElementById("setaup");
	//setadown = document.getElementById("setadown");
	
	UI.newobj({type:'button', x:X+15+Wid-30-17-4-17, y:Y+15+2*20+32*2, width:17, height:21, color:"#8e8e8e", holdcolor: "#AeAeAe",
					onclick: function () { 
						max_players.N-=2; 
						max_players.N=clamp(max_players.N, 2, 22);
						max_players.text=max_players.N; } });
	UI.newobj({type:'img', x:X+15+Wid-30-17-4-17, y:Y+15+2*20+32*2, width:17, height:21, elem: setadown});
	UI.newobj({type:'button', x:X+15+Wid-30-17, y:Y+15+2*20+32*2, width:17, height:21, color:"#8e8e8e", holdcolor: "#AeAeAe", 
					onclick: function () { 
						max_players.N+=2;
						max_players.N=clamp(max_players.N, 2, 22);
						max_players.text=max_players.N;} });
	UI.newobj({type:'img', x:X+15+Wid-30-17, y:Y+15+2*20+32*2, width:17, height:21, elem: setaup});
	
	
	UI.newobj({type:'button',x:X+15, y:Y+15+2*20+32*3, width:(Wid-30)/2-2, height:26, 
				color: "#8e8e8e", holdcolor: "#AeAeAe", textcolor:"#ffffff", font:"12px Tahoma", text:"Cancel", 
				onclick: function () { UI.setstate(STATE_ROOMLIST); refreshRooms(); }});
	UI.newobj({type:'button',x:X+15+(Wid-30)/2+2, y:Y+15+2*20+32*3, width:(Wid-30)/2-2, height:26, 
				color: "#8e8e8e", holdcolor: "#AeAeAe", textcolor:"#ffffff", font:"12px Tahoma", text:"Create",
				onclick: function () { 
					//window.location = "/createroom?title="+room_name.msg+"&pass="+room_pass.msg+"&players="+max_players.N;
					socket.emit('createroom', {title:room_name.msg,pass:room_pass.msg,players:max_players.N});
				}});
				
				
	})();