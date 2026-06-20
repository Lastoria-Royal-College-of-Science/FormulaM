import { svelte } from "@sveltejs/vite-plugin-svelte";
import UnoCSS from "unocss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  plugins: [UnoCSS(), svelte()],
  worker: {
    format: "es",
  },
});
