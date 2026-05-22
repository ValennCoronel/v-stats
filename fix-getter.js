const fs = require('fs');
const path = require('path');

const files = [
  "components/v-stats/team-view.tsx",
  "components/v-stats/stats-screen.tsx",
  "components/v-stats/stats-dashboard.tsx",
  "components/v-stats/settings-view.tsx",
  "components/v-stats/match-setup.tsx",
  "components/v-stats/bottom-nav.tsx"
];

for (const file of files) {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(
      /useProfileStore\(\(s\)\s*=>\s*s\.activeProfile\)/g,
      "useProfileStore((s) => s.profiles.find(p => p.id === s.activeProfileId) || s.profiles[0] || null)"
    );
    fs.writeFileSync(fullPath, content);
    console.log("Updated", file);
  }
}
