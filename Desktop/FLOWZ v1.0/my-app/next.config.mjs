import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {
        root: __dirname,
    },
    reactStrictMode: true,
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? {
            exclude: ['error', 'warn'],
        } : false,
    },
    typescript: {
        // TODO: Fix all pre-existing type errors then set to false
        ignoreBuildErrors: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
            {
                protocol: 'https',
                hostname: '**', // Allow all external images (WooCommerce stores)
            },
            {
                protocol: 'http',
                hostname: '**',
            },
        ],
    },
};

export default nextConfig;
