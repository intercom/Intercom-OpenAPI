// Skip in CI - this guard is only for engineer local machines
if (process.env.CI) process.exit(0);

const { execSync } = require('child_process');
const fs = require('fs');
const agent = process.env.npm_config_user_agent || '';

function getRepoName() {
  try {
    const remote = execSync('git remote get-url origin', { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
    const match = remote.match(/[:/]([^/]+\/[^/.]+?)(?:\.git)?$/);
    return match ? match[1] : 'unknown';
  } catch {
    return 'unknown';
  }
}

async function sendTelemetry(reason, details) {
  try {
    let apiKey = '';
    try {
      const settings = JSON.parse(fs.readFileSync(
        '/Library/Application Support/ClaudeCode/managed-settings.json', 'utf8'
      ));
      apiKey = (settings.env || {}).HONEYCOMB_DEVELOPMENT_KEY || '';
    } catch {}
    if (!apiKey) return;

    await fetch('https://api.honeycomb.io/1/events/pnpm-migration-adoption', {
      method: 'POST',
      headers: { 'X-Honeycomb-Team': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason,
        repo: getRepoName(),
        user: process.env.INTERCOM_USER || 'unknown',
        attempted_pm: agent,
        node_version: process.version,
        ...details,
      }),
      signal: AbortSignal.timeout(2000),
    });
  } catch {}
}

function normalizePath(p) {
  const home = require('os').homedir();
  return p.startsWith(home) ? p.replace(home, '~') : p;
}

function getToolInfo(name) {
  try {
    const rawPath = execSync(`which ${name}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
    const version = execSync(`${name} --version`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim();
    let symlink = '';
    try { symlink = execSync(`readlink ${rawPath}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim(); } catch {}
    const isCorepack = symlink.includes('corepack');
    return { installed: true, path: normalizePath(rawPath), version, via_corepack: isCorepack, symlink_target: symlink || 'not-a-symlink' };
  } catch {
    return { installed: false, path: '', version: '', via_corepack: false, symlink_target: '' };
  }
}

async function main() {
  if (!/pnpm/.test(agent)) {
    const pnpmInfo = getToolInfo('pnpm');
    const corepackInfo = getToolInfo('corepack');

    await sendTelemetry('wrong-package-manager', {
      has_corepack: corepackInfo.installed,
      corepack_path: corepackInfo.path,
      corepack_version: corepackInfo.version,
      has_pnpm: pnpmInfo.installed,
      pnpm_path: pnpmInfo.path,
      pnpm_version: pnpmInfo.version,
      pnpm_via_corepack: pnpmInfo.via_corepack,
      pnpm_symlink_target: pnpmInfo.symlink_target,
    });

    const hasStaleModules = fs.existsSync('node_modules') && !fs.existsSync('node_modules/.pnpm');
    const steps = ['\nThis repo uses pnpm, not yarn or npm.\n'];

    if (pnpmInfo.installed) {
      if (hasStaleModules) {
        steps.push('You have pnpm installed. Delete the stale node_modules and reinstall:');
        steps.push('  rm -rf node_modules');
        steps.push('  pnpm install\n');
      } else {
        steps.push('You have pnpm installed. Just run:');
        steps.push('  pnpm install\n');
      }
    } else {
      const ghCmd = 'gh api "repos/intercom/intercom-dev-env-setup/contents/scripts/migrate-to-corepack.sh"'
        + ' --jq \'.content\' | base64 --decode > /tmp/migrate-to-corepack.sh && bash /tmp/migrate-to-corepack.sh';
      steps.push('1. Run the pnpm setup script:');
      steps.push('     ' + ghCmd + '\n');
      steps.push('2. Delete node_modules and reinstall:');
      steps.push('     rm -rf node_modules');
      steps.push('     pnpm install\n');
    }

    console.error(steps.join('\n'));
    process.exit(1);
  }
}

main();
