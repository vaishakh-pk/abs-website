AB'S Learning Hub Student Animation Assets

This package contains transparent PNG assets cropped into individual files for use in the website student-journey animation.

Folder structure:
- walking_right: 8-frame side walk cycle facing right
- walking_left: 8-frame side walk cycle facing left
- walking_down: 8-frame front walk cycle moving toward/down the page
- walking_up: 8-frame back walk cycle moving away/up the page
- walking_away_right: 8-frame diagonal walk cycle moving away/up-right
- walking_towards_right: 8-frame diagonal walk cycle moving toward/down-right
- walking_away_left: 8-frame diagonal walk cycle moving away/up-left
- walking_towards_left: 8-frame diagonal walk cycle moving toward/down-left
- idle_turnaround: front / side / back / look-up idle poses
- interaction: pointing and presenting poses
- achievement: back idle, celebration, and final look-up poses

Recommended usage:
- Use the walking_* folders as loop frames in order: 1 → 8. Frame 8 loops into frame 1 (contact → down → passing → up, twice).
- Rebuild from key PNGs with: python3 scripts/build-8frame-walks.py (keys in assets/walk-keys-v7).
- Use the idle_turnaround / interaction / achievement images as milestone poses.
- All assets preserve transparency.

Suggested website mapping:
- Hero start: walking_away_right or walking_towards_right depending on path direction
- Course / subject stops: idle_turnaround or interaction poses
- Final section: achievement pose
