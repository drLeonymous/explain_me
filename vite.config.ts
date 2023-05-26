import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'path'

const TRUE = 'true'

const root = resolve(__dirname, 'src')
const pagesDir = resolve(root, 'pages')
const outDir = resolve(__dirname, 'dist')

export default ({ mode, command }: { mode: string, command: string }) => {
    const ENV = loadEnv(mode, process.cwd()) // load (dev || prod) .env
    // vite config
    return defineConfig({
        base: '/',
        define: {
            'process.env': ENV,
        },
        build: {
            outDir,
            sourcemap: ENV.VITE_BUILD_SOURCEMAP === TRUE,
            minify: 'terser',
            terserOptions: {
                compress: {
                    drop_console: ENV.VITE_BUILD_DROP_CONSOLE === TRUE, // disable console
                    drop_debugger: ENV.VITE_BUILD_DROP_DEBUGGER === TRUE, // disable debug
                },
            },
            rollupOptions: {
                input: {
                    content: resolve(pagesDir, 'content', 'index.ts'),
                    background: resolve(pagesDir, 'background', 'index.ts'),
                    popup: resolve(pagesDir, 'popup', 'index.html'),
                    options: resolve(pagesDir, 'options', 'index.html'),
                },
                output: {
                    entryFileNames: chunk => `src/pages/${chunk.name}/index.js`,
                },
            },
        },
    })
}
