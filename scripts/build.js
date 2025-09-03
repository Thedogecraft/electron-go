const { execSync } = require('child_process');
const path = require('path');
const process = require('process');

const originalDir = process.cwd();
const goDir = path.join(__dirname, '..', 'go');


const target = process.argv[2] || 'default';

try {
    process.chdir(goDir);
  
    console.log('📦 Downloading Go modules...');
    execSync('go mod download', { stdio: 'inherit' });
    console.log('✅ Go modules downloaded successfully!');
  
    console.log('🔨 Building Go binary in the same folder...');
    const outputPath = path.join(goDir, process.platform === 'win32' ? 'main.exe' : 'main');
    execSync(`go build -o "${outputPath}"`, { stdio: 'inherit' });
    console.log('✅ Go binary built successfully at', outputPath);
  } catch (err) {
    console.error('❌ Failed to build Go project:', err);
    process.exit(1);
  } finally {
    process.chdir(originalDir);
  }

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
