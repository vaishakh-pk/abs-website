import {readdir,writeFile} from 'node:fs/promises';
const base=new URL('../public/animation/',import.meta.url);
const sequences={};
for(const folder of (await readdir(base,{withFileTypes:true})).filter(e=>e.isDirectory()&&e.name.startsWith('walking_')).map(e=>e.name).sort()){
 const files=(await readdir(new URL(folder+'/',base))).filter(f=>new RegExp(`^${folder}_\\d+\\.png$`).test(f)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 if(!files.length)throw new Error(`No frames in ${folder}`);
 files.forEach((f,i)=>{if(f!==`${folder}_${i+1}.png`)throw new Error(`Missing or out-of-order frame in ${folder}: expected ${i+1}`)});
 sequences[folder]=files.map(f=>`${folder}/${f}`);
}
await writeFile(new URL('../src/animation-frames.json',import.meta.url),JSON.stringify(sequences,null,2)+'\n');
console.log('Animation frames: '+Object.entries(sequences).map(([k,v])=>`${k}=${v.length}`).join(', '));
