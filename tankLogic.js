importScripts('lib/tank.js');

var turnDirection, turnTimer,turnTime, direction, backTimer, boostTimer,enemy_x,enemy_y;
var bulletMap;

var turnTimer,avoidDirection;

var verticalAngle;
var horizontalAngle,shootAngle,timer = 0;

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
  bulletMap = [];
  changeAvoidDirection();
  turnTimer = Math.round(Math.randomRange(0, 30));

  verticalAngle = Math.random() < 0.5 ? -90 : +90;
  horizontalAngle = Math.random() < 0.5 ? 0 : -180;
  // find direction that is opposite to the corner where the tank is
  shootAngle = Math.deg.normalize(verticalAngle + horizontalAngle)/2;
  if(horizontalAngle == 0) {
    shootAngle += 180;
  }
})

function shooter(state,control){
  var angleDelta = Math.deg.normalize(shootAngle + 20*Math.sin(timer*0.1) - state.angle);
  control.TURN = angleDelta * 0.2;
  control.SHOOT = 0.1;
  control.DEBUG.strategy = "shootStrategy:" + shootAngle;
}
// randomly change direction of movement
function changeAvoidDirection() {
  avoidDirection = Math.random() > 0.5 ? -1 : 1;
}
function detectAndAvoidWalls(state,control)
{
	if(state.collisions.wall || state.collisions.enemy || state.collisions.ally) {
    turnTimer = Math.round(Math.randomRange(20, 50));
    control.DEBUG =  "collision";
  }
  if(turnTimer > 0) {
    turnTimer--;
    // when turnTimer is on, do not move forward because there is
    // probably an obstacle in front of you. Turn instead.
    control.THROTTLE = 0;
    control.TURN = avoidDirection;
    return true;
  } else {
    // keep going forward at full speed
    control.THROTTLE = 1;
    control.TURN = 0;
    return false;
  }
}
function dodgeBullets(state,control)
{
  var i, bullet, bodyAngleDelta;

  // Rotate radar around to find an enemy.
  // When enemy found, keep radar beam on him  
  if(state.radar.enemy) {
    // calculate angle of the enemy relating to your tank
    // this is the angle that you should aim your radar and gun to
    var enemyAngle = Math.deg.atan2(
      state.radar.enemy.y - state.y,
      state.radar.enemy.x - state.x
    )
    // calculate the difference between current and desired angle
    // of the radar.
    var radarAngleDelta = Math.deg.normalize(enemyAngle - (state.radar.angle + state.angle));
    // Turn the radar. If the difference between current and desired
    // angle is getting smaller, speed of turning will get lower too.
    // When the difference will be zero, turning will stop.
    control.RADAR_TURN = radarAngleDelta * 0.2;

    // Turn body of the tank so it is perpendicular to the enemyAngle
    // it will be easier to dodge bullets by moving back and forth
    bodyAngleDelta = Math.deg.normalize(enemyAngle - 90 - state.angle);
    if(Math.abs(bodyAngleDelta) > 90) bodyAngleDelta += 180;
    control.TURN = bodyAngleDelta * 0.2;

  } else {
    // keep searching for opponents
    control.TURN = 0;
    control.RADAR_TURN = 1;
    bodyAngleDelta = 180;
  }

  // find bullets using radar
  for(i in state.radar.bullets) {
    bullet = state.radar.bullets[i];
    bullet.age = 0;
    bulletMap[bullet.id] = bullet;

    // calculate velocity components and distance between bullet and the tank
    bullet.vx = bullet.speed * Math.cos(bullet.angle*(Math.PI/180));
    bullet.vy = bullet.speed * Math.sin(bullet.angle*(Math.PI/180));
    bullet.tankDistance = Math.distance(state.x, state.y, bullet.x, bullet.y);
  }

  var bulletCount = 0;
  // predict position of all bullets scanned so far
  for(i in bulletMap) {
    bullet = bulletMap[i];
    if(!bullet) continue;
    // skip bullets that was not updated for long time
    // if they were not spotted by radar recently, they
    // probably are too far or hit something
    if(bullet.age > 50) {
      bulletMap[i] = null;
      continue;
    }
    // track age of the bullet so they can be removed if out-dated
    bullet.age++;
    // predict position of the bullet basing on its velocity
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    // calculate distance between bullet and the tank. It will be used to
    // find how fast the distance is changing
    var newDistance = Math.distance(state.x, state.y, bullet.x, bullet.y);
    bullet.approachingSpeed = bullet.tankDistance - newDistance;
    bullet.tankDistance = newDistance;

    // If distance between tank and the bullet is negative, it means that it
    // is moving away from the tank and can be ignored (if will not hit it)
    //
    // In addition, if the speed of approaching the tank is too low, it means
    // that the trajectory of the bullet is away of the tank and it will
    // not hit it. Such bullets can be ignored too. The threshold value set
    // experimentally to 3.85
    if(bullet.approachingSpeed < 3.85) {
      bulletMap[i] = null;
      continue;
    }
    // count how many bullets are really dangerous and will probably hit the tank
    bulletCount++;
  }

  // avoid bullets when any of them is aiming at you and
  // you are rotated in a way that you can dodge it
  if(bulletCount && Math.abs(bodyAngleDelta) < 45) {
    control.BOOST = 1;
    control.THROTTLE = avoidDirection;
  } else {
    control.BOOST = 0;
    control.THROTTLE = 0;
    // change direction of bullets dodging
    changeAvoidDirection();
  }
}
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
    let bulletSpeed = 5;
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
    if(state.energy > 50 || state.energy > state.radar.enemy.energy)
    {
			kamikaze(state,control);
    }
    else{
      dodgeBullets(state,control);
      detectAndAvoidWalls(state,control);
      shooter(state,control);
    }
 }
   
  
});