import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
// The application uses Vite's ESM transform; load the pure model identically in Node.
const source=await readFile(new URL('../src/journey-model.js',import.meta.url),'utf8');
const {buildPath,pointOnRoute,chooseWalk}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const anchors=[{x:620,y:530},{x:145,y:770},{x:145,y:980},{x:58,y:1100},{x:58,y:1600},{x:560,y:1760},{x:560,y:2040},{x:614,y:2520},{x:600,y:2900}];
const {segments}=buildPath(anchors);
for(const [i,s] of segments.entries()){
 for(let j=0;j<=100;j++){
  const t=j/100,u=1-t;
  const y=u**3*s.a.y+3*u*u*t*s.c1.y+3*u*t*t*s.c2.y+t**3*s.b.y;
  const x=u**3*s.a.x+3*u*u*t*s.c1.x+3*u*t*t*s.c2.x+t**3*s.b.x;
  const sampled=pointOnRoute(segments,y);
  assert.ok(Math.abs(sampled.x-x)<.002,'Sprite must stay on the SVG curve');
  assert.ok(x>=Math.min(s.a.x,s.b.x)-.001&&x<=Math.max(s.a.x,s.b.x)+.001,'Curve must not overshoot its corridor');
 }
 if(i){const prev=segments[i-1];const incoming=(prev.b.x-prev.c2.x)/(prev.b.y-prev.c2.y);const outgoing=(s.c1.x-s.a.x)/(s.c1.y-s.a.y);assert.ok(Math.abs(incoming-outgoing)<1e-9,'Adjacent curves must have matching tangents')}
}
assert.equal(chooseWalk(-3,1).sequence,'walking_left');
assert.equal(chooseWalk(-.8,-1).sequence,'walking_away_left');
assert.equal(chooseWalk(0,1).sequence,'walking_down');
assert.equal(chooseWalk(0,-1,{facing:'vertical',side:'right'}).sequence,'walking_up');
assert.equal(chooseWalk(3,1,{facing:'vertical',side:'right'}).sequence,'walking_right');
assert.deepEqual(pointOnRoute(segments,-100),anchors[0]);
assert.deepEqual(pointOnRoute(segments,99999),anchors.at(-1));
console.log('Passed: curve continuity, corridor limits, sprite alignment, directional frames, endpoints.');
const {advanceGait}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const seen=new Set();let phase=0;for(let i=0;i<80;i++){seen.add(Math.floor(phase*8));phase=advanceGait(phase,3.5)}assert.equal(seen.size,8,'All 8 supplied frames must play during a stride');
assert.equal(advanceGait(.4,0),.4,'No walking while stationary');
const manifest=JSON.parse(await readFile(new URL('../src/animation-frames.json',import.meta.url),'utf8'));
for(const frames of Object.values(manifest)){assert.equal(frames.length,8);for(const file of frames)await readFile(new URL('../public/animation/'+file,import.meta.url))}
assert.ok(advanceGait(0,1000,16)<=.032,'Large scroll bursts must not skip entire walking cycles');
console.log('Passed: 8-frame playback, cadence limit, all 64 source frames exist.');

// Exercise the production normalizer with original and larger in-between
// images. Reusing the first frame's pixel scale would enlarge the second one.
const journey=await readFile(new URL('../src/Journey.jsx',import.meta.url),'utf8');
const normalizer=journey.match(/async function loadFrame\(file\)\{([\s\S]*?)\n\}/)[1];
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const calls=[];
const fakeDocument={createElement:()=>({getContext:()=>({drawImage:(...args)=>calls.push(args)})})};
for(const height of [677,1024]){
 const frame={source:{width:height/2,height},top:0,bottom:height-1,anchor:height/4};
 await new AsyncFunction('file','readSource','document',normalizer)('walking_left/frame.png',async()=>frame,fakeDocument);
 const [,x,y,width,renderedHeight]=calls.at(-1);
 assert.equal(renderedHeight,400,'Mixed-resolution frames must render at equal visible height');
 assert.equal(x+width/2,140,'Torso remains centered');
 assert.ok(Math.abs(y+(height-1)*400/height-432)<1e-9,'Feet remain on the shared baseline');
}
calls.length=0;
const padded={source:{width:520,height:900},top:148,bottom:874,anchor:260};
await new AsyncFunction('file','readSource','document',normalizer)('walking_down/frame.webp',async()=>padded,fakeDocument);
const [,px,py,pWidth,pHeight]=calls.at(-1);
const pScale=400/(900*.81);
assert.ok(Math.abs(pHeight-900*pScale)<1e-9,'Padded walk canvases scale from a shared canvas fraction');
assert.equal(px+pWidth/2,140,'Padded walk frames stay centered');
assert.ok(Math.abs(py+874*pScale-432)<1e-9,'Padded walk feet stay on the pose baseline');
assert.ok(Math.abs((874-148+1)*pScale-400)<12,'Walk silhouette matches the 400px idle/end pose height');
console.log('Passed: mixed-resolution frames retain identical character size and alignment.');

const {poseForSection,mountainLanding}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
assert.equal(poseForSection('about','left'),'interaction/2_point_left.webp');
assert.equal(poseForSection('whyus','right'),'interaction/3_present_right.webp');
assert.equal(poseForSection('subjects','left'),'interaction/4_present_left.webp');
assert.equal(poseForSection('future','left'),'achievement/1_back_idle.webp');
for(const [width,height] of [[922,400],[312,245],[742,340]]){
 const rect={left:80,top:100,bottom:100+height,width,height};
 const rock=mountainLanding(rect);
 assert.ok(rock.x>rect.left&&rock.x<rect.left+width);
 assert.ok(rock.y>rect.top+height*.65&&rock.y<rect.bottom,'Final feet must land on visible foreground rock');
}
console.log('Passed: checkpoint facing and responsive mountain-rock landing.');
