"""Tests of scripts/glb_rig_tools.py (the rigged-hand branch of prepare-choice-hands.py): python scripts/test_glb_rig_tools.py
A synthetic rig is built from the static Flagellant hand (assets/choice-hands/choice-hand-fl.glb), read back, checked against the lab frame, mis-framed on purpose and wrapped, and repacked."""
import os
import sys
import tempfile
import unittest

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import glb_rig_tools as G  # noqa: E402

STATIC = os.path.join(HERE, '..', 'assets', 'choice-hands', 'choice-hand-fl.glb')
NEED = ['hand_root', 'forearm', 'wrist'] + [f'{f}_0{k}' for f in ('thumb', 'index', 'middle', 'ring', 'pinky') for k in (1, 2, 3)]


class RigTools(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.mkdtemp()
        cls.path = os.path.join(cls.tmp, 'rig.glb')
        G.fake_rig(STATIC, cls.path)
        cls.j, cls.b = G.read_glb(cls.path)

    def test_the_synthetic_rig_has_a_skin_with_every_bone_and_at_most_four_influences(self):
        info = G.inspect_rig(self.j, self.b)
        self.assertEqual(info['skins'], 1)
        self.assertEqual({G.norm_name(n) for n in info['joints']}, {G.norm_name(n) for n in NEED})
        self.assertLessEqual(info['max_influences'], 4)
        self.assertTrue(self.j['asset']['extras']['synthetic_rig'])

    def test_weights_sum_to_one_and_the_inverse_binds_undo_the_rest_pose(self):
        prim = self.j['meshes'][0]['primitives'][0]
        w = G.accessor(self.j, self.b, prim['attributes']['WEIGHTS_0'])
        np.testing.assert_allclose(w.sum(1), 1, atol=1e-5)
        skin = self.j['skins'][0]
        ibm = G.accessor(self.j, self.b, skin['inverseBindMatrices']).reshape(-1, 4, 4).transpose(0, 2, 1)  # column-major -> row-major
        W = G.world_matrices(self.j)
        for k, node in enumerate(skin['joints']):
            np.testing.assert_allclose(ibm[k] @ W[node], np.eye(4), atol=1e-5)

    def test_the_lab_frame_is_recognised_and_a_misframed_rig_gets_a_wrapper(self):
        info = G.inspect_rig(self.j, self.b)
        self.assertIsNone(G.frame_transform(info))
        bad = dict(info, bbox=[[-0.1, -0.05, 0.0], [0.1, 0.05, 0.9]], wrist=[0, 0, 0.54])
        s, turn, t = G.frame_transform(bad)
        self.assertAlmostEqual(s, 0.5)
        self.assertFalse(turn)
        j = {**self.j, 'nodes': [dict(n) for n in self.j['nodes']], 'scenes': [dict(self.j['scenes'][0])]}
        n0 = len(j['nodes'])
        G.wrap_frame(j, s, turn, t)
        self.assertEqual(len(j['nodes']), n0 + 1)
        self.assertEqual(j['scenes'][0]['nodes'], [n0])
        self.assertEqual(j['nodes'][n0]['scale'], [0.5, 0.5, 0.5])

    def test_repacking_keeps_the_skin_and_shrinks_the_textures(self):
        j, b = G.rebuild(*G.read_glb(self.path), image_size=512)
        out = os.path.join(self.tmp, 'out.glb')
        G.write_glb(out, j, b)
        j2, b2 = G.read_glb(out)
        self.assertEqual(len(j2['skins']), 1)
        info = G.inspect_rig(j2, b2)
        self.assertEqual(len(info['joints']), 18)
        self.assertLessEqual(info['max_influences'], 4)
        from io import BytesIO
        from PIL import Image
        for im in j2['images']:
            v = j2['bufferViews'][im['bufferView']]
            data = b2[v['byteOffset']:v['byteOffset'] + v['byteLength']]
            self.assertLessEqual(max(Image.open(BytesIO(data)).size), 512)


if __name__ == '__main__':
    unittest.main()
