const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying MeetTime Setup...\n');

// Check if all required files exist
const requiredFiles = [
  'package.json',
  'server/package.json',
  'server/src/app.js',
  'src/services/apiService.ts',
  'src/services/socketService.ts',
  'src/services/webrtcService.ts',
  'src/hooks/useMeeting.ts',
  'src/hooks/useChat.ts',
  '.env',
  'server/.env'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log('✅', file);
  } else {
    console.log('❌', file, '(MISSING)');
    allFilesExist = false;
  }
});

console.log('\n📦 Checking Dependencies...');

// Check frontend dependencies
try {
  const frontendPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredFrontendDeps = [
    'react',
    'socket.io-client',
    'simple-peer',
    '@tanstack/react-query'
  ];
  
  requiredFrontendDeps.forEach(dep => {
    if (frontendPkg.dependencies[dep]) {
      console.log('✅ Frontend:', dep);
    } else {
      console.log('❌ Frontend:', dep, '(MISSING)');
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log('❌ Could not read frontend package.json');
  allFilesExist = false;
}

// Check backend dependencies
try {
  const backendPkg = JSON.parse(fs.readFileSync('server/package.json', 'utf8'));
  const requiredBackendDeps = [
    'express',
    'socket.io',
    'redis',
    'cors',
    'helmet'
  ];
  
  requiredBackendDeps.forEach(dep => {
    if (backendPkg.dependencies[dep]) {
      console.log('✅ Backend:', dep);
    } else {
      console.log('❌ Backend:', dep, '(MISSING)');
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log('❌ Could not read backend package.json');
  allFilesExist = false;
}

console.log('\n🔧 Environment Configuration...');

// Check environment files
try {
  const frontendEnv = fs.readFileSync('.env', 'utf8');
  if (frontendEnv.includes('VITE_SERVER_URL')) {
    console.log('✅ Frontend .env configured');
  } else {
    console.log('⚠️  Frontend .env missing VITE_SERVER_URL');
  }
} catch (error) {
  console.log('❌ Frontend .env file missing');
  allFilesExist = false;
}

try {
  const backendEnv = fs.readFileSync('server/.env', 'utf8');
  if (backendEnv.includes('PORT') && backendEnv.includes('NODE_ENV')) {
    console.log('✅ Backend .env configured');
  } else {
    console.log('⚠️  Backend .env missing required variables');
  }
} catch (error) {
  console.log('❌ Backend .env file missing');
  allFilesExist = false;
}

console.log('\n📋 Setup Summary:');
if (allFilesExist) {
  console.log('🎉 Setup verification completed successfully!');
  console.log('\n🚀 Next steps:');
  console.log('1. Run: npm run setup (to install all dependencies)');
  console.log('2. Run: npm run dev:all (to start both servers)');
  console.log('3. Open: http://localhost:5173 (frontend)');
  console.log('4. Backend API: http://localhost:3001 (backend)');
  console.log('\n📖 For Redis setup: See REDIS_SETUP.md');
} else {
  console.log('❌ Setup verification failed. Please check missing files/dependencies.');
  console.log('\n🔧 To fix issues:');
  console.log('1. Run: npm run setup');
  console.log('2. Check that all required files exist');
  console.log('3. Verify environment configuration');
}

console.log('\n📚 Documentation:');
console.log('- README.md - Main documentation');
console.log('- REDIS_SETUP.md - Redis installation guide');
console.log('- verify-setup.js - This verification script');