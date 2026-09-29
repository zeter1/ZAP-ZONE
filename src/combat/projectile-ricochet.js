// Shared ricochet policy for player and bot firearm projectiles.
// Collision/penetration stays in combat.js; this owner only decides/executes bounce math.
const PROJECTILE_RICOCHET_MAX=1;
const PROJECTILE_RICOCHET_OFFSET=.09;
const PROJECTILE_RICOCHET_RETENTION=Object.freeze({
  metal:Object.freeze({speedRetention:.66,damageRetention:.56}),
  concrete:Object.freeze({speedRetention:.54,damageRetention:.56}),
  wood:Object.freeze({speedRetention:.54,damageRetention:.56})
});
const PLAYER_PROJECTILE_RICOCHET=Object.freeze({
  metal:Object.freeze({limit:.48,chance:.82}),
  concrete:Object.freeze({limit:.30,chance:.42}),
  wood:Object.freeze({limit:.16,chance:.08})
});
const ENEMY_PROJECTILE_RICOCHET=Object.freeze({
  metal:Object.freeze({limit:.46,chance:.76}),
  concrete:Object.freeze({limit:.27,chance:.30}),
  wood:Object.freeze({limit:.12,chance:.04})
});
function projectileRicochetMaterial(surface){return surface==='metal'?'metal':surface==='wood'?'wood':'concrete';}
function projectileRicochetPolicy(surface,playerOwned=false){
  const material=projectileRicochetMaterial(surface);
  const likelihood=(playerOwned?PLAYER_PROJECTILE_RICOCHET:ENEMY_PROJECTILE_RICOCHET)[material];
  const retention=PROJECTILE_RICOCHET_RETENTION[material];
  return{material,...likelihood,...retention,maxRicochets:PROJECTILE_RICOCHET_MAX,offset:PROJECTILE_RICOCHET_OFFSET};
}
function rollProjectileRicochet(surface,incidence,ricochets,playerOwned=false,random=Math.random){
  const policy=projectileRicochetPolicy(surface,playerOwned);
  const used=Number.isFinite(ricochets)?Math.max(0,ricochets):0;
  if(!Number.isFinite(incidence)||incidence<0||incidence>=policy.limit||used>=policy.maxRicochets)return null;
  const sample=Number(random());
  if(!Number.isFinite(sample)||sample<0||sample>=1)return null;
  return sample<policy.chance?policy:null;
}
function reflectProjectileDirection(direction,normal,out){
  if(!direction||!normal||!out)return null;
  return out.copy(direction).reflect(normal).normalize();
}
