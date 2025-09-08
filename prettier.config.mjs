// @ts-check
export const config = {
  semi: false,
  singleQuote: false,
  trailingComma: "none",
  tabWidth: 2,
  useTabs: false,
  printWidth: 120,
  bracketSpacing: true,
  arrowParens: "always",
  endOfLine: "lf",
  overrides: [
    {
      files: ["*.ts"],
      options: {
        semi: false,
        trailingComma: "all"
      }
    }
  ]
}

export default config
