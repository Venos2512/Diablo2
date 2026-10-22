// `node --import ./scripts/test-assets-register.mjs --test …`: lets node import the lab's source modules that pull in
// non-JS assets the esbuild bundle normally inlines (.glsl as { path, code }, images as a path string).
import { register } from 'node:module';

register('./test-assets-hooks.mjs', import.meta.url);
