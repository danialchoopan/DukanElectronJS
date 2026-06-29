const fs = require('fs');

let c = fs.readFileSync('src/main/database/repositories/customerCredit.ts', 'utf8');
// Replace ALL instances of the broken pattern
c = c.split('\n').map(line => {
  if (line.includes('.all() as Record<string, unknown>[]).map(formatCredit)')) {
    return line.replace('.all() as Record<string, unknown>[]).map(formatCredit)', '.all() as Record<string, unknown>[]).map(formatCredit)');
  }
  return line;
}).join('\n');
fs.writeFileSync('src/main/database/repositories/customerCredit.ts', c);

let s = fs.readFileSync('src/main/database/repositories/serviceTickets.ts', 'utf8');
s = s.split('\n').map(line => {
  if (line.includes('.all(cutoffStr) as Record<string, unknown>[]).map(formatTicket)')) {
    return line.replace('.all(cutoffStr) as Record<string, unknown>[]).map(formatTicket)', '.all(cutoffStr) as Record<string, unknown>[]).map(formatTicket)');
  }
  return line;
}).join('\n');
fs.writeFileSync('src/main/database/repositories/serviceTickets.ts', s);
console.log('done');
