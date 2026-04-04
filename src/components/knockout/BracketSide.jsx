import React from 'react';
import MatchCard from './MatchCard.jsx';

const ROUND_ORDER = ['R32', 'R16', 'QF', 'SF'];
const ROUND_LABELS = { R32: '32강', R16: '16강', QF: '8강', SF: '4강' };

/**
 * 매치 쌍을 커넥터로 연결
 * direction: 'ltr' (left bracket) | 'rtl' (right bracket)
 */
function ConnectorPair({ children, direction, round }) {
  const borderSide = direction === 'ltr' ? 'border-r-2' : 'border-l-2';
  const afterSide = direction === 'ltr' ? 'after:right-0' : 'after:left-0';
  const lineSide = direction === 'ltr' ? 'after:translate-x-px' : 'after:-translate-x-px';

  return (
    <div className="flex-1 flex flex-col justify-center">
      <div
        className={`flex flex-col justify-center relative
          ${borderSide} border-fifa-border/40
          after:content-[''] after:absolute ${afterSide} after:top-1/2 after:-translate-y-px
          after:w-3 after:h-[2px] after:bg-fifa-border/40 ${lineSide}`}
      >
        {React.Children.map(children, (child, i) => (
          <div key={i} className={`${i === 0 ? 'pb-1' : 'pt-1'}`}>
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BracketSide({
  side,
  bracket,
  resolvedTeams,
  highlights,
  thirdCandidates,
  confirmedSlots,
}) {
  const direction = side === 'left' ? 'ltr' : 'rtl';
  const rounds = ROUND_ORDER.map((roundName) =>
    bracket
      .filter((m) => m.round === roundName && m.side === side)
      .sort((a, b) => a.pos - b.pos)
  );

  // 라운드 열 순서: left는 R32→R16→QF→SF, right는 SF→QF→R16→R32
  const orderedRounds = side === 'right' ? [...rounds].reverse() : rounds;
  const orderedLabels = side === 'right'
    ? [...ROUND_ORDER].reverse()
    : ROUND_ORDER;

  return (
    <div className="flex gap-0 flex-1">
      {orderedRounds.map((matches, colIdx) => {
        const roundName = orderedLabels[colIdx];
        // R32: 8개, R16: 4개, QF: 2개, SF: 1개 — 매치 쌍으로 커넥터 연결
        const pairs = [];
        for (let i = 0; i < matches.length; i += 2) {
          pairs.push(matches.slice(i, i + 2));
        }

        return (
          <div key={roundName} className="flex flex-col flex-1 min-w-0">
            {/* 라운드 라벨 */}
            <div className="text-[10px] text-center text-fifa-muted font-medium mb-1">
              {ROUND_LABELS[roundName]}
            </div>

            <div className="flex flex-col flex-1 justify-around gap-1">
              {pairs.length > 0 && roundName !== 'SF' ? (
                pairs.map((pair, pairIdx) => (
                  <ConnectorPair
                    key={pairIdx}
                    direction={direction}
                    round={roundName}
                  >
                    {pair.map((match) => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        resolvedTeams={resolvedTeams}
                        highlights={highlights}
                        thirdCandidates={thirdCandidates}
                        confirmedSlots={confirmedSlots}
                        side={side}
                      />
                    ))}
                  </ConnectorPair>
                ))
              ) : (
                matches.map((match) => (
                  <div key={match.id} className="flex-1 flex flex-col justify-center">
                    <MatchCard
                      match={match}
                      resolvedTeams={resolvedTeams}
                      highlights={highlights}
                      thirdCandidates={thirdCandidates}
                      confirmedSlots={confirmedSlots}
                      side={side}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
