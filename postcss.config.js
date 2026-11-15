import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import tailwindConfig from './tailwind.config.js'

// Pass the same configuration object used by Vite, rather than a cached lookup.
export default {
  plugins: [tailwindcss(tailwindConfig), autoprefixer()],
}
