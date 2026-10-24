/** @type {import('next').NextConfig} */

module.exports = {
  reactStrictMode: true,
  // A stray package-lock.json in the home folder makes Turbopack guess the wrong root.
  turbopack: { root: __dirname },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'ipfs.io' }],
  },
};
