//spells que npcs usarão
//p ex, dragão usará castFB

//FSM
//próximo, garras e mordida,
//meio distante, cauda
//distante o suficiente para não se queimar, gfb
//em linha reta, fire wave
//Mas agora só tenho gfb e firewave

FBarea=[[0,1,1,1,0],
                        [1,1,1,1,1],
                        [1,1,1,1,1],
                        [1,1,1,1,1],
                        [0,1,1,1,0]];
        function castFB(c,pos,origin){//) {
                doArea(c, pos, FBarea, firehit, d(2,6), "#FFA000", origin, c.team);
                return 1;
        }


/*FWarea=[[0,1,1,1,0],
                        [1,1,1,1,1],
                        [1,1,1,1,1],
                        [1,1,1,1,1],
                        [0,1,1,1,0]];
        function castFW(c,pos,origin){//) {
                doArea(c, pos, FBarea, firehit, d(2,6), "#FFA000", origin, c.team);
                return 1;
        }
*/
