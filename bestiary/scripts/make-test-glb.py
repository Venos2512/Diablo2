"""Create a tiny synthetic GLB fixture to test the viewer; not a catalog asset."""
import json,struct
from pathlib import Path
binary=struct.pack('<17f',-0.5,0,0,0.5,0,0,0,1,0,0,2,0,0,0,0,0.5,0)
doc={'asset':{'version':'2.0'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'mesh':0,'name':'Viewer test triangle'}],
 'meshes':[{'primitives':[{'attributes':{'POSITION':0},'material':0}]}],
 'materials':[{'doubleSided':True,'pbrMetallicRoughness':{'baseColorFactor':[0.55,0.75,0.4,1],'metallicFactor':0,'roughnessFactor':0.6}}],
 'buffers':[{'byteLength':len(binary)}],
 'bufferViews':[{'buffer':0,'byteOffset':0,'byteLength':36,'target':34962},{'buffer':0,'byteOffset':36,'byteLength':8},{'buffer':0,'byteOffset':44,'byteLength':24}],
 'accessors':[{'bufferView':0,'componentType':5126,'count':3,'type':'VEC3','min':[-0.5,0,0],'max':[0.5,1,0]}, {'bufferView':1,'componentType':5126,'count':2,'type':'SCALAR','min':[0],'max':[2]},{'bufferView':2,'componentType':5126,'count':2,'type':'VEC3'}],
 'animations':[{'name':'Test lift','samplers':[{'input':1,'output':2,'interpolation':'LINEAR'}],'channels':[{'sampler':0,'target':{'node':0,'path':'translation'}}]}]}
raw=json.dumps(doc,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4)
glb=struct.pack('<III',0x46546c67,2,12+8+len(raw)+8+len(binary))+struct.pack('<II',len(raw),0x4e4f534a)+raw+struct.pack('<II',len(binary),0x004e4942)+binary
out=Path(__file__).resolve().parents[1]/'tests'/'fixtures';out.mkdir(parents=True,exist_ok=True);(out/'viewer-test.glb').write_bytes(glb)
print('Created viewer-test.glb')
