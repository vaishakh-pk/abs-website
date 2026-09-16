import React, {useEffect, useRef, useState} from 'react';
import {buildPath, chooseWalk, pointOnRoute, poseForSection, advanceGait, mountainLanding} from './journey-model';

import sequences from './animation-frames.json';

const poseFiles=['idle_turnaround/2_idle_side_right.png','idle_turnaround/3_idle_side_left.png','interaction/1_point_right.png','interaction/2_point_left.png','interaction/3_present_right.png','interaction/4_present_left.png','achievement/1_back_idle.png','achievement/2_celebrate_front.png'];
const cycleOrder=[...new Set(['walking_down','walking_up','walking_right','walking_left',...Object.keys(sequences)])];
const frameFiles=[...poseFiles,...cycleOrder.flatMap(name=>sequences[name]||[])];
const frameCache=new Map();
function getFrame(file){
 if(!frameCache.has(file))frameCache.set(file,loadFrame(file).catch(error=>{frameCache.delete(file);throw error}));
 return frameCache.get(file);
}

// Frames have mixed source resolutions. Normalize each visible silhouette,
// keeping its torso centered and its feet on the same baseline.
async function readSource(file){
 const img=new Image();img.src=`/animation/${file}`;await img.decode();
 const source=document.createElement('canvas');source.width=img.naturalWidth;source.height=img.naturalHeight;
 const ctx=source.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
 const {data}=ctx.getImageData(0,0,source.width,source.height);let left=source.width,top=source.height,right=0,bottom=0;
 for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++)if(data[(y*source.width+x)*4+3]>100){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y)}
 if(right<=left||bottom<=top)throw new Error(`Empty frame: ${file}`);
 const torsoTop=Math.round(top+(bottom-top)*.35),torsoBottom=Math.round(top+(bottom-top)*.57);
 let total=0,count=0;
 for(let y=torsoTop;y<torsoBottom;y++)for(let x=left;x<=right;x++)if(data[(y*source.width+x)*4+3]>100){total+=x;count++}
 return {source,left,top,right,bottom,anchor:count?total/count:(left+right)/2};
}
async function loadFrame(file){
 const source=await readSource(file);
 const scale=400/(source.bottom-source.top+1);
 const normalized=document.createElement('canvas');normalized.width=280;normalized.height=440;
 normalized.getContext('2d').drawImage(source.source,140-source.anchor*scale,432-source.bottom*scale,source.source.width*scale,source.source.height*scale);
 return normalized;
}

export default function Journey(){
 const character=useRef(null),canvas=useRef(null);const [geometry,setGeometry]=useState({width:1200,height:3300,dots:[],segments:[],d:''});
 useEffect(()=>{const main=document.querySelector('main');const measure=()=>{const width=main.clientWidth,height=main.clientHeight,mobile=width<=1100;
 const bounds=selector=>{const r=document.querySelector(selector).getBoundingClientRect(),m=main.getBoundingClientRect();return {left:r.left-m.left,right:r.right-m.left,top:r.top-m.top,bottom:r.bottom-m.top,height:r.height,width:r.width}};
 const textRight=selector=>Math.max(...Array.from(document.querySelector(selector).querySelectorAll('h2,p,.button')).map(el=>{const range=document.createRange();range.selectNodeContents(el);return range.getBoundingClientRect().right-main.getBoundingClientRect().left}));
 const section=id=>bounds('#'+id);
 const home=section('home'),courses=section('courses'),subjects=section('subjects'),why=section('whyus'),about=section('about'),future=section('future');
 const dot=(id,x,y,stop=false)=>({id,x,y,stop});
 const gutter=width<=1000?38:58,courseLane=Math.max(gutter,Math.min(width*.115,bounds('.signpost').left-36));
 const featureLeft=bounds('.feature-grid').left;
 const middle=(textRight('#whyus .copy')+featureLeft)/2;
 const sceneLane=Math.max(textRight('#about .copy')+82,width*.48);
 const futureLane=Math.max(textRight('#future .copy')+82,width*.47);
 const mountain=bounds('.mountains'),landing=mountainLanding(mountain);
 const contentTargets=Object.fromEntries(Object.entries({home:'.hero-copy',courses:'.stream-grid',subjects:'.subject-grid',whyus:'.feature-grid',about:'#about .copy',future:'#future .copy'}).map(([id,selector])=>{const r=bounds(selector);return [id,{x:(r.left+r.right)/2,...section(id)}]}));
 // Every change of lane has a reserved, measured gap. The course route passes
 // left of the signpost; the wide middle turn sits BELOW the books and ABOVE
 // the next heading. Contact ends above the cards, without sweeping over them.
 const compactLane=width<=600?26:36;
 const dots=mobile?[
 dot('home',width*.45,home.bottom-35,true),
 dot('courses',compactLane,courses.top+30),dot('courses',compactLane,courses.bottom-75,true),
 dot('subjects',compactLane-3,subjects.top+110),dot('subjects',compactLane,subjects.bottom-65,true),
 dot('whyus',compactLane-3,why.top+110),dot('whyus',compactLane,why.bottom-60,true),
 dot('about',compactLane-3,about.top+about.height*.60,true),
 dot('future',compactLane,mountain.top+mountain.height*.40),
 dot('future',landing.x,landing.y,true)
 ]:[
 dot('home',width*.49,home.bottom-85,true),
 dot('courses',courseLane,bounds('.signpost').top-24),
 dot('courses',courseLane,courses.bottom-140,true),
 dot('subjects',gutter,subjects.top-12),
 dot('subjects',gutter,bounds('.books').bottom+28,true),
 dot('whyus',middle,why.top-28),
 dot('whyus',middle,why.top+why.height*.70,true),
 dot('about',sceneLane,about.top+about.height*.86,true),
 dot('future',futureLane,mountain.top+mountain.height*.40),
 dot('future',landing.x,landing.y,true)
 ];
 const {d,segments}=buildPath(dots);setGeometry({width,height,dots,segments,d,contentTargets})};
 const observer=new ResizeObserver(measure);observer.observe(main);measure();return()=>observer.disconnect()},[]);
 useEffect(()=>{if(!geometry.dots.length)return;let disposed=false,raf=0,lastDraw='',currentY=geometry.dots[0].y,walkClock=0,direction=1,gaitX=geometry.dots[0].x,gaitY=currentY,lastMove=0,walk={facing:'depth',side:'right'},locked=null;
 const frames=new Map();const reduced=matchMedia('(prefers-reduced-motion: reduce)');const main=document.querySelector('main');const ctx=canvas.current.getContext('2d');
 let transition=null;
 const draw=(file,time,nextFile=null,mix=0)=>{const frame=frames.get(file);if(!frame)return;
 const changed=file!==lastDraw;
 const oldGroup=lastDraw.split('/')[0],newGroup=file.split('/')[0];
 if(changed&&lastDraw&&oldGroup!==newGroup&&!reduced.matches){
  const previous=document.createElement('canvas');previous.width=280;previous.height=440;previous.getContext('2d').drawImage(canvas.current,0,0);
  transition={previous,start:time};
 }
 if(changed||transition||nextFile){ctx.clearRect(0,0,280,440);ctx.globalCompositeOperation='lighter';const blend=transition?Math.min(1,(time-transition.start)/100):1;
  if(transition&&blend<1){ctx.globalAlpha=1-blend;ctx.drawImage(transition.previous,0,0)}
  const nextFrame=nextFile&&frames.get(nextFile);
  ctx.globalAlpha=blend*(nextFrame?1-mix:1);ctx.drawImage(frame,0,0);
  if(nextFrame&&mix>0){ctx.globalAlpha=blend*mix;ctx.drawImage(nextFrame,0,0)}ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
  if(blend===1)transition=null;
  lastDraw=file;character.current.dataset.frame=file;
 }};
 const stopPoints=geometry.dots.filter(p=>p.stop);
 const routeY=()=>Math.max(geometry.dots[0].y,Math.min(geometry.dots.at(-1).y,reduced.matches?geometry.dots[0].y:scrollY+innerHeight*.70-main.offsetTop));
 const place=()=>{
  currentY=routeY();
  const point=pointOnRoute(geometry.segments,currentY);
  character.current.style.transform=`translate3d(${point.x}px,${point.y}px,0) translate(-50%,-98%)`;
  return point;
 };
 // Extra in-between frames stretch the stride, not the cadence. Interaction poses
 // are held only after motion settles, so the character never slides while pointing.
 const ENTER=30,EXIT=48;
 let lastTime=0,activeSection='';
 const sectionElements=Array.from(document.querySelectorAll('.section')); 
 const render=time=>{raf=0;if(disposed)return;const dt=Math.min(40,time-lastTime||16);lastTime=time;
 const oldY=gaitY,oldX=gaitX;
 const point=place();
 direction=currentY===oldY?direction:(currentY>oldY?1:-1);
 const closest=stopPoints.reduce((a,b)=>Math.abs(b.y-currentY)<Math.abs(a.y-currentY)?b:a);
 const distToClosest=Math.abs(closest.y-currentY);
 // Hysteresis: once locked onto a milestone, stay anchored there until scrolled well clear of
 // it, instead of flickering between the walking and interacting pose right at the boundary.
 if(locked){if(Math.abs(locked.y-currentY)>EXIT)locked=null}else if(distToClosest<ENTER)locked=closest;
 const near=locked;
 const distance=Math.hypot(point.x-oldX,currentY-oldY);
 gaitX=point.x;gaitY=currentY;
 // Position is pinned to scrollY on every scroll tick. Gait uses path distance
 // since the last paint, with a short hold so paced-scroll gaps do not flash idle.
 const moving=!reduced.matches&&distance>.35;
 if(moving)lastMove=time;
 const walking=!reduced.matches&&(moving||(lastMove&&time-lastMove<90));
 const arrived=currentY>=geometry.dots.at(-1).y-.5;
 const section=arrived?'future':near?.id||Object.entries(geometry.contentTargets).find(([,r])=>currentY>=r.top&&currentY<r.bottom)?.[0]||closest.id;
 const facing=(geometry.contentTargets[section]?.x??point.x+1)>=point.x?'right':'left';
 character.current.dataset.facing=arrived?'back':facing;
 character.current.dataset.docked=String(arrived);
 const enteringMountain=currentY>=geometry.dots.at(-2).y;
 if(walking){
  if(moving){
   walkClock=advanceGait(walkClock,distance,dt);
   const ahead=pointOnRoute(geometry.segments,currentY+direction*4);
   walk=chooseWalk(ahead.x-point.x,direction,walk);
   if(enteringMountain&&direction>0)walk={...walk,sequence:`walking_away_${ahead.x>=point.x?'right':'left'}`};
  }
  const cycle=sequences[walk.sequence];
  // Switch only to fully decoded cycles; never display a partial load out of order.
  if(cycle.every(file=>frames.has(file))){const progress=walkClock*cycle.length,index=Math.floor(progress)%cycle.length;draw(cycle[index],time,cycle[(index+1)%cycle.length],progress-Math.floor(progress));}
  character.current.dataset.state='walking';
 }else{
  draw(arrived?poseForSection('future'):near&&section!=='future'?poseForSection(section,facing):`idle_turnaround/${facing==='right'?'2_idle_side_right':'3_idle_side_left'}.png`,time);
  character.current.dataset.state=near?'interacting':'idle';
 }
 character.current.dataset.section=section;
 const active=near?section:'';if(active!==activeSection){sectionElements.forEach(el=>{if(el.id===active)el.dataset.journeyActive='true';else delete el.dataset.journeyActive});activeSection=active;}
 if(!reduced.matches&&(walking||transition))raf=requestAnimationFrame(render);
 };
 const wake=()=>{if(!raf)raf=requestAnimationFrame(render)};
 const onScroll=()=>{wake()};
 // Decode the idle pose first, then warm all loops with a bounded work queue.
 (async()=>{const first=poseFiles[0];try{frames.set(first,await getFrame(first));if(disposed)return;draw(first,performance.now());wake()}catch{}let index=0;await Promise.all(Array.from({length:3},async()=>{while(index<frameFiles.length&&!disposed){const file=frameFiles[index++];try{frames.set(file,await getFrame(file));if(!disposed)wake()}catch{ /* Keep the already-decoded pose if a frame cannot load. */ }}}))})();
 currentY=routeY();gaitX=pointOnRoute(geometry.segments,currentY).x;gaitY=currentY;
 onScroll();addEventListener('scroll',onScroll,{passive:true});reduced.addEventListener('change',onScroll);
 return()=>{disposed=true;cancelAnimationFrame(raf);removeEventListener('scroll',onScroll);reduced.removeEventListener('change',onScroll);document.querySelectorAll('[data-journey-active]').forEach(el=>delete el.dataset.journeyActive)};
 },[geometry]);
 // The traveller is a sibling of .journey (not nested inside it) so its z-index can be
 // toggled independently: behind the section content it would otherwise stand on top of
 // in the text/card-heavy sections, but back in front for the "backdrop photo" sections
 // (home/about/future) where it's meant to stand in the scene rather than behind it — see
 // the [data-section] z-index rule in style.css.
 return <>
 <div className="journey" aria-hidden="true"><svg viewBox={`0 0 ${geometry.width} ${geometry.height}`}><path className="path-glow" d={geometry.d}/><path d={geometry.d}/>{geometry.dots.filter(p=>p.stop&&p.id!=='future').map((p,i)=><g key={i}><circle cx={p.x} cy={p.y} r="10" className="dot-halo"/><circle cx={p.x} cy={p.y} r="6"/></g>)}</svg></div>
 <div ref={character} className="traveller" aria-hidden="true"><canvas ref={canvas} width="280" height="440"/></div>
 </>
}
