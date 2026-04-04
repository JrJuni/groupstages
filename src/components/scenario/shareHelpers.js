// ── 공유용 텍스트 생성 헬퍼 (순수 함수) ────────────────────

export function makeStandingsMd(groupKey, standings) {
  let md = `## 조 ${groupKey} 순위표\n\n`;
  md += '| # | 팀 | 경 | 승 | 무 | 패 | 득실 | 승점 |\n|---|---|---|---|---|---|---|---|\n';
  standings.forEach((t, i) => {
    const gd = t.gd > 0 ? `+${t.gd}` : `${t.gd}`;
    md += `| ${i + 1} | ${t.flag || ''} ${t.name} | ${t.played} | ${t.won} | ${t.drawn} | ${t.lost} | ${gd} | **${t.pts}** |\n`;
  });
  return md;
}

export function makeStandingsHtml(groupKey, standings) {
  let html = `<h3>조 ${groupKey} 순위표</h3><table border="1">`;
  html += '<tr><th>#</th><th>���</th><th>경기</th><th>승</th><th>무</th><th>패</th><th>득실</th><th>승점</th></tr>';
  standings.forEach((t, i) => {
    const gd = t.gd >= 0 ? `+${t.gd}` : `${t.gd}`;
    html += `<tr><td>${i + 1}</td><td>${t.flag || ''} ${t.name}</td><td>${t.played}</td><td>${t.won}</td><td>${t.drawn}</td><td>${t.lost}</td><td>${gd}</td><td><b>${t.pts}</b></td></tr>`;
  });
  return html + '</table>';
}

export function makeScenarioPanelMd(team, rank, bruteForce, standings) {
  const WDL = { W: '승', D: '무', L: '��' };
  const gd = team.gd >= 0 ? `+${team.gd}` : `${team.gd}`;
  let md = `## ${team.name} — 16강 진출 경우의 수\n\n`;
  md += `현재 **${rank}위** | ${team.played}경기 | **${team.pts}점** | 득실 ${gd} | 득점 ${team.gf}\n\n`;
  if (!bruteForce) { md += '모든 경기 완료\n'; return md; }

  const { rankProbabilities, topTwoProbability, thirdPlaceAdvancingProbability, matrix, otherMatch } = bruteForce;
  md += '### 순위 확률\n\n| 순위 | 확률 |\n|---|---|\n';
  [1, 2, 3, 4].forEach(r => { if (rankProbabilities[r] > 0) md += `| ${r}위 | ${rankProbabilities[r]}% |\n`; });
  md += `\n1·2위 직접 진출: **${topTwoProbability}%**`;
  if (thirdPlaceAdvancingProbability > 0) md += ` | 3위 진출 가능: **${thirdPlaceAdvancingProbability}%**`;
  md += '\n\n';

  const hasOther = otherMatch !== null;
  const otherHomeTeam = otherMatch ? standings.find(t => t.id === otherMatch.home) : null;
  const otherAwayTeam = otherMatch ? standings.find(t => t.id === otherMatch.away) : null;
  const getOL = (o) => o === 'W' ? `${otherHomeTeam?.name} 승` : o === 'D' ? '다른 경기 무승부' : `${otherAwayTeam?.name} 승`;
  const cells = hasOther ? matrix : matrix.filter(c => c.otherWDL === 'W');

  const byTWDL = {};
  for (const c of cells.filter(c => c.definitive !== null)) {
    if (!byTWDL[c.definitive]) byTWDL[c.definitive] = {};
    if (!byTWDL[c.definitive][c.teamWDL]) byTWDL[c.definitive][c.teamWDL] = [];
    if (hasOther) byTWDL[c.definitive][c.teamWDL].push(c.otherWDL);
  }
  const condLines = [];
  for (const r of [1, 2, 3, 4]) {
    const m = byTWDL[r]; if (!m) continue;
    const parts = ['W', 'D', 'L'].filter(t => m[t]).map(twdl => {
      const myT = `${team.name} ${WDL[twdl]}`;
      if (!hasOther || m[twdl].length === 3) return hasOther ? `${myT} (결과 무관)` : myT;
      return `${myT} & ${m[twdl].map(o => getOL(o)).join(' 또는 ')}`;
    });
    if (parts.length) condLines.push(`**${r}위 확정**: ${parts.join(', 또는 ')}`);
  }
  if (condLines.length) {
    md += '### 조건별 예상 순위\n\n' + condLines.join('\n\n') + '\n';
    if (cells.some(c => c.definitive === null)) md += '\n*(득실차 따라 결정되는 경우 있음)*\n';
  }
  return md;
}

export function makeScenarioPanelHtml(team, rank, bruteForce) {
  const gd = team.gd >= 0 ? `+${team.gd}` : `${team.gd}`;
  let html = `<h3>${team.name} — 16강 진출 경우의 수</h3>`;
  html += `<p>현재 <b>${rank}위</b> | ${team.played}��기 | <b>${team.pts}점</b> | 득실 ${gd} | 득��� ${team.gf}</p>`;
  if (!bruteForce) { return html + '<p>모든 경기 완료</p>'; }
  const { rankProbabilities, topTwoProbability, thirdPlaceAdvancingProbability } = bruteForce;
  html += '<h4>순위 확률</h4><table border="1"><tr><th>순위</th><th>확률</th></tr>';
  [1, 2, 3, 4].forEach(r => { if (rankProbabilities[r] > 0) html += `<tr><td>${r}위</td><td>${rankProbabilities[r]}%</td></tr>`; });
  html += `</table><p>1·2위 직접 진���: <b>${topTwoProbability}%</b>`;
  if (thirdPlaceAdvancingProbability > 0) html += ` | 3위 진출 가능: <b>${thirdPlaceAdvancingProbability}%</b>`;
  return html + '</p>';
}
