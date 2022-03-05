importScripts('lib/tank.js');

var bulletMap;
var avoidDirection;

tank.init(function(settings, info) {
  settings.SKIN = 'forest';
  bulletMap = [];
  changeAvoidDirection();
});

function changeAvoidDirection() {
  avoidDirection = Math.random() > 0.5 ? -1 : 1;
}

function dodge(state,control){
 var i, bullet, bodyAngleDelta;

  if(state.radar.enemy) {
  
    var enemyAngle = Math.deg.atan2(
      state.radar.enemy.y - state.y,
      state.radar.enemy.x - state.x
    )
   
    var radarAngleDelta = Math.deg.normalize(enemyAngle - (state.radar.angle + state.angle));
   
    control.RADAR_TURN = radarAngleDelta * 0.2;

    bodyAngleDelta = Math.deg.normalize(enemyAngle - 90 - state.angle);
    if(Math.abs(bodyAngleDelta) > 90) bodyAngleDelta += 180;
    control.TURN = bodyAngleDelta * 0.2;

    var gunAngleDelta = Math.deg.normalize(enemyAngle - (state.gun.angle + state.angle));
    control.GUN_TURN = gunAngleDelta*0.2;

    control.SHOOT = 0.1;

  } else {
    control.TURN = 0;
    control.RADAR_TURN = 1;
    bodyAngleDelta = 180;
  }

  for(i in state.radar.bullets) {
    bullet = state.radar.bullets[i];
    bullet.age = 0;
    bulletMap[bullet.id] = bullet;

    bullet.vx = bullet.speed * Math.cos(bullet.angle*(Math.PI/180));
    bullet.vy = bullet.speed * Math.sin(bullet.angle*(Math.PI/180));
    bullet.tankDistance = Math.distance(state.x, state.y, bullet.x, bullet.y);
  }

  var bulletCount = 0;
  
  for(i in bulletMap) {
    bullet = bulletMap[i];
    if(!bullet) continue;
    
    if(bullet.age > 50) {
      bulletMap[i] = null;
      continue;
    }
    
    bullet.age++;
    
    bullet.x += bullet.vx;
    bullet.y += bullet.vy;
    
    var newDistance = Math.distance(state.x, state.y, bullet.x, bullet.y);
    bullet.approachingSpeed = bullet.tankDistance - newDistance;
    bullet.tankDistance = newDistance;

 
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

tank.loop(function(state, control) {
  dodge(state,control);
});