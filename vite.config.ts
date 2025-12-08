import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
<<<<<<< HEAD

// https://vitejs.dev/config/
export default defineConfig(({ mode }: { mode: string }) => ({
=======
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae
  server: {
    host: "::",
    port: 8080,
  },
<<<<<<< HEAD
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve("./src"),
    },
  },
}));
=======
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
>>>>>>> a397210beb9a30ba0d5df243336fa4bc022922ae
