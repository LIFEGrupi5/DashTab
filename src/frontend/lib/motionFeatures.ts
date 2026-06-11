// Loaded only via dynamic import() from the dashboard's <LazyMotion>, so the
// framer-motion animation feature bundle (~15KB gzipped) lands in its own chunk
// off the critical path instead of the main bundle. `m` + LazyMotion keep just
// the tiny core; features stream in after the page is interactive.
import { domAnimation } from 'framer-motion';

export default domAnimation;
