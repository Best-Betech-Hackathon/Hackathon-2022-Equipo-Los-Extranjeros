importScripts('lib/tank.js');

var turnDirection, turnTimer,turnTime, direction, backTimer, boostTimer,enemy_x,enemy_y;


var sniperTime;
const sniperConstTime = 50;
var sniperDirection = 1;

tank.init(function(settings, info) {
  settings.SKIN = 'forest';
  // the direction where tank will turning.
  // 1 is clockwise, -1 is couter clockwise
  turnDirection = Math.random() < 0.5 ? 1 : -1;
  turnTimer = Math.round(Math.randomRange(0, 30));
  direction = 1;
  backTimer = 0;
  sniperTime = sniperConstTime;
})


function blindSearch(state,control){
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
    
    control.SHOOT = 0.1;
  }
}
function moveSniper(state,control)
{
	if(state.radar.enemy || (state.radar.enemy && state.radar.targetingAlarm))
  {
    if(state.collisions.wall)
    {
      sniperDirection *=-1;
      sniperTime = sniperConstTime + Math.random()%100;
    }
    var enemyAngle = Math.deg.atan2(
      state.radar.enemy.y - state.y,
      state.radar.enemy.x - state.x
    )
    var bodyAngleDelta = Math.deg.normalize(enemyAngle - 90 - state.angle);
    if(Math.abs(bodyAngleDelta) > 90) bodyAngleDelta += 180;
    control.TURN = bodyAngleDelta * 0.2;
    sniperTime--;
    control.THROTTLE = sniperDirection;
    if(sniperTime == 0)
    {
    	sniperDirection *= -1;
      sniperTime = sniperConstTime + Math.random()%100;
    }
  }
}

function sniperCircle(state,control)
{
  if(!state.radar.enemy) {
    control.RADAR_TURN = 1;
  } else {
  	moveSniper(state,control);
    // find target angle to aim the enemy
    var targetAngle = Math.deg.atan2(
      state.radar.enemy.y - state.y,
      state.radar.enemy.x - state.x
    );
    var radarAngleDelta = Math.deg.normalize(targetAngle - (state.radar.angle + state.angle));
    // adjust radar direction to follow the target
    control.RADAR_TURN = radarAngleDelta*0.2;
    // STEP #1
    let bulletSpeed = 0.1;
    let enemy = state.radar.enemy;
    let distance = Math.distance(state.x, state.y, enemy.x, enemy.y)
    // STEP #2
    let bulletTime = distance / bulletSpeed;
    // STEP #3
    let targetX = enemy.x + bulletTime * enemy.speed * Math.cos(Math.deg2rad(enemy.angle));
    let targetY = enemy.y + bulletTime * enemy.speed * Math.sin(Math.deg2rad(enemy.angle));
    // STEP #4
    let gunAngle = Math.deg.normalize(targetAngle - state.angle);
    let angleDiff = Math.deg.normalize(gunAngle - state.gun.angle);
    control.GUN_TURN = 0.3 * angleDiff;
    if(Math.abs(angleDiff) < 1) {
      control.SHOOT = 1;
    }
  }
}

function kamikaze(state,control){
	if(state.collisions.enemy) {
    backTimer = 12;
    boostTimer = 40;
  }
  if(backTimer > 0) {
    backTimer--;
    direction = -1;
  } else {
    direction = 1;
  }

  if(boostTimer > 0) {
    boostTimer--;
    control.BOOST = 1;
  } else {
    control.BOOST = 0;
  }
  control.THROTTLE = direction;

  if(!state.radar.enemy) {
    control.RADAR_TURN = 1;
    if(state.collisions.wall) {
      turnTimer = Math.round(Math.randomRange(20, 50));
    }
    if(turnTimer > 0) {
      turnTimer--;
      control.THROTTLE = 0;
      control.TURN = turnDirection;
    } else {
      control.THROTTLE = direction;
      control.TURN = 0;
    }

  } else {
    // find target angle to aim the enemy
    enemy_x = state.radar.enemy.x
    enemy_y = state.radar.enemy.y;
    var targetAngle = Math.deg.atan2(
      state.radar.enemy.y - state.y,
      state.radar.enemy.x - state.x
    );

    // make sure that the angle is between (-180 and 180)
    var radarAngleDelta = Math.deg.normalize(targetAngle - (state.radar.angle + state.angle));

    // adjust radar direction to follow the target
    control.RADAR_TURN = radarAngleDelta*0.2;

    // make sure that the angle is between (-180 and 180)
    var tankAngleDelta = Math.deg.normalize(targetAngle - state.angle);


    // adjust radar direction to follow the target
    control.TURN = tankAngleDelta * 0.2;
    targetAngle = Math.deg.atan2(state.radar.enemy.y - state.y, state.radar.enemy.x - state.x);
    let gunAngle = Math.deg.normalize(targetAngle - state.angle);
    let gunAngleDiff = Math.deg.normalize(gunAngle - state.gun.angle);
    control.GUN_TURN = 0.3 * gunAngleDiff;
  }
  control.SHOOT = state.radar.enemy ? 0.3 : 0;

}
function stayFar(state,control){
  if(state.radar.enemy==null)
  {
    return true;
  }
 	return 150 <= Math.distance(state.radar.enemy.x,state.radar.enemy.y,state.x,state.y);
}
tank.loop(function(state, control) {
  blindSearch(state,control);
 	if(stayFar(state,control)){
  	sniperCircle(state,control);	
  }else{
		kamikaze(state,control);
 }
  
});