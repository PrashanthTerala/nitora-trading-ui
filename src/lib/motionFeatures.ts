/**
 * Motion's animation and layout features, split out so LazyMotion can load them after first
 * paint. Components use the light `m.*` elements; nothing animates until this chunk arrives,
 * and nothing that matters waits for it.
 */
import { domMax } from 'motion/react';

export default domMax;
