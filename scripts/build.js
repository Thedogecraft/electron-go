const { execSync } = require('child_process');
const path = require('path');
const process = require('process');

const originalDir = process.cwd();
const goDir = path.join(__dirname, '..', 'go');

// Get the target from CLI args
const target = process.argv[2] || 'default';

try {
  process.chdir(goDir);

  console.log('📦 Downloading Go modules...');
  execSync('go mod download', { stdio: 'inherit' });
  console.log('✅ Go modules downloaded successfully!');

  console.log('🔨 Building Go binary...');
  const outputPath = path.join(originalDir, 'build', 'go', 'main.exe');
  execSync(`go build -o "${outputPath}"`, { stdio: 'inherit' });
  console.log('✅ Go binary built successfully!');
} catch (err) {
  console.error('❌ Failed to build Go project:', err);
  process.exit(1);
} finally {
  process.chdir(originalDir);
}

// Build Electron
try {
  console.log('🔨 Building Electron app...');
  execSync('npm run build-electron', { stdio: 'inherit' });
  console.log('✅ Electron app built successfully!');
} catch (err) {
  console.error('❌ Failed to build Electron app:', err);
  process.exit(1);
}

// Optional packaging
try {
  if (target === 'win') {
    console.log('📦 Packaging for Windows...');
    execSync('electron-builder --win', { stdio: 'inherit' });
  } else if (target === 'mac') {
    console.log('📦 Packaging for Mac...');
    execSync('electron-builder --mac', { stdio: 'inherit' });
  } else if (target === 'linux') {
    console.log('📦 Packaging for Linux...');
    execSync('electron-builder --linux', { stdio: 'inherit' });
  } else if (target === 'unpack') {
    console.log('📦 Running unpack build...');
    execSync('electron-builder --dir', { stdio: 'inherit' });
  } else {
    console.log('⚡ No platform specified, skipping packaging.');
  }

  console.log('✨ Build process completed!');
} catch (err) {
  console.error('❌ Failed during packaging:', err);
  process.exit(1);
}
