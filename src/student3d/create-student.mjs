import * as T from 'three';

// Editable, texture-free character. +Z is forward; units are metres.
export function createStudent(){
 const root=new T.Group();root.name='Student';
 const rig={};
 const material=(color,roughness=.7)=>new T.MeshStandardMaterial({color,roughness});
 const m={skin:material('#eeb080'),blush:material('#da8c68'),hair:material('#241c19',.48),hairLight:material('#342722',.5),blue:material('#0874c5'),collar:material('#075c9e'),seam:material('#3a92cc'),pants:material('#444c59'),pantsDark:material('#363f4b'),bag:material('#172b42'),bagEdge:material('#263e57'),sole:material('#e8eaf0'),shoe:material('#23344d'),white:material('#fff8eb',.36),iris:material('#663b24',.35),pupil:material('#100e0e',.25),lip:material('#a65238')};
 const sphere=new T.SphereGeometry(1,20,14);
 const mesh=(parent,geometry,mat,pos=[0,0,0],scale=[1,1,1],name='')=>{const o=new T.Mesh(geometry,mat);o.position.set(...pos);o.scale.set(...scale);o.name=name;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o};
 const ell=(p,mat,pos,scale,name)=>mesh(p,sphere,mat,pos,scale,name);
 const joint=(name,parent,pos)=>{const g=new T.Group();g.name=name;g.position.set(...pos);parent.add(g);rig[name]=g;return g};
 const tube=(p,points,r,mat,segments=20)=>mesh(p,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),segments,r,7,false),mat);
 const capsule=(p,mat,pos,r,length,scale=[1,1,1])=>mesh(p,new T.CapsuleGeometry(r,length,6,14),mat,pos,scale);
 const body=joint('Body',root,[0,0,0]);
 // Polo silhouette, tailored hem, placket, buttons and folded collar.
 const profile=[[.00,.96],[.16,.96],[.235,.99],[.235,1.05],[.21,1.23],[.245,1.43],[.20,1.50],[.10,1.52],[0,1.52]];
 const shirt=mesh(body,new T.LatheGeometry(profile.map(([r,y])=>new T.Vector2(r,y)),32),m.blue);shirt.scale.z=.63;
 ell(body,m.collar,[0,.99,0],[.238,.016,.155]);
 ell(body,m.pants,[0,.92,0],[.218,.11,.133]);
 capsule(body,m.skin,[0,1.555,0],.083,.10);
 for(const s of [-1,1]){
  const col=ell(body,m.collar,[s*.065,1.478,.118],[.053,.081,.018]);col.rotation.z=s*.56;
 }
 capsule(body,m.collar,[0,1.373,.146],.015,.15,[1,1,.4]);
 for(const y of [1.36,1.415])ell(body,m.sole,[0,y,.155],[.007,.007,.004]);
 tube(body,[[.11,1.35,.139],[.17,1.35,.12]],.003,m.seam);
 // Head: broad temples and cheeks taper towards a rounded chin.
 const head=joint('Head',body,[0,1.72,0]);
 const faceGeo=sphere.clone();const pos=faceGeo.attributes.position;
 for(let i=0;i<pos.count;i++){const y=pos.getY(i);const taper=y<-.12?1+.20*(y+.12):1;pos.setX(i,pos.getX(i)*taper)}faceGeo.computeVertexNormals();
 mesh(head,faceGeo,m.skin,[0,.035,.014],[.207,.257,.176],'Face');
 for(const s of [-1,1]){
  ell(head,m.skin,[s*.202,.025,.006],[.041,.068,.034]);ell(head,m.blush,[s*.22,.025,.031],[.020,.041,.012]);
  // Cheek volume is part of the face silhouette, avoiding raised patches.
  const eye=joint(s<0?'EyeL':'EyeR',head,[s*.083,.055,.16]);eye.rotation.y=s*.13;
  ell(eye,m.hair,[0,0,0],[.054,.064,.020]);
  ell(eye,m.white,[0,-.002,.010],[.049,.055,.018]);
  ell(eye,m.iris,[s*-.004,-.002,.027],[.027,.037,.009]);
  ell(eye,m.pupil,[s*-.004,-.001,.035],[.016,.026,.004]);
  ell(eye,m.white,[-.007,.013,.040],[.006,.009,.003]);
  tube(head,[[s*.035,.141,.172],[s*.075,.155,.174],[s*.127,.14,.151]],.012,m.hair,10);
 }
 ell(head,m.skin,[0,-.008,.182],[.033,.039,.039]);
 ell(head,m.blush,[0,-.023,.2],[.026,.013,.014]);
 tube(head,[[-.058,-.092,.16],[-.025,-.101,.176],[.018,-.101,.177],[.052,-.088,.162]],.005,m.lip,16);
 
 // A fitted cap plus overlapping swept locks, rather than a spherical helmet.
 mesh(head,new T.SphereGeometry(1,28,14,0,Math.PI*2,0,1.64),m.hair,[0,.105,-.018],[.218,.222,.188]);
 const hairLocks=[
  [-.13,.215,.11,.08,.135,.075,-.6],[-.055,.255,.10,.075,.145,.077,-.6],
  [.018,.27,.074,.07,.13,.08,-.5],[.09,.25,.033,.069,.105,.085,-.4],
  [.152,.207,.015,.058,.087,.07,-.28],[-.172,.14,.095,.042,.098,.057,-.34],
  [-.102,.176,.16,.048,.111,.039,-.66],[-.032,.208,.154,.042,.095,.041,-.58]
 ];
 for(const [i,v] of hairLocks.entries()){
  const [x,y,z,sx,sy,sz,angle]=v;
  const lock=ell(head,i%3===0?m.hairLight:m.hair,[x,y,z],[sx,sy,sz]);lock.rotation.z=angle;lock.rotation.x=.22;
 }
 for(const s of [-1,1]){const lock=ell(head,m.hair,[s*.186,.085,-.006],[.026,.095,.10]);lock.rotation.z=s*.10}
 // Backpack, front straps and a zipper follow the shirt.
 ell(body,m.bag,[0,1.244,-.19],[.221,.281,.112],'Backpack');
 ell(body,m.bagEdge,[0,1.17,-.285],[.173,.151,.033],'BackpackPocket');
 tube(body,[[-.145,1.27,-.298],[0,1.285,-.318],[.145,1.27,-.298]],.004,m.sole);
 capsule(body,m.sole,[.135,1.249,-.305],.006,.025);
 tube(body,[[-.065,1.486,-.18],[-.061,1.542,-.19],[.061,1.542,-.19],[.065,1.486,-.18]],.012,m.bagEdge);
 for(const s of [-1,1]){
  tube(body,[[s*.135,1.475,-.17],[s*.16,1.507,.005],[s*.163,1.398,.143],[s*.17,1.23,.145],[s*.18,1.073,-.13]],.025,m.bag);
  mesh(body,new T.BoxGeometry(.04,.035,.012),m.bagEdge,[s*.164,1.32,.171]);
 }
 // Vector ABS lettering faces the viewer behind the backpack.
 const lettering=[
  [[-.082,-.027],[-.061,.029],[-.04,-.027]], [[-.074,-.008],[-.048,-.008]],
  [[-.015,-.027],[-.015,.029],[.007,.029],[.021,.015],[.005,.002],[-.015,.002]],
  [[.005,.002],[.024,-.011],[.01,-.027],[-.015,-.027]],
  [[.084,.023],[.064,.03],[.043,.016],[.054,.002],[.077,-.004],[.084,-.019],[.065,-.03],[.042,-.023]]
 ];
 for(const line of lettering)tube(body,line.map(([x,y])=>[-x,1.195+y,-.32]),.0035,m.sole,12);
 // Articulated hips/knees/shoulders/elbows, with rounded joints.
 for(const [side,s] of [['L',-1],['R',1]]){
  const leg=joint('Hip'+side,body,[s*.115,.98,0]);
  capsule(leg,m.pants,[0,-.207,0],.105,.24,[1,1,.92]);
  const knee=joint('Knee'+side,leg,[0,-.405,0]);
  ell(knee,m.pants,[0,0,0],[.088,.095,.083]);
  capsule(knee,m.pants,[0,-.176,.003],.086,.235,[1,1,.95]);
  ell(knee,m.pantsDark,[0,-.322,.005],[.09,.022,.084]);
  const foot=joint('Foot'+side,knee,[0,-.365,.015]);
  ell(foot,m.sole,[0,-.053,.055],[.099,.045,.162]);
  ell(foot,m.shoe,[0,-.012,.052],[.09,.063,.145]);
  ell(foot,m.sole,[0,-.022,.151],[.088,.034,.054]);
  ell(foot,m.sole,[0,.018,-.035],[.087,.052,.055]);
  for(let j=0;j<4;j++)tube(foot,[[-.045,.048-j*.004,.022+j*.022],[.045,.048-j*.004,.03+j*.022]],.006,m.sole,4);
  const shoulder=joint('Shoulder'+side,body,[s*.224,1.43,0]);shoulder.rotation.z=s*.12;
  capsule(shoulder,m.blue,[s*.012,-.073,0],.09,.073,[1,1,.93]);
  capsule(shoulder,m.skin,[s*.023,-.185,0],.058,.135);
  const elbow=joint('Elbow'+side,shoulder,[s*.025,-.28,0]);
  ell(elbow,m.skin,[0,0,0],[.05,.053,.05]);
  capsule(elbow,m.skin,[0,-.097,0],.049,.117);
  const hand=joint('Hand'+side,elbow,[0,-.209,0]);
  ell(hand,m.skin,[0,-.022,0],[.049,.065,.030]);
  for(let j=0;j<4;j++)capsule(hand,m.skin,[(j-1.5)*.021,-.073+Math.abs(j-1.5)*.007,.001],.012,.04);
  const thumb=capsule(hand,m.skin,[-s*.047,-.025,.009],.019,.031);thumb.rotation.z=-s*.5;
 }
 root.userData={description:'AB’s student — stylized articulated 3D approximation',forward:'+Z',units:'metres'};
 const animations=createAnimations(rig);
 return {root,rig,animations};
}

function createAnimations(rig){
 const count=49,clips=[];
 const rest={};for(const [name,node] of Object.entries(rig))rest[name]=node.rotation.clone();
 for(const name of ['Idle','Walk','Point','Present','Celebrate']){
  const duration=name==='Walk'?1.05: name==='Celebrate'?2:3;
  const times=Array.from({length:count},(_,i)=>i/(count-1)*duration);
  const rotations={};for(const key of ['Head','HipL','HipR','KneeL','KneeR','FootL','FootR','ShoulderL','ShoulderR','ElbowL','ElbowR'])rotations[key]=[];
  const heights=[];
  for(let i=0;i<count;i++){
   const t=i/(count-1)*Math.PI*2,walk=name==='Walk',celebrate=name==='Celebrate';
   const e={};for(const key of Object.keys(rotations))e[key]=rest[key].clone();
   for(const [side,s] of [['L',1],['R',-1]]){
    const step=Math.sin(t)*s;
    if(walk){e['Hip'+side].x=.43*step;e['Knee'+side].x=Math.max(0,-step)*.65;e['Foot'+side].x=-.13*step;e['Shoulder'+side].x=-.32*step;e['Elbow'+side].x=-.12-Math.max(0,step)*.15}
    else{e['Shoulder'+side].x=.025*Math.sin(t);e['Elbow'+side].x=-.10}
    if(celebrate){e['Shoulder'+side].z=-s*2.45;e['Shoulder'+side].x=-.18;e['Elbow'+side].x=-.30+.12*Math.sin(t*2)}
   }
   if(name==='Point'){e.ShoulderR.x=-1.15;e.ShoulderR.z=.37;e.ElbowR.x=-.15;e.Head.y=-.18}
   if(name==='Present'){e.ShoulderR.x=-.55;e.ShoulderR.z=.7;e.ElbowR.x=-.9;e.Head.y=-.12}
   e.Head.x+=.017*Math.sin(t);e.Head.z+=walk?.015*Math.sin(t):.013*Math.sin(t);
   for(const key of Object.keys(rotations)){const q=new T.Quaternion().setFromEuler(e[key]);rotations[key].push(q.x,q.y,q.z,q.w)}
   heights.push(0,walk?.014*(1-Math.cos(2*t)):celebrate?.018*(1-Math.cos(t*2)):.005*Math.sin(t),0);
  }
  const tracks=Object.entries(rotations).map(([key,values])=>new T.QuaternionKeyframeTrack(key+'.quaternion',times,values));
  tracks.push(new T.VectorKeyframeTrack('Body.position',times,heights));
  clips.push(new T.AnimationClip(name,duration,tracks));
 }
 return clips;
}
