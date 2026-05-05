import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function normalizeVersionedImports() {
  const versionSuffixPattern = /^(@?[^/]+(?:\/[^/]+)?)@\d/

  return {
    name: 'normalize-versioned-imports',
    async resolveId(id: string, importer: string | undefined) {
      // Figma-exported templates sometimes include "@version" in import specifiers.
      // Vite/Rollup cannot resolve those directly, so strip only the version suffix.
      if (
        id.startsWith('.') ||
        id.startsWith('/') ||
        id.startsWith('figma:asset/')
      ) {
        return null
      }

      if (!versionSuffixPattern.test(id)) {
        return null
      }

      const normalizedId = id.replace(/@\d[\w.-]*$/, '')
      if (normalizedId === id) {
        return null
      }

      return this.resolve(normalizedId, importer, { skipSelf: true })
    },
  }
}

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    normalizeVersionedImports(),
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/app'),
    },
  },
})
