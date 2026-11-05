time set midnight
gamerule dodaylightcycle false
weather thunder
fog @a push forgotten_woods:fog_haunted_forest horror_fog
playsound forgotten_woods.forest_wind_ambience @a ~ ~ ~ 1.0 1.0
title @a titleraw {"rawtext":[{"text":"§4THE FORGOTTEN WOODS\n§7A dark fog settles in..."}]}
tellraw @a {"rawtext":[{"text":"§4[!] §cThe sun has disappeared. Midnight locked & dense horror fog pushed."}]}
