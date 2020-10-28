
	STATE_NICKNAME = UI.newstate(function (ctx) {
		UI.drawer.drawRect(0, 0, UI.width, UI.height, "#9e9e9e");
	});
	UI.setstate(STATE_NICKNAME);
	
	
	(function () {
		
	var Wid = 300;
	var X = (UI.width-Wid)/2;
	var Hei = 15+2*20+32+26+15;
	var Y = (UI.height-Hei)/2;
	UI.newobj({type:'rect',x:X, y:Y, width:Wid, height:Hei, color:"#6e6e6e"});
	//title
	UI.newobj({type:'text',x:X+15, y:Y+15+20, color:"#ffffff", font:"20px Tahoma", text:"Choose your nickname:"});
	UI.newobj({type:'rect',x:X+15, y:Y+15+20+3, width:Wid-30, height:3, color:"#8e8e8e"});
	
	
	//y+h-(h-this.getFontSize(f))/2-2
	UI.newobj({type:'rect',x:X+15, y:Y+15+2*20, width:Wid-30, height:26, color:"#8e8e8e"});
	UI.newobj({type:'text',x:X+15+8, y:Y+15+2*20+26-(26-12)/2-2, color:"#ffffff", font:"12px Tahoma", text:"Nickname:"});
	nick_name = UI.newobj({type:'textinput',x:X+15+100, y:Y+15+2*20+2, width:Wid-30-100-2, height:22, background_color: "#4e4e4e", textcolor:"#ffffff", font:"12px Tahoma", 
							maxlen:20, msg:"",
							onempty: function () { play_now.disabled = true; },
							oninput: function () { play_now.disabled = false; }	//ad hoc
							});
	
	
	play_now = UI.newobj({type:'button',x:X+(Wid-100)/2, y:Y+15+2*20+32, width:100, height:26, 
				color: "#8e8e8e", holdcolor: "#AeAeAe", textcolor:"#ffffff", font:"12px Tahoma", text:"Play now!", 
				disabled: true, disabledcolor: "#5e5e5e",
				onclick: function () { 
					setCookie("name",nick_name.msg);
					UI.setstate(STATE_ROOMLIST); 
					refreshRooms();  }});	//window.location = "/";
					
	if (getCookie("name")){
		nick_name.msg = getCookie("name");
		play_now.disabled = false;
	}
	
	})();