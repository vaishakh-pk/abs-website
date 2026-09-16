import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createStudent} from '../src/student3d/create-student.mjs';
const data=await readFile(new URL('../public/models/abs-student.glb',import.meta.url));
assert.equal(data.toString('ascii',0,4),'glTF');assert.equal(data.readUInt32LE(4),2);assert.equal(data.readUInt32LE(8),data.length);assert.ok(data.length<1024*1024,'Website model must stay below 1 MB');
const doc=JSON.parse(data.toString('utf8',20,20+data.readUInt32LE(12)));
assert.deepEqual(doc.animations.map(a=>a.name),['Idle','Walk','Point','Present','Celebrate']);
assert.equal(doc.images?.length||0,0,'Model should not depend on external image textures');
for(const animation of doc.animations)for(const channel of animation.channels)assert.ok(doc.nodes[channel.target.node]);
const {root,animations}=createStudent();
for(const clip of animations)for(const track of clip.tracks){
 const size=track.getValueSize();
 for(let i=0;i<size;i++)assert.ok(Math.abs(track.values[i]-track.values[track.values.length-size+i])<1e-6,clip.name+' must loop without a seam');
 for(const value of track.values)assert.ok(Number.isFinite(value));
}
root.traverse(o=>{if(o.isMesh){o.geometry.computeBoundingBox();assert.ok(!o.geometry.boundingBox.isEmpty())}});
console.log(`Passed: valid GLB, ${(data.length/1024).toFixed(0)} KB, five continuous loops, valid geometry and animation targets, no texture dependencies.`);
