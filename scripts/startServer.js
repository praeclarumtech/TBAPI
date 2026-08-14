import { spawn } from 'child_process';

const nodeEnv = process.argv[2] || process.env.NODE_ENV || 'development';
const command = nodeEnv === 'development' ? 'nodemon' : 'node';
const child = spawn(command, ['server.js'], {
  env: {
    ...process.env,
    NODE_ENV: nodeEnv,
  },
  shell: true,
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
