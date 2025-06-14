export default defineAppConfig({
  ui: {
    colors: {
      primary: "blue",
      neutral: "zinc"
    },
    // Configure ULink specifically to ensure all links are blue
    link: {
      base: "text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
    }
  }
})
