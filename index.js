let app = require('express')();
let http = require('http').createServer(app);
let io = require('socket.io')(http);
let express = require('express');

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

let players = [];
let actors = [];

let grandpa = {
  id:"grandpa",
  health:3,
  xPos:200,
  yPos:250,
  xVel:0,
  yVel:0,
  sprite:4,
  width:20,
  height:80,
  active:true,
  speed:0.05,
  friction:0.80,
  pushed:0
}

actors.push(grandpa);

function findPlayerIndex(player){
  let index = players.findIndex(p =>{
  	 //console.log (p);
  	 //console.log (player);
    return p.id == player.id
  })
  return index;
}

function findActorIndex(actor){
  let index = actors.findIndex(a =>{
     //console.log (p);
     //console.log (player);
    return a.id == actor.id
  })
  return index;
}


io.on('connection',(socket) => {
	console.log('WHATS UP ITS YO BOY SMASH THAT LIKE BUTTON');
  // Draw existing players.
  io.emit('remotekey',players);

	socket.on('disconnect',() => {
		console.log ("DONT FORGET TO RING THAT BELL BEFORE YOU LEAVE");
    //Remove player that left
    let playerIndex = players.findIndex(p=>{
      return p.id == socket.id;
    });
    players.splice(playerIndex,1);
	});

  socket.on('update',(updatePlayer)=>{
    // If player exists in array of players, add. Otherwise, update existing
    let cPlayerIndex = findPlayerIndex(updatePlayer);
    if (cPlayerIndex == -1) {
      players.push(updatePlayer);
    }
    else{
      players[cPlayerIndex] = updatePlayer;
    }

    //Old man movement logic
    
    // If old man isn't moving to the right, do so
    // if (actors[0].speed<0.05){
    //   actors[0].speed=0.05;
    // }

    actors[0].xVel*= actors[0].friction;
    actors[0].xPos+=actors[0].xVel;
    actors[0].xPos+=actors[0].speed;

    io.emit('updateClients',players,actors);
  });

	socket.on('key press', (player) => {
    // When a client presses a key, take the player object and update server's array of player info
		let currentPlayerIndex = findPlayerIndex(player);
        if (currentPlayerIndex == -1) {
            players.push(player);
        }
        else{
            players[currentPlayerIndex] = player;
        }
	});

  socket.on('key up', (player) => {
    // When a client presses a key, take the player object and update server's array of player info
    let currentPlayerIndex = findPlayerIndex(player);
        if (currentPlayerIndex == -1) {
            players.push(player);
        }
        else{
            players[currentPlayerIndex] = player;
        }
  });

  // Resolve finish condition. 
  socket.on('endGame',(result)=>{
    // Stop further interactions with grandpa
    var ind=findActorIndex(grandpa);
    actors[ind].active=false;
    actors[ind].speed=0;
    console.log("ending was reached");
    // Process result

    setTimeout(function(){
    io.emit('playSound',"victory");
        }, 1000);
    io.emit('showEnd', result);
  });

  //Collision function for grandpa
  socket.on('grandpa',(aggressivePlayer)=>{
    var ind=findActorIndex(grandpa);
    var playerInd=findPlayerIndex(aggressivePlayer);
    //check if player is performing the helping action or not, and if grandpa is active
    if (players[playerInd].playerAction && actors[ind].active){
      actors[ind].pushed++;
      console.log(actors[ind].pushed);
      actors[ind].xVel+=(players[playerInd].xVel);
      // Old man dies if pushed too much
      if(actors[ind].pushed>200){
        setTimeout(function(){
          io.emit('playSound',"thud");
          actors[ind].speed=0;
          actors[ind].sprite=6;
        }, 1000);
        setTimeout(function(){
          io.emit('playSound',"victory");
          io.emit('showEnd', 3);
        },4000);
      }

    }
    else{
    // check if grandpa is ready to be smacked
    if(actors[ind].active && !players[playerInd].playerAction){
      //deactivate grandpa to process one smack at a time
      actors[ind].active=false;
      actors[ind].health--;
      //swap sprite to hit
      actors[ind].sprite=5;
      io.emit('playSound',"smack");

      if(actors[ind].health>0){
        //stop moving
        var previousSpeed=actors[ind].speed;
        actors[ind].speed=0;
        // wait 2 seconds and return to normal
        setTimeout(function(){
          actors[ind].sprite=4;
          actors[ind].active=true;
          actors[ind].speed=previousSpeed;
        }, 2000);
      }
      else{
        // the old man died
        setTimeout(function(){
          io.emit('playSound',"thud");
          actors[ind].speed=0;
          actors[ind].sprite=6;
        }, 1000);
        setTimeout(function(){
          io.emit('playSound',"victory");
          io.emit('showEnd', 3);
        },4000);

      }

    }
  }

  });

});

const port = process.argv[2] || 7777;
http.listen(port, () => {
  console.log('listening on *:' + port);
});
