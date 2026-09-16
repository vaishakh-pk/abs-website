import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const atlasSource=await readFile(new URL('../src/frame-atlas.js',import.meta.url),'utf8');
const {opaqueBounds,unionBounds,atlasLayout,FOOT_Y}=await import(`data:text/javascript;base64,${Buffer.from(atlasSource).toString('base64')}`);

const boxA={left:10,top:30,right:90,bottom:400};
const boxB={left:0,top:25,right:110,bottom:395};
const shared=unionBounds([boxA,boxB]);
const layoutA=atlasLayout(boxA);
const layoutUnionA=atlasLayout(shared);
const layoutUnionB=atlasLayout(shared);
assert.ok(Math.abs(layoutA.y+layoutA.h-FOOT_Y)<1e-6,'Single-frame layout must foot-align to FOOT_Y');
assert.ok(Math.abs(layoutUnionA.y+layoutUnionA.h-FOOT_Y)<1e-6,'Union layout must foot-align to FOOT_Y');
assert.equal(layoutUnionA.scale,layoutUnionB.scale,'Union box must use one scale for every frame in a cycle');
assert.equal(layoutUnionA.w,layoutUnionB.w,'Union box must use one width for every frame in a cycle');

const w=8,h=8,data=new Uint8ClampedArray(w*h*4);
for(let y=2;y<6;y++)for(let x=3;x<7;x++)data[(y*w+x)*4+3]=255;
const bounds=opaqueBounds(w,h,data);
assert.deepEqual(bounds,{left:3,top:2,right:6,bottom:5});

console.log('Passed: frame atlas bounds, union crop, shared scale, foot anchor.');
