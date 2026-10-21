// The gateway supplies this value in index.html; assets and API requests share the prefix.
const base = window.__XWARP_BASE__ || '/'
if (!/^\/(?:[A-Za-z0-9_-]+\/)*$/.test(base)) throw new Error('Invalid panel path')
// eslint-disable-next-line no-undef
__webpack_public_path__ = base
