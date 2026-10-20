"""Split the Tripo models of the camp prop sheets (art-output/tripo-models/camp/asset_13..24*.glb) into the lab's
camp kits with scripts/prepare-prop-kit.py, one call per sheet with the options that sheet needs.

Usage: python -I scripts/prepare-camp-kits.py [sheet-number ...]     (default: every sheet whose GLB exists)

Piece names must match the kit catalogue (src/env/biomeCatalog.js). Options per sheet were found by
looking at each preview (art-output/tripo-models/camp/<sheet>_pieces.png): Tripo lays a 2D sheet out on the ground,
so --layout plan (footprints seen from above); --join glues parts of one prop that do not touch (a pot under its
tripod), --merge-small folds chips and pebbles into their neighbour, --drop removes a flattened scale figure.
"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
LAB = os.path.dirname(HERE)
CAMP = os.path.join(LAB, '..', 'art-output', 'tripo-models', 'camp')

SHEETS = {
    13: ('asset_13_tent_set_b', 'kit-tents-b', 'tentb', 'hospital,bell,cart_awning,hide_shelter,burnt,quartermaster',
         ['--layout', 'top', '--rows', '2', '--cuts', '0:0.215;1:-0.04', '--height', '3.5', '--drop', '1']),
    14: ('asset_14_camp_kitchen_set', 'kit-camp-kitchen', 'kitchen', 'pot_tripod,hearth,butcher_block,drying_rack,water_barrel,firewood,chopping_stump',
         ['--join', '1+2']),
    15: ('asset_15_storage_set', 'kit-camp-storage', 'storage', 'crate_stack,barrel_cradle,barrels,spilled_crate,sacks,strongbox,tarp_pile',
         ['--join', '3+4']),
    16: ('asset_16_training_weapons_set', 'kit-camp-training', 'training', 'weapon_rack,archery_butt,dummy,shield_rack,grindstone,anvil', ['--height', '2.2']),
    17: ('asset_17_drying_crafts_set', 'kit-camp-crafts', 'crafts', 'fishing_net,laundry_line,leather_bench,hide_frame,fletcher_bench,herb_rack', ['--height', '2.2', '--drop', '3']),
    18: ('asset_18_camp_lighting_set', 'kit-camp-lighting', 'lighting', 'torch,brazier,lantern_post,candles,brazier_cold,beacon', []),
    19: ('asset_19_banners_signs_set', 'kit-camp-banners', 'banners', 'banner,signpost,pennant_line,totem,alarm_bell,warding_pole', []),
    20: ('asset_20_social_seating_set', 'kit-camp-seating', 'seating', 'rug,log_bench,stump_circle,dice_barrel,bedroll,dining_table',
         ['--join', '3+4+9,11+5+10,7+6']),
    21: ('asset_21_shrine_graves_set', 'kit-camp-shrine', 'shrine', 'shrine,fresh_grave,grave_row,cairn,covered_body,altar',
         ['--join', '2+8,3+4+5,10+9']),
    22: ('asset_22_animal_pen_set', 'kit-camp-animals', 'animals', 'chicken_coop,goat_pen,trough,haystack,wheelbarrow,mule', ['--height', '2.0', '--join', '1+5,3+2']),
    23: ('asset_23_ground_clutter_set', 'kit-camp-clutter', 'clutter', 'straw,broken_planks,spilled_sack,arrows,helmet_spear,bones,pots,boot_prints,rope_bucket',
         ['--join', '4+5,6+14+15,8+7+9,11+12']),
    24: ('asset_24_work_stations_set', 'kit-camp-stations', 'stations', 'sawhorse,alchemy_table,tanning_vats,forge,map_table,cooper', ['--layout', 'top', '--rows', '2', '--cuts', '0:-0.09;1:-0.17', '--merge-small', '60', '--height', '2.6',
          '--join', '9+7+8+10,4+11', '--drop', '1']),
}


def run(num):
    sheet, kit, prefix, names, extra = SHEETS[num]
    src = os.path.join(CAMP, sheet + '.glb')
    if not os.path.exists(src):
        print(f'{sheet}: no GLB yet')
        return
    opts = extra if '--layout' in extra else ['--layout', 'plan', '--merge-small', '60', *extra]
    cmd = [sys.executable, '-I', os.path.join(HERE, 'prepare-prop-kit.py'), src, os.path.join(LAB, 'assets', 'samples', kit + '.glb'),
           '--prefix', prefix, '--names', names, '--texture', '2048', '--preview', os.path.join(CAMP, sheet[:8] + '_pieces.png'), *opts]
    print('==', sheet)
    subprocess.run(cmd, check=True)


if __name__ == '__main__':
    for n in [int(a) for a in sys.argv[1:]] or sorted(SHEETS):
        run(n)
