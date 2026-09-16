import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const stage=document.querySelector('#stage'),status=document.querySelector('#status');
const scene=new T.Scene();
const renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.setClearColor(0,0);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;stage.appendChild(renderer.domElement);
const camera=new T.PerspectiveCamera(33,1,.01,50);camera.position.set(2.2,1.65,4.4);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.02,0);controls.enableDamping=true;controls.minDistance=2.6;controls.maxDistance=7;controls.maxPolarAngle=Math.PI*.56;
scene.add(new T.HemisphereLight('#eff7ff','#a1aabb',2));
const key=new T.DirectionalLight('#fff1da',3.4);key.position.set(-3,5,4);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-2;key.shadow.camera.right=2;key.shadow.camera.top=3;key.shadow.camera.bottom=-2;key.shadow.normalBias=.02;scene.add(key);
const rim=new T.DirectionalLight('#a9d6ff',2.2);rim.position.set(3,3,-3);scene.add(rim);
const ground=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({opacity:.16}));ground.rotation.x=-Math.PI/2;ground.position.y=.02;ground.receiveShadow=true;scene.add(ground);
let mixer,action,model;let time=performance.now();
new GLTFLoader().load('/models/abs-student.glb',async gltf=>{
 model=gltf.scene;model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});scene.add(model);mixer=new T.AnimationMixer(model);
 for(const clip of gltf.animations){const b=document.createElement('button');b.textContent=clip.name;b.setAttribute('aria-pressed','false');b.onclick=()=>{document.querySelectorAll('#animations button').forEach(x=>x.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');const next=mixer.clipAction(clip);if(action!==next){next.reset().fadeIn(.25).play();action?.fadeOut(.25);action=next}};document.querySelector('#animations').appendChild(b);if(clip.name==='Walk')b.click()}
 const stats=await fetch('/models/abs-student.json').then(r=>r.json());status.textContent=`${(stats.bytes/1024).toFixed(0)} KB · ${stats.animations.length} animations · ${Math.round(stats.triangles/1000)}k triangles · no textures`;status.dataset.loaded='true';
},undefined,error=>{status.textContent='Unable to load the 3D model.';console.error(error)});
document.querySelectorAll('#views button').forEach(b=>b.onclick=()=>{const angle=Number(b.dataset.angle),distance=4.7;camera.position.set(Math.sin(angle)*distance,1.5,Math.cos(angle)*distance);controls.target.set(0,1.02,0);controls.update()});
document.querySelector('#wireframe').onchange=e=>model?.traverse(o=>{if(o.isMesh)o.material.wireframe=e.target.checked});
document.querySelector('#rotate').onchange=e=>controls.autoRotate=e.target.checked;
const observer=new ResizeObserver(()=>{const {width,height}=stage.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix()});observer.observe(stage);
renderer.setAnimationLoop(()=>{const now=performance.now(),dt=Math.min((now-time)/1000,.05);time=now;if(document.hidden)return;if(mixer)mixer.update(dt*Number(document.querySelector('#speed').value));controls.update();renderer.render(scene,camera)});
