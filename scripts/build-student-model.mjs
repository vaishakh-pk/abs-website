import {writeFile,mkdir} from 'node:fs/promises';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {createStudent} from '../src/student3d/create-student.mjs';
// GLTFExporter's binary writer uses FileReader in browsers.
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(data=>{this.result=data;this.onloadend?.()})}readAsDataURL(blob){blob.arrayBuffer().then(data=>{this.result='data:application/octet-stream;base64,'+Buffer.from(data).toString('base64');this.onloadend?.()})}};
const {root,animations}=createStudent();
const binary=await new GLTFExporter().parseAsync(root,{binary:true,animations,onlyVisible:true});
await mkdir('public/models',{recursive:true});
await writeFile('public/models/abs-student.glb',Buffer.from(binary));
let meshes=0,triangles=0;root.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3}});
const stats={bytes:binary.byteLength,meshes,triangles,animations:animations.map(a=>({name:a.name,duration:a.duration})),format:'glTF 2.0',rig:'articulated transform hierarchy',textures:0};
await writeFile('public/models/abs-student.json',JSON.stringify(stats,null,2));console.log(stats);
