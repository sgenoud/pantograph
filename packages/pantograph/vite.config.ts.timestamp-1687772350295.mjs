// vite.config.ts
import { resolve } from "path";
import { defineConfig } from "file:///Users/stevegenoud/workbench/pantograph/node_modules/.pnpm/vite@4.1.4_@types+node@18.15.5/node_modules/vite/dist/node/index.js";
import dts from "file:///Users/stevegenoud/workbench/pantograph/node_modules/.pnpm/vite-plugin-dts@2.2.0_@types+node@18.15.5_vite@4.1.4/node_modules/vite-plugin-dts/dist/index.mjs";
var __vite_injected_original_dirname = "/Users/stevegenoud/workbench/pantograph/packages/pantograph";
var vite_config_default = defineConfig({
  test: {
    setupFiles: ["test/setup.ts"]
  },
  build: {
    sourcemap: true,
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: {
        pantograph: resolve(__vite_injected_original_dirname, "src/main.ts"),
        "pantograph/models": resolve(__vite_injected_original_dirname, "src/api/models.ts"),
        "pantograph/drawShape": resolve(__vite_injected_original_dirname, "src/api/drawShape.ts")
      },
      name: "Pantograph"
    }
  },
  plugins: [
    dts({
      outputDir: "dist/types"
    })
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvc3RldmVnZW5vdWQvd29ya2JlbmNoL3BhbnRvZ3JhcGgvcGFja2FnZXMvcGFudG9ncmFwaFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL3N0ZXZlZ2Vub3VkL3dvcmtiZW5jaC9wYW50b2dyYXBoL3BhY2thZ2VzL3BhbnRvZ3JhcGgvdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL3N0ZXZlZ2Vub3VkL3dvcmtiZW5jaC9wYW50b2dyYXBoL3BhY2thZ2VzL3BhbnRvZ3JhcGgvdml0ZS5jb25maWcudHNcIjsvLy8gPHJlZmVyZW5jZSB0eXBlcz1cInZpdGVzdFwiIC8+XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgZHRzIGZyb20gXCJ2aXRlLXBsdWdpbi1kdHNcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgdGVzdDoge1xuICAgIHNldHVwRmlsZXM6IFtcInRlc3Qvc2V0dXAudHNcIl0sXG4gIH0sXG5cbiAgYnVpbGQ6IHtcbiAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgbGliOiB7XG4gICAgICAvLyBDb3VsZCBhbHNvIGJlIGEgZGljdGlvbmFyeSBvciBhcnJheSBvZiBtdWx0aXBsZSBlbnRyeSBwb2ludHNcbiAgICAgIGVudHJ5OiB7XG4gICAgICAgIHBhbnRvZ3JhcGg6IHJlc29sdmUoX19kaXJuYW1lLCBcInNyYy9tYWluLnRzXCIpLFxuICAgICAgICBcInBhbnRvZ3JhcGgvbW9kZWxzXCI6IHJlc29sdmUoX19kaXJuYW1lLCBcInNyYy9hcGkvbW9kZWxzLnRzXCIpLFxuICAgICAgICBcInBhbnRvZ3JhcGgvZHJhd1NoYXBlXCI6IHJlc29sdmUoX19kaXJuYW1lLCBcInNyYy9hcGkvZHJhd1NoYXBlLnRzXCIpLFxuICAgICAgfSxcbiAgICAgIG5hbWU6IFwiUGFudG9ncmFwaFwiLFxuICAgIH0sXG4gIH0sXG5cbiAgcGx1Z2luczogW1xuICAgIGR0cyh7XG4gICAgICBvdXRwdXREaXI6IFwiZGlzdC90eXBlc1wiLFxuICAgIH0pLFxuICBdLFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsb0JBQW9CO0FBQzdCLE9BQU8sU0FBUztBQUhoQixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixNQUFNO0FBQUEsSUFDSixZQUFZLENBQUMsZUFBZTtBQUFBLEVBQzlCO0FBQUEsRUFFQSxPQUFPO0FBQUEsSUFDTCxXQUFXO0FBQUEsSUFDWCxLQUFLO0FBQUE7QUFBQSxNQUVILE9BQU87QUFBQSxRQUNMLFlBQVksUUFBUSxrQ0FBVyxhQUFhO0FBQUEsUUFDNUMscUJBQXFCLFFBQVEsa0NBQVcsbUJBQW1CO0FBQUEsUUFDM0Qsd0JBQXdCLFFBQVEsa0NBQVcsc0JBQXNCO0FBQUEsTUFDbkU7QUFBQSxNQUNBLE1BQU07QUFBQSxJQUNSO0FBQUEsRUFDRjtBQUFBLEVBRUEsU0FBUztBQUFBLElBQ1AsSUFBSTtBQUFBLE1BQ0YsV0FBVztBQUFBLElBQ2IsQ0FBQztBQUFBLEVBQ0g7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
