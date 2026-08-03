import base from '../tailwind.config'
import type { Config } from 'tailwindcss'

const config: Config = {
  ...base,
  content: ['./src/**/*.{ts,tsx}', './demo-build/**/*.{ts,tsx}'],
}
export default config
