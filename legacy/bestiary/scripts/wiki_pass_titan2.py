exec(open('scripts/wiki_pass_titan.py').read().split('jobs=[]')[0])
found=json.load(open(out/'candidates.json')); known={x['id'] for x in found}; rows=[r for r in rows if r['id'] not in known]
alias.update({'Harpy':['Harpies','HarpyConcept','HarpyModel','Harpyconcept','Harpymodel','Brush_Harpy_Crone','Brush_Harpy_Hag','Brush_Harpy_Witch'], 'Automatoi':['Automatois','Automatons','Automatoi_Warriors','Automatoi-Warrior','Automatoi_warrior'],'Boar':['Boars','Boarmodel','Ravenous_Boar','RavenousBoar'],'Boarman':['Boarmen','Boarmanmodel','Boarman_artwork'],'Eurynomus':['Eurynomus_models','Eurynomusmodel','Bonepicker','Corpse_Monger'],'Carrion Bird':['Carrion_Birds','CarrionCrow','Carrion_crow','Plague_Bird'],'Giant Turtle':['Giant_Turtles','Giant_turtle','Salt_Snapper','Salt_Spitter','SaltSnapper','SaltSpitter'],'Ichthian':['Ichthians','Ichtyan','Ichtian','Ichthian_Myrmidon','Ichthian_myrmidon'], 'Skeleton':['Skeletons','Skeleton_model','Skeleton_Soldier','Awakened_Dead'],'Spider':['Spiders','Cavern_Crawler','Orbed_Weaver'], 'Trap':['Traps','Blade_Trap','Fire_Trap','Frost_Trap'],'Wraith':['Wraiths','Drowned_Sailor'],'Alastor':['Alastor_~_Scourge_of_Acheron','Alastor_model'],'Arachne':['Arachne_~_Spider_Queen','Spider_Queen'],'Talos':['Talos_~_Master_Automatoi'],'Lernean Hydra':['Hydra','Lernaean_Hydra','LernaeanHydra']})
jobs=[]
for row in rows:
 bases=[row['name'].replace(' ','_')]+alias.get(row['name'],[])
 for stem in bases:
  for suf in ['', '1','2','_models','_01']:
   for ext in ['.png','.jpg']:
    jobs.append((row,stem+suf+ext))
exec(open('scripts/wiki_pass_titan.py').read().split('def fetch(job):')[1].split('found=[]')[0].join(['def fetch(job):','']))
with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
 for x in pool.map(fetch,jobs):
  if x and x['filename'] not in {a['filename'] for a in found}:found.append(x);print(x['id'],x['filename'],flush=True)
(out/'candidates.json').write_text(json.dumps(found,indent=2))
print('Total',len(found))
