/** @type {import('next').NextConfig} */

module.exports = {
  reactStrictMode: true,
  // A stray package-lock.json in the home folder makes Turbopack guess the wrong root.
  turbopack: { root: __dirname },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'ipfs.io' }],
  },
  // The about page now lives in the Phunky Hub; keep old links working.
  async redirects() {
    return [{ source: '/about', destination: '/hub/vphree', permanent: true }];
  },
};
