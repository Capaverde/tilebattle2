	STATE_ROOM = UI.newstate(function (ctx) {
		UI.drawer.drawRect(0, 0, UI.width, UI.height, "#9e9e9e");
	});
	UI.setstate(STATE_ROOM);
	
	
	//(function () {
		
	var Wid = 864;
	var X = (UI.width-Wid)/2;
	var Hei = 608;
	var Y = (UI.height-Hei)/2;
	var Hei0 = 456;
	var Wid0 = 736;
	
	UI.newobj({type:'rect',x:X,y:Y,width:Wid,height:Hei0,color:"#6e6e6e"});
	UI.newobj({type:'rect',x:X,y:Hei0+4,width:Wid0,height:Hei-Hei0-4,color:"#6e6e6e"});
	UI.newobj({type:'rect',x:Wid0+4,y:Hei0+4,width:Wid-Wid0-4,height:Hei-Hei0-4,color:"#6e6e6e"});
	
	var Wid1 = 216;
	var X0 = (Wid-((Wid1+6)*3-6))/2;
	var Y0 = 82;
	var Hei1 = 224;
	
	UI.newobj({type:'rect',x:X0,y:Y0,width:Wid1,height:Hei1,color:"#4e4e4e"});
	UI.newobj({type:'rect',x:X0+Wid1+6,y:Y0,width:Wid1,height:Hei1,color:"#4e4e4e"});
	UI.newobj({type:'rect',x:X0+(Wid1+6)*2,y:Y0,width:Wid1,height:Hei1,color:"#4e4e4e"});

	//title
	UI.newobj({type:'text',x:X+15, y:Y+15+20, color:"#ffffff", font:"20px Tahoma", text:"Room Title"});
	UI.newobj({type:'rect',x:X+15, y:Y+15+20+3, width:Wid-30, height:3, color:"#8e8e8e"});
	UI.newobj({type:'button',x:X+Wid-15-64, y:Y+15, width:64, height:20,
				color: "#8e8e8e", holdcolor: "#AeAeAe", textcolor:"#FFFFFF", font:"12px Tahoma", text:"Leave",
				onclick: function () { /* */ }});
	
	
	var X1 = 160;
	var Y1 = 56;
	
	//team buttons
	UI.newobj({type:'button', x:X1, y:Y1, width:105, height:20, 
				color: "#8e8e8e", holdcolor: "#AeAeAe", textcolor:"#FF0000", font:"bold 14px Tahoma", text:"Red Team",
				onclick: function () { /* */ }});
	UI.newobj({type:'button', x:X1+216+3, y:Y1, width:105, height:20, 
				color: "#8e8e8e", holdcolor: "#AeAeAe", textcolor:"#FFFFFF", font:"bold 14px Tahoma", text:"Spectators",
				onclick: function () { /* */ }});
	UI.newobj({type:'button', x:X1+(216+3)*2, y:Y1, width:105, height:20, 
				color: "#8e8e8e", holdcolor: "#AeAeAe", textcolor:"#0000FF", font:"bold 14px Tahoma", text:"Blue Team",
				onclick: function () { /* */ }});
				
	//side buttons			
	UI.newobj({type:'button',x:48-16, y: 144, width: 64, height: 20,
				color: "#8e8e8e", holdcolor: "#AeAeAe", textcolor:"#FFFFFF", font:"12px Tahoma", text:"Lock",
				onclick: function () { /* */ }});
	UI.newobj({type:'button',x:48-16, y: 168, width: 64, height: 20,
				color: "#8e8e8e", holdcolor: "#AeAeAe", textcolor:"#FFFFFF", font:"12px Tahoma", text:"Auto",
				onclick: function () { /* */ }});
	UI.newobj({type:'button',x:48-16, y: 192, width: 64, height: 20,
				color: "#8e8e8e", holdcolor: "#AeAeAe", textcolor:"#FFFFFF", font:"12px Tahoma", text:"Reset",
				onclick: function () { /* */ }});
	
	
	
	
	
	
	
	//})()