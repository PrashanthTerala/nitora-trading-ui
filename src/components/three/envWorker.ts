/**
 * Builds the scenes' environment map off the main thread.
 *
 * Prefiltering the procedural room (PMREMGenerator.fromScene) compiles three.js's blur shaders
 * synchronously, and with a cold shader cache -- every first visit -- that is one task of more
 * than half a second in which the page cannot respond. Here it runs on an OffscreenCanvas in a
 * worker, and the finished texture comes back as half-float pixels already in three's "CubeUV"
 * layout, which a material uses as it is, with no prefiltering on the main thread.
 *
 * Replies { width, height, data } (data a Uint16Array of RGBA half floats, rows bottom-up as
 * WebGL reads them), or { error } when this browser cannot do WebGL in a worker; the caller then
 * builds the map itself.
 */
import { PMREMGenerator, WebGLRenderer } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

self.onmessage = () => {
  try {
    const canvas = new OffscreenCanvas(1, 1);
    const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false });
    const pmrem = new PMREMGenerator(renderer);
    // The same map the posters were rendered with, so poster and live scene crossfade unseen.
    const target = pmrem.fromScene(new RoomEnvironment(), 0.04);
    const { width, height } = target;
    const data = new Uint16Array(width * height * 4);
    renderer.readRenderTargetPixels(target, 0, 0, width, height, data);
    target.dispose();
    pmrem.dispose();
    renderer.dispose();
    // A read the driver refused leaves the buffer untouched: all zeros, a black environment.
    if (!data.some((v) => v !== 0)) throw new Error('environment read back empty');
    (self as unknown as Worker).postMessage({ width, height, data }, [data.buffer]);
  } catch (e) {
    (self as unknown as Worker).postMessage({ error: String(e) });
  }
};
