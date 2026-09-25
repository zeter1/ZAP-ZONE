# Weapon assets

SVG-ассеты восьми слотов ZAP ZONE: pistol, shotgun, rifle, rocket, plasma, mine, bomb и smoke.

Они используются в HUD. Трёхмерные first-person, bot и world/pickup модели строятся единым `createWeaponModel()` из `src/weapons/system.js`, поэтому один дизайн переиспользуется во всех игровых представлениях.

SVG имеют прозрачный фон и не требуют внешних изображений или шрифтов.
