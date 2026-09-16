AB'S Learning Hub Student Animation Assets

This package contains transparent PNG assets cropped into individual files for use in the website student-journey animation.

Folder structure:
- walking_right: 16-frame side walk cycle facing right
- walking_left: 16-frame side walk cycle facing left
- walking_down: 16-frame front walk cycle moving toward/down the page
- walking_up: 16-frame back walk cycle moving away/up the page
- walking_away_right: 16-frame diagonal walk cycle moving away/up-right
- walking_towards_right: 16-frame diagonal walk cycle moving toward/down-right
- walking_away_left: 16-frame diagonal walk cycle moving away/up-left
- walking_towards_left: 16-frame diagonal walk cycle moving toward/down-left
- idle_turnaround: front / side / back / look-up idle poses
- interaction: pointing and presenting poses
- achievement: back idle, celebration, and final look-up poses

Recommended usage:
- Use the walking_* folders as loop frames in order: 1 → 16. Frame 16 is the loop-close in-between back to frame 1.
- Odd-numbered walk frames are the original key poses; even-numbered frames are generated in-betweens.
- Use the idle_turnaround / interaction / achievement images as milestone poses.
- All assets preserve transparency.

Suggested website mapping:
- Hero start: walking_away_right or walking_towards_right depending on path direction
- Course / subject stops: idle_turnaround or interaction poses
- Final section: achievement pose
