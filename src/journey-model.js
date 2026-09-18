// The route is fundamentally a function x(y) — every dot has a strictly larger y than the
// last. A neighbour-direction spline (Catmull-Rom-style) can still overshoot into a visible
// bulge whenever a sharp turn is immediately followed by a near-straight run, because the
// shared tangent at that dot is a compromise between two very different directions. A
// monotone cubic Hermite spline (Fritsch-Carlson limiter, the same technique chart
// libraries use for smooth non-overshooting lines) picks each dot's tangent from the two
// neighbouring slopes but clamps it so the curve can never bulge past either one — so it's
// smooth and passes through every dot, with no overshoot regardless of how the dots zig-zag.
export function buildPath(dots){
 const n=dots.length,h=[],slope=[];
 for(let i=0;i<n-1;i++){h[i]=dots[i+1].y-dots[i].y;slope[i]=h[i]?(dots[i+1].x-dots[i].x)/h[i]:0}
 const m=new Array(n);
 m[0]=slope[0];m[n-1]=slope[n-2];
 for(let i=1;i<n-1;i++)m[i]=(slope[i-1]<0)!==(slope[i]<0)||slope[i-1]===0||slope[i]===0?0:(slope[i-1]+slope[i])/2;
 for(let i=0;i<n-1;i++){
  if(slope[i]===0){m[i]=0;m[i+1]=0;continue}
  const a=m[i]/slope[i],b=m[i+1]/slope[i],len=Math.hypot(a,b);
  if(len>1.47){const t=1.47/len;m[i]=t*a*slope[i];m[i+1]=t*b*slope[i]}
 }
 const segments=[];
 for(let i=0;i<n-1;i++){
  const a=dots[i],b=dots[i+1],hh=h[i];
  segments.push({a,b,c1:{x:a.x+m[i]*hh*.68,y:a.y+hh*.68},c2:{x:b.x-m[i+1]*hh*.68,y:b.y-hh*.68}});
 }
 let d=`M ${dots[0].x} ${dots[0].y}`;
 segments.forEach(s=>{d+=` C ${s.c1.x} ${s.c1.y}, ${s.c2.x} ${s.c2.y}, ${s.b.x} ${s.b.y}`});
 return {d,segments};
}
// Long handles round each bend. Invert the monotonic y coordinate so the
// character uses exactly the curve drawn by SVG, including the widened turns.
export function pointOnRoute(segments,y){
 const first=segments[0],last=segments.at(-1);
 if(y<=first.a.y)return first.a;if(y>=last.b.y)return last.b;
 const seg=segments.find(s=>s.b.y>=y)||last;
 let lo=0,hi=1;
 for(let i=0;i<20;i++){const t=(lo+hi)/2,u=1-t;const py=u*u*u*seg.a.y+3*u*u*t*seg.c1.y+3*u*t*t*seg.c2.y+t*t*t*seg.b.y;if(py<y)lo=t;else hi=t}
 const t=(lo+hi)/2,u=1-t;
 return {x:u*u*u*seg.a.x+3*u*u*t*seg.c1.x+3*u*t*t*seg.c2.x+t*t*t*seg.b.x,y};
}
// Per-frame dx from the eased bezier position is noisy near curve peaks/troughs (near-zero
// slope flips sign frame to frame). Hysteresis on sideways / diagonal / vertical facing
// and on left/right keeps that noise from swapping sprite sequences every frame.
const SIDE_ENTER=2.2,SIDE_EXIT=.9,VERT_ENTER=.45,VERT_EXIT=1.1,FACE_DEADZONE=.5;
export function chooseWalk(dx,direction,prev={facing:'depth',side:'right'}){
 let facing=prev.facing;
 const adx=Math.abs(dx);
 if(facing==='sideways'){
  if(adx<SIDE_EXIT)facing=adx<VERT_ENTER?'vertical':'depth';
 }else if(facing==='vertical'){
  if(adx>VERT_EXIT)facing=adx>SIDE_ENTER?'sideways':'depth';
 }else{
  if(adx>SIDE_ENTER)facing='sideways';
  else if(adx<VERT_ENTER)facing='vertical';
 }
 let side=prev.side;
 if(dx>FACE_DEADZONE)side='right';else if(dx<-FACE_DEADZONE)side='left';
 const sequence=facing==='sideways'?`walking_${side}`:facing==='vertical'?(direction<0?'walking_up':'walking_down'):`walking_${direction<0?'away':'towards'}_${side}`;
 return {sequence,facing,side};
}
export function poseForSection(id,side='right'){
 if(id==='future')return 'achievement/1_back_idle.webp';
 if(['courses','about'].includes(id))return `interaction/${side==='right'?'1_point_right':'2_point_left'}.webp`;
 if(['subjects','whyus'].includes(id))return `interaction/${side==='right'?'3_present_right':'4_present_left'}.webp`;
 return `idle_turnaround/${side==='right'?'2_idle_side_right':'3_idle_side_left'}.webp`;
}
// Match the rock to the image's CSS cover crop, anchored at the bottom.
export function mountainLanding(rect){
 const scale=Math.max(rect.width/1672,rect.height/941);
 return {x:rect.left+(rect.width-1672*scale)*.5+1672*scale*.44,y:rect.bottom-941*scale*.15};
}


export function advanceGait(phase,distance,dt=16){
 const step=Math.abs(distance);
 if(!step)return phase;
 // Distance drives the stride. A small time floor keeps slow smoothed-scroll
 // ticks from freezing the cycle; the cap stops fast wheel bursts skipping poses.
 return (phase+Math.min(Math.max(step/144,dt/720),dt/500))%1;
}
