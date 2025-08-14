// TEMP hotfix: drop autoprefixer so Next can compile without that package.
// We'll add it back after you're moving.
module.exports = {
  plugins: {
    tailwindcss: {},
    // autoprefixer: {},  // <- comment out or delete this line for now
  },
};
