import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

/** Session-only self-contained GLB viewer. No uploaded files leave the browser. */
export function createModelViewer(host,onTick=()=>{}){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;host.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(40,1,.01,1000);camera.position.set(4,3,5);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.target.set(0,1,0);
 scene.add(new THREE.HemisphereLight(0xffffff,0x5a655a,2.4));const light=new THREE.DirectionalLight(0xffedd6,3);light.position.set(3,5,4);scene.add(light);
 scene.add(new THREE.GridHelper(10,20,0x687169,0x303a33));
 let object,mixer,clips=[],action,playing=true,alive=true,sequence=0,raf,clock=new THREE.Clock();
 const observer=new ResizeObserver(()=>{const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();});observer.observe(host);
 function release(root){root?.traverse(o=>{o.geometry?.dispose();for(const m of (Array.isArray(o.material)?o.material:[o.material]).filter(Boolean)){Object.values(m).forEach(v=>{if(v?.isTexture)v.dispose();});m.dispose();}});}
 function clear(){mixer?.stopAllAction();if(object){mixer?.uncacheRoot(object);scene.remove(object);release(object);}object=null;action=null;mixer=null;clips=[];}
 function fit(){if(!object)return;const box=new THREE.Box3().setFromObject(object),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());const radius=Math.max(size.x,size.y,size.z,.1);controls.target.copy(center);camera.position.copy(center).add(new THREE.Vector3(radius*1.4,radius*.8,radius*1.8));camera.near=radius/1000;camera.far=radius*100;camera.updateProjectionMatrix();controls.update();}
 function choose(index){mixer?.stopAllAction();action=clips[index]&&mixer?mixer.clipAction(clips[index]):null;if(action){action.reset().play();action.paused=!playing;}return action?.getClip().duration||0;}
 function loop(){if(!alive)return;raf=requestAnimationFrame(loop);const delta=Math.min(clock.getDelta(),.05);if(mixer&&playing)mixer.update(delta);controls.update();renderer.render(scene,camera);onTick(action?.time||0,action?.getClip().duration||0);}
 loop();
 return {
  async load(file){const token=++sequence;const buffer=await file.arrayBuffer();const view=new DataView(buffer);if(buffer.byteLength<20||view.getUint32(0,true)!==0x46546c67)throw Error('Choose a valid, self-contained .glb file.');
   const manager=new THREE.LoadingManager();manager.setURLModifier(url=>{if(url.startsWith('data:')||url.startsWith('blob:'))return url;throw Error('External resources are not supported. Embed textures and buffers in the GLB.');});
   const gltf=await new GLTFLoader(manager).parseAsync(buffer,'');if(!alive||token!==sequence){release(gltf.scene);return null;}clear();object=gltf.scene;scene.add(object);clips=gltf.animations;mixer=new THREE.AnimationMixer(object);playing=true;choose(0);fit();return clips.map((c,i)=>({name:c.name||`Clip ${i+1}`,duration:c.duration}));},
  choose,fit,
  play(){playing=!playing;if(action)action.paused=!playing;return playing;},
  speed(value){if(mixer)mixer.timeScale=value;},
  seek(time){if(action){const paused=action.paused;action.paused=false;action.time=time;mixer.update(0);action.paused=paused;}},
  dispose(){alive=false;sequence++;cancelAnimationFrame(raf);observer.disconnect();clear();scene.traverse(o=>{o.geometry?.dispose();if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});controls.dispose();renderer.dispose();renderer.domElement.remove();}
 };
}
