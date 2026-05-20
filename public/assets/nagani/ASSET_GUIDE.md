# Nagani Asset Guide

This folder stores optional frontend assets for the Nagani casino UI.

Do not create empty .webp or .mp3 files.
Only place real image/audio files here.

## Symbols

Path:

public/assets/nagani/symbols/

Expected files:

dragon.webp
ruby.webp
gold.webp
coin.webp
chinthe.webp
lotus.webp
jade.webp
firepearl.webp
tiger.webp
koi.webp
pattern.webp
ten.webp
a.webp
k.webp
q.webp
j.webp

Used by:

app/components/nagani/DragonSlotBoard.tsx

## Lobby Cards

Path:

public/assets/nagani/cards/

Expected files:

red-dragon-myanmar.webp
dragons-peak.webp
golden-buffalo.webp
green-valley.webp

Used by:

app/lobby/page.tsx

## Promo Banners

Path:

public/assets/nagani/banners/

Expected files:

red-dragon.webp
daily-vault.webp
provider-network.webp

Used by:

app/lobby/page.tsx

## Game Session UI

Path:

public/assets/nagani/backgrounds/

Expected files:

game-session.webp

Path:

public/assets/nagani/ui/

Expected files:

cabinet-frame.webp
spin-button.webp

Path:

public/assets/nagani/effects/

Expected files:

fire-glow.webp

Used by:

app/page.tsx

## Sounds

Path:

public/assets/nagani/sounds/

Expected files:

button.mp3
spin.mp3
reel-stop.mp3
win.mp3
big-win.mp3

Used by:

app/lib/naganiSound.ts

Important:

SOUND_ASSETS_READY is currently false.
After real MP3 files are added and tested, change it to true in:

app/lib/naganiSound.ts