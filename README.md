<img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/eupolemo/fvtt-l5r4ed-dice-roller?style=for-the-badge"> <img alt="GitHub Releases" src="https://img.shields.io/github/downloads/eupolemo/fvtt-l5r4ed-dice-roller/latest/total?style=for-the-badge">

# fvtt-l5r4ed-dice-roller

## Description

An implementation of a dice roller to Legends of the five rings 4th Edition game system for Foundry Virtual Tabletop (http://foundryvtt.com).

[Release Notes](#release-notes)

## Roll

It captures chat message and converts to a Foundry VTT roll pattern and shows the result with the Legend of Five Rings text roll.

- It makes roll with different explosion numbers;
- Accepts Untrained rolls;
- Accepts Emphases rolls;

Syntax Allowed: XkYxZ+A or uXkY+A or eXkYxZ+A

- u = untrained roll (no explosion);
- e = emphasis roll (reroll the 1 of the first roll);
- X = Number of rolled dice;
- Y = Number of kept dice;
- Z = Number equal or higher to explode;
- A = Bonus applied.

Example:

- 10k6 is converted to '/r 10d10k6x>=10'
- 10k8x9 is converted to '/r 10d10k8x>=9'
- u10k7 is converted to '/r 10d10k7'
- e10k5x8 is converted to '/r 10d10r1k5x>=8

### Accepts FVTT Rolls

It can be used with roll, GM roll, self roll, blind roll and deferred inline roll.

Example:

- /r or /roll 6k5;
- /gmr or /gmroll 6k5;
- /sr or /selfroll 6k5;
- /br or /broll or /blindroll 6k5;
- Message [[/r 6k5]] works well;

<img src="readme-resources/roll-l5r.gif"/>

## Release Notes

### 1.0.0

- First release

### 1.0.1

- [Issue #6](https://github.com/eupolemo/fvtt-l5r4ed-dice-roller/issues/6) Support to FoundryVTT 0.7.9

### 1.1.0

- [Issue #8](https://github.com/eupolemo/fvtt-l5r4ed-dice-roller/issues/8) Support FVTT rolls (roll, gm roll, self roll, blind roll and inline deferred rolls)

### 1.2.0

- [Issue #17](https://github.com/eupolemo/fvtt-l5r4ed-dice-roller/issues/17) Allow syntax to explode values equal or higher than a number

### 1.3.0

- [Issue #7](https://github.com/eupolemo/fvtt-l5r4ed-dice-roller/issues/7) Discard excess dices from keep when have less than 10 dices on roll
- [Issue #16](https://github.com/eupolemo/fvtt-l5r4ed-dice-roller/issues/17) Added untrained and emphasis roll
