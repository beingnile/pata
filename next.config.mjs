/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
};

const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
});

module.exports = withMDX({
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
});

export default nextConfig;
