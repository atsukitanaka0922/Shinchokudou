/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development',
  });
  
  const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: ['lh3.googleusercontent.com'], // Google認証の画像を許可
    },
  };
  
  module.exports = withPWA(nextConfig);