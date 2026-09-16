import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

// Wheel and anchor scrolling share one clock. Touch and keyboard remain native.
export function installScrollLimit(){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let instance=null;
 const configure=()=>{
  instance?.destroy();instance=null;
  if(reduced.matches)return;
  instance=new Lenis({
   autoRaf:true,lerp:.12,smoothWheel:true,syncTouch:false,
   anchors:{offset:-90,duration:.85},
   prevent:node=>Boolean(node.closest('#navigation.open')),
  });
 };
 configure();reduced.addEventListener('change',configure);
 return()=>{instance?.destroy();reduced.removeEventListener('change',configure)};
}
