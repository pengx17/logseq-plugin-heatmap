module.exports = {
  branches: ["main"],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    [
      "@semantic-release/github",
      {
        assets: ["dist/**", "package.json", "logo.png", "LICENSE", "readme.md"],
      },
    ],
    [
      "@semantic-release/npm",
      {
        npmPublish: false,
      },
    ],
    "@semantic-release/git",
  ],
};
