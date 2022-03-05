importScripts('lib/tank.js');

var sniperTime;
const sniperConstTime = 50;
var sniperDirection = 1;

tank.init(function(settings, info) {
  sniperTime = sniperConstTime;
})

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

tank.loop(function(state, control) {
	sniperCircle(state,control);
  
});