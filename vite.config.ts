import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE ?? '/',
  resolve: {
    alias: {
      // Force single React instance when using file-linked packages
      react: path.resolve('./node_modules/react'),
      'react-dom': path.resolve('./node_modules/react-dom'),
      // footprint-samples demos import from 'footprint' (their local alias).
      // Resolve it to footprintjs so both use the same instance.
      footprint: path.resolve('./node_modules/footprintjs'),
    },
  },
})
