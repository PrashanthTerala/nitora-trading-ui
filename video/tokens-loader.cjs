// Replaces src/tokens-source.ts with the site's tokens.css as a string (see remotion.config.ts).
module.exports = function tokensLoader() {
  const { css } = this.getOptions();
  return `export default ${JSON.stringify(css)};`;
};
