importScripts('lib/tank.js');

// Don't know where to start?
// Read Getting Started in "Docs" section 

tank.init(function(settings, info) {
	// initialize tank here
  turnTime = 0;
});

function searchEnemy(state, control){
  if(!state.radar.enemy) {
    	control.GUN_TURN = 1;
    	control.SHOOT = 0.1;
      control.RADAR_TURN = 1;
    	if(state.collisions.wall || turnTime > 0 || state.radar.enemy) {
    control.THROTTLE = 0;
  } else {
    control.THROTTLE = 1;
    
    
    //control.GUN_TURN = Math.deg.normalize(90 - state.angle); 
    
  }

  if(state.collisions.wall) {
    // start turning when hitting a wall
    turnTime = 10;
    
  }

  // keep turning whenever turn timer is above zero
  // reduce the timer with each step of the simulation
  if(turnTime > 0) {
    control.TURN = 1;
    turnTime--;
  } else {
    control.TURN = 0;
  }
  } else {
    control.RADAR_TURN = 0;
    
    //let targetAngle = Math.deg.atan2(state.radar.enemy.y - state.y, state.radar.enemy.x - state.x);
    
    
    // Step #1
  let targetAngle = Math.deg.atan2(state.radar.enemy.y - state.y, state.radar.enemy.x - state.x);
  let bodyAngleDiff = Math.deg.normalize(targetAngle - state.angle);
  control.TURN = 0.5 * bodyAngleDiff;
    
    let gunAngle = Math.deg.normalize(targetAngle - state.angle);
    let gunAngleDiff = Math.deg.normalize(gunAngle - state.gun.angle);
    control.GUN_TURN = 0.3 * gunAngleDiff;
    
    let targetDistance = Math.distance(state.x, state.y, state.radar.enemy.x, state.radar.enemy.y);
  let distanceDiff = targetDistance - 150;
  control.THROTTLE = distanceDiff/100;
    
    control.SHOOT = 0.5;
  }
}

tank.loop(function(state, control) {
	// write your tank logic here
  searchEnemy(state, control)
  
});


