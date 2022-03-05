importScripts('lib/tank.js');

var sniperTime;
var sniperDirection = 1;
tank.init(function(settings, info) {
  sniperTime =100;
})

function moveSniper(state,control)
{
	if(state.radar.enemy && state.radar.targetingAlarm)
  {
    if(state.collisions.wall)
    {
      sniperDirection *=-1;
      sniperTime = 100;
    }
    var enemyAngle = Math.deg.atan2(
      state.radar.enemy.y - state.y,
      state.radar.enemy.x - state.x
    )
    var bodyAngleDelta = Math.deg.normalize(enemyAngle - 90 - state.angle);
    if(Math.abs(bodyAngleDelta) > 90) bodyAngleDelta += 180;
    control.TURN = bodyAngleDelta * 0.2;
    control.BOOST = 1;
    sniperTime--;
    control.THROTTLE = sniperDirection;
    if(sniperTime == 0)
    {
    	sniperDirection *= -1;
      sniperTime = 100;
    }
  }
}

function sniperCircle(state,control)
{
  moveSniper(state,control);
  if(!state.radar.enemy) {
    control.RADAR_TURN = 1;
  } else {
    // find target angle to aim the enemy
    var targetAngle = Math.deg.atan2(
      state.radar.enemy.y - state.y,
      state.radar.enemy.x - state.x
    );
    var radarAngleDelta = Math.deg.normalize(targetAngle - (state.radar.angle + state.angle));
    // adjust radar direction to follow the target
    control.RADAR_TURN = radarAngleDelta*0.2;
    var gunAngleDelta = Math.deg.normalize(targetAngle - (state.gun.angle + state.angle));
    // adjust radar direction to follow the target
    control.GUN_TURN = gunAngleDelta * 0.2;
    if(Math.abs(gunAngleDelta) < 3) { // gun aimed at the target
      control.SHOOT = 1;
    }
  }
}

tank.loop(function(state, control) {
	sniperCircle(state,control);
  
});