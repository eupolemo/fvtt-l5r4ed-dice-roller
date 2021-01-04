<img alt="GitHub release (latest by date)" src="https://img.shields.io/github/v/release/eupolemo/fvtt-l5r4ed-dice-roller?style=for-the-badge"> <img alt="GitHub Releases" src="https://img.shields.io/github/downloads/eupolemo/fvtt-l5r4ed-dice-roller/latest/total?style=for-the-badge">

# fvtt-l5r4ed-dice-roller

## Description
An implementation of a dice roller to Legends of the five rings 4th Edition game system for Foundry Virtual Tabletop (http://foundryvtt.com).

[Release Notes](#release-notes)

## Roll
It captures chat message and converts to a Foundry VTT roll pattern and shows the result with the Legend of Five Rings text roll.

Example: 10k6 is converted to '/r 10d10k6x10'

### Accepts FVTT Rolls
It can be used with roll, GM roll, self roll and blind roll.

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
- [Issue #8](https://github.com/eupolemo/fvtt-l5r4ed-dice-roller/issues/8) Support FVTT rolls (roll, gm roll, self roll and blind roll)
