// ── 공유용 텍스트 생성 헬퍼 (순수 함수) ────────────────────
//
// 컴포넌트가 t() 와 teamName() 을 ctx로 전달:
//   const { t } = useTranslation('share');
//   const teamName = useTeamName();
//   makeStandingsMd(groupKey, standings, { t, teamName })
//
// t는 'share' 네임스페이스 기준으로 호출됨.

export function makeStandingsMd(groupKey, standings, { t, teamName }) {
  let md = `${t('groupStandings.mdTitle', { group: groupKey })}\n\n`;
  const h = t('groupStandings.header', { returnObjects: true });
  md += `| ${h.rank} | ${h.team} | ${h.played} | ${h.won} | ${h.drawn} | ${h.lost} | ${h.goalDiff} | ${h.points} |\n`;
  md += '|---|---|---|---|---|---|---|---|\n';
  standings.forEach((tm, i) => {
    const gd = tm.gd > 0 ? `+${tm.gd}` : `${tm.gd}`;
    md += `| ${i + 1} | ${tm.flag || ''} ${teamName(tm)} | ${tm.played} | ${tm.won} | ${tm.drawn} | ${tm.lost} | ${gd} | **${tm.pts}** |\n`;
  });
  return md;
}

export function makeStandingsHtml(groupKey, standings, { t, teamName }) {
  let html = `<h3>${t('groupStandings.htmlTitle', { group: groupKey })}</h3><table border="1">`;
  const h = t('groupStandings.header', { returnObjects: true });
  html += `<tr><th>${h.rank}</th><th>${h.team}</th><th>${h.playedFull}</th><th>${h.won}</th><th>${h.drawn}</th><th>${h.lost}</th><th>${h.goalDiff}</th><th>${h.points}</th></tr>`;
  standings.forEach((tm, i) => {
    const gd = tm.gd >= 0 ? `+${tm.gd}` : `${tm.gd}`;
    html += `<tr><td>${i + 1}</td><td>${tm.flag || ''} ${teamName(tm)}</td><td>${tm.played}</td><td>${tm.won}</td><td>${tm.drawn}</td><td>${tm.lost}</td><td>${gd}</td><td><b>${tm.pts}</b></td></tr>`;
  });
  return html + '</table>';
}

export function makeScenarioPanelMd(team, rank, bruteForce, standings, { t, teamName }) {
  const tn = teamName(team);
  const gd = team.gd >= 0 ? `+${team.gd}` : `${team.gd}`;
  let md = `${t('scenario.mdTitle', { team: tn })}\n\n`;
  md += t('scenario.currentLine', { rank, played: team.played, pts: team.pts, gd, gf: team.gf }) + '\n\n';
  if (!bruteForce) { md += t('scenario.allDone') + '\n'; return md; }

  const { rankProbabilities, topTwoProbability, thirdPlaceAdvancingProbability, matrix, otherMatch } = bruteForce;
  md += t('scenario.rankProbHeader') + '\n\n';
  md += `| ${t('scenario.rankCol')} | ${t('scenario.probCol')} |\n|---|---|\n`;
  [1, 2, 3, 4].forEach(r => {
    if (rankProbabilities[r] > 0) {
      md += `| ${t('scenario.rankRow', { rank: r })} | ${rankProbabilities[r]}% |\n`;
    }
  });
  md += '\n' + t('scenario.topTwoLine', { pct: topTwoProbability });
  if (thirdPlaceAdvancingProbability > 0) {
    md += t('scenario.thirdLine', { pct: thirdPlaceAdvancingProbability });
  }
  md += '\n\n';

  const hasOther = otherMatch !== null;
  const otherHomeTeam = otherMatch ? standings.find(s => s.id === otherMatch.home) : null;
  const otherAwayTeam = otherMatch ? standings.find(s => s.id === otherMatch.away) : null;
  const WDL = t('scenario.wdl', { returnObjects: true });
  const getOL = (o) => o === 'W'
    ? t('scenario.otherWin', { team: otherHomeTeam ? teamName(otherHomeTeam) : '' })
    : o === 'D'
      ? t('scenario.otherDraw')
      : t('scenario.otherWin', { team: otherAwayTeam ? teamName(otherAwayTeam) : '' });
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
    const parts = ['W', 'D', 'L'].filter(twdl => m[twdl]).map(twdl => {
      const myT = `${tn} ${WDL[twdl]}`;
      if (!hasOther || m[twdl].length === 3) {
        return hasOther ? t('scenario.condIgnoreOther', { team: tn, wdl: WDL[twdl] }) : myT;
      }
      return `${myT} & ${m[twdl].map(o => getOL(o)).join(t('scenario.or'))}`;
    });
    if (parts.length) {
      condLines.push(`${t('scenario.rankConfirmed', { rank: r })}: ${parts.join(t('scenario.join'))}`);
    }
  }
  if (condLines.length) {
    md += t('scenario.condTitle') + '\n\n' + condLines.join('\n\n') + '\n';
    if (cells.some(c => c.definitive === null)) md += '\n' + t('scenario.tiebreakerNote') + '\n';
  }
  return md;
}

export function makeScenarioPanelHtml(team, rank, bruteForce, { t, teamName }) {
  const tn = teamName(team);
  const gd = team.gd >= 0 ? `+${team.gd}` : `${team.gd}`;
  let html = `<h3>${t('scenario.htmlTitle', { team: tn })}</h3>`;
  html += `<p>${t('scenario.currentLineHtml', { rank, played: team.played, pts: team.pts, gd, gf: team.gf })}</p>`;
  if (!bruteForce) { return html + `<p>${t('scenario.allDone')}</p>`; }
  const { rankProbabilities, topTwoProbability, thirdPlaceAdvancingProbability } = bruteForce;
  html += `<h4>${t('scenario.rankProbHtmlHeader')}</h4><table border="1">`;
  html += `<tr><th>${t('scenario.rankCol')}</th><th>${t('scenario.probCol')}</th></tr>`;
  [1, 2, 3, 4].forEach(r => {
    if (rankProbabilities[r] > 0) {
      html += `<tr><td>${t('scenario.rankRow', { rank: r })}</td><td>${rankProbabilities[r]}%</td></tr>`;
    }
  });
  html += `</table><p>${t('scenario.topTwoLineHtml', { pct: topTwoProbability })}`;
  if (thirdPlaceAdvancingProbability > 0) {
    html += t('scenario.thirdLineHtml', { pct: thirdPlaceAdvancingProbability });
  }
  return html + '</p>';
}
