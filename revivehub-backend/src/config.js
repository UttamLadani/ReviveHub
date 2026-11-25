import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  commissionRate: 8, // percent of the sale price, recorded when an order is Closed
  orderNumberBase: 1000, // first order is RH-1001
  adminEmail: process.env.ADMIN_EMAIL || 'admin@revivehub.demo',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin@123',
};

export function assertConfig() {
  const problems = [];
  if (!config.mongoUri) problems.push('MONGODB_URI is missing in .env');
  if (config.jwtSecret.length < 32) problems.push('JWT_SECRET must be at least 32 characters in .env');
  if (problems.length) {
    console.error('\nConfiguration problem:\n - ' + problems.join('\n - '));
    console.error('\nCopy .env.example to .env and fill it in.\n');
    process.exit(1);
  }
}
