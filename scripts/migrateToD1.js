#!/usr/bin/env node

import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

// Read matches JSON
const matchesJson = fs.readFileSync('/tmp/matches.json', 'utf8');
const matches = JSON.parse(matchesJson);

console.log(`📦 Found ${matches.length} matches to migrate`);

// Generate INSERT statements
const sqlStatements = [];

for (const match of matches) {
  const {
    id,
    group_key,
    home_id,
    away_id,
    home_score,
    away_score,
    matchday,
    match_date,
    status,
    fixture_id
  } = match;

  const homeScoreVal = home_score !== null ? home_score : 'NULL';
  const awayScoreVal = away_score !== null ? away_score : 'NULL';
  const matchdayVal = matchday !== null ? matchday : 'NULL';
  const matchDateVal = match_date !== null ? `'${match_date}'` : 'NULL';
  const statusVal = status !== null ? `'${status}'` : "'NS'";
  const fixtureIdVal = fixture_id !== null ? fixture_id : 'NULL';

  const sql = `INSERT INTO match_results (id, group_key, home_id, away_id, home_score, away_score, matchday, match_date, status, fixture_id, updated_at) VALUES ('${id}', '${group_key}', '${home_id}', '${away_id}', ${homeScoreVal}, ${awayScoreVal}, ${matchdayVal}, ${matchDateVal}, ${statusVal}, ${fixtureIdVal}, datetime('now'));`;

  sqlStatements.push(sql);
}

// Write SQL file
const sqlFile = '/tmp/migrate_matches.sql';
fs.writeFileSync(sqlFile, sqlStatements.join('\n'));

console.log(`📝 Generated SQL file: ${sqlFile}`);
console.log(`🚀 Executing migration...`);

try {
  // Execute on remote D1
  const { stdout, stderr } = await execPromise(`wrangler d1 execute groupstages --remote --file=${sqlFile}`);

  console.log(stdout);
  if (stderr) console.error(stderr);

  console.log(`✅ Migration completed!`);
  console.log(`🔍 Verifying...`);

  // Verify count
  const { stdout: countOutput } = await execPromise(`wrangler d1 execute groupstages --remote --command="SELECT COUNT(*) as count FROM match_results"`);
  console.log(countOutput);

} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}
