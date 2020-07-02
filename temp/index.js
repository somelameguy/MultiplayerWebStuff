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
  xPos:300,
  yPos:200,
  sprite:4
}

function findPlayerIndex(player){
  let index = players.findIndex(p =>{
  	 //console.log (p);
  	 //console.log (player);
    return p.id == player.id
  })
  return index;
}

function actorExistsInArray(actor){
  //for each (var guy in actors){
  actors.forEach(guy =>{
    if (guy.id == actor.id){
      return true;
    }
  });
  //}
  return false;
}

io.on('connection',(socket) => {
	console.log('WHATS UP ITS YO BOY SMASH THAT LIKE BUTTON');
  // Draw existing players.
  io.emit('remotekey',players);

	socket.on('disconnect',() => {
		console.log ("DONT FORGET TO RING THAT BELL BEFORE YOU LEAVE");
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

    // Do the same for NPCS
    if (!actorExistsInArray(grandpa)){
      actors.push(grandpa);
    }

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

});

http.listen(7777, () => {
  console.log('listening on *:7777');
});
