import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
// import nodeResolve from "@rollup/plugin-node-resolve";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
});
