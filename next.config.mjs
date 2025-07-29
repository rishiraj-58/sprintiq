/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow static HTML export when env var is set (used for CI builds)
  output: process.env.CI ? 'export' : undefined,
  // Disable image optimization during static export
  images: process.env.CI 
    ? { unoptimized: true } 
    : { 
        domains: ['flowbite.s3.amazonaws.com'],
      },
  // For CI environments, minimize webpack optimization to prevent issues
  webpack: (config, { isServer }) => {
    if (process.env.CI) {
      // Reduce optimization in CI environments
      config.optimization.minimize = false;

      // Skip PostCSS and Tailwind processing in CI
      if (process.env.SKIP_TAILWIND === 'true' || process.env.SKIP_POSTCSS === '1') {
        // Completely remove CSS handling in CI builds
        const rules = config.module.rules;
        
        // Find CSS rule and disable it
        for (let i = 0; i < rules.length; i++) {
          const rule = rules[i];
          if (rule.test && rule.test.test && 
              (rule.test.test('file.css') || rule.test.test('file.scss') || rule.test.test('file.sass'))) {
            // Replace with a dummy rule that does nothing
            rules[i] = {
              test: rule.test,
              use: [
                {
                  loader: 'null-loader',
                },
              ],
            };
          }
        }

        // More aggressive handling of tailwind modules
        config.resolve.alias = {
          ...config.resolve.alias,
          'tailwindcss': require.resolve('path').join(process.cwd(), 'empty-module.js'),
          'tailwindcss/lib/util/createUtilityPlugin': require.resolve('path').join(process.cwd(), 'empty-module.js'),
          'tailwindcss/resolveConfig': require.resolve('path').join(process.cwd(), 'empty-module.js'),
        };
      }
    }
    return config;
  },
};

export default nextConfig;
