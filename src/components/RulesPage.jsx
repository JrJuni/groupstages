import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, Trophy, Target, Swords, Star, Shuffle } from 'lucide-react';

const Section = ({ icon: Icon, title, color = 'text-fifa-gold', children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon size={18} className={color} />
          <span className="font-bold text-white text-sm">{title}</span>
        </div>
        {open ? <ChevronUp size={16} className="text-fifa-muted" /> : <ChevronDown size={16} className="text-fifa-muted" />}
      </button>
      {open && <div className="px-5 pb-5 text-sm text-fifa-muted space-y-3">{children}</div>}
    </div>
  );
};

const Row = ({ rank, label, sub }) => (
  <div className="flex items-start gap-3 py-2 border-b border-fifa-border/30 last:border-0">
    <span className="shrink-0 w-7 h-7 rounded-full bg-fifa-blue/30 text-white text-xs font-bold flex items-center justify-center mt-0.5">
      {rank}
    </span>
    <div>
      <span className="text-white font-medium">{label}</span>
      {sub && <p className="text-xs text-fifa-muted mt-0.5 leading-relaxed">{sub}</p>}
    </div>
  </div>
);

const FPRow = ({ card, pts }) => (
  <div className="flex items-center justify-between py-1.5 border-b border-fifa-border/20 last:border-0">
    <span>{card}</span>
    <span className="font-bold text-red-400">{pts}</span>
  </div>
);

export default function RulesPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">

      {/* 헤더 박스 */}
      <div className="card px-5 py-4 flex items-start gap-3 bg-fifa-blue/10 border border-fifa-blue/30">
        <AlertCircle size={18} className="text-fifa-blue shrink-0 mt-0.5" />
        <p className="text-sm text-fifa-muted leading-relaxed">
          아래 규칙은 <strong className="text-white">FIFA 2026 월드컵 공식 대회 규정(2024년 승인)</strong>에 근거합니다.
          48개국이 참가하는 2026 대회는 4팀씩 12개 조로 진행되며, 각 조 상위 2팀과 3위팀 중 상위 8팀이 32강(녹아웃 스테이지)에 진출합니다.
        </p>
      </div>

      {/* 기본 승점 */}
      <Section icon={Trophy} title="기본 승점 제도" color="text-fifa-gold">
        <div className="grid grid-cols-3 gap-3 pt-1">
          {[
            { result: '승리', pts: '3점', color: 'bg-green-900/30 border-green-700/50 text-green-400' },
            { result: '무승부', pts: '1점', color: 'bg-yellow-900/30 border-yellow-700/50 text-yellow-400' },
            { result: '패배', pts: '0점', color: 'bg-red-900/20 border-red-700/30 text-red-400' },
          ].map(({ result, pts, color }) => (
            <div key={result} className={`rounded-lg border px-3 py-4 text-center ${color}`}>
              <p className="text-2xl font-black">{pts}</p>
              <p className="text-xs mt-1 opacity-80">{result}</p>
            </div>
          ))}
        </div>
        <p className="text-xs mt-2">각 조는 4팀이 홈앤어웨이 없이 풀리그(6경기) 방식으로 진행됩니다.</p>
      </Section>

      {/* 순위 결정 방식 */}
      <Section icon={Target} title="조별 순위 결정 기준 (동점 시 아래 순서 적용)" color="text-blue-400">
        <Row rank="1" label="승점" sub="가장 많은 승점을 획득한 팀이 우선합니다." />
        <Row rank="2" label="득실차 (전체)" sub="조별리그 전 경기의 득점에서 실점을 뺀 값이 높은 팀이 우선합니다." />
        <Row rank="3" label="다득점 (전체)" sub="조별리그 전 경기에서 득점이 많은 팀이 우선합니다." />
        <Row
          rank="4–6"
          label="상대전적 (Head-to-Head)"
          sub="동점 팀들끼리의 맞대결 기록만 적용 → ④ 상대전적 승점 → ⑤ 상대전적 득실차 → ⑥ 상대전적 다득점 순서로 비교합니다. 3팀 이상 동점 시, 상대전적 비교 후 한 팀이라도 분리되면 나머지 팀들에 대해 다시 ④–⑥을 반복 적용합니다."
        />
        <Row
          rank="7"
          label="페어플레이 포인트 (Fair Play)"
          sub="경고/퇴장 카드에 따른 벌점 합산이 낮은 팀이 우선합니다. (아래 카드 벌점표 참조)"
        />
        <Row rank="8" label="FIFA 랭킹" sub="FIFA 공식 랭킹 포인트가 높은 팀이 우선합니다." />
        <Row rank="9" label="추첨 (Drawing of Lots)" sub="위 모든 기준이 같을 경우 FIFA가 공개 추첨으로 결정합니다." />
      </Section>

      {/* 페어플레이 */}
      <Section icon={Swords} title="페어플레이 벌점표" color="text-yellow-400" defaultOpen={false}>
        <p className="mb-2">낮을수록 유리합니다. 벌점 합산이 작은 팀이 우선합니다.</p>
        <div className="rounded-lg border border-fifa-border/40 overflow-hidden text-xs">
          <div className="flex items-center justify-between px-4 py-2 bg-white/5 font-semibold text-white">
            <span>카드 종류</span>
            <span>벌점</span>
          </div>
          <div className="px-4 divide-y divide-fifa-border/20">
            <FPRow card="🟡 경고 1장" pts="-1점" />
            <FPRow card="🟡🟡 경고 2장 누적 퇴장 (간접 퇴장)" pts="-3점" />
            <FPRow card="🟥 직접 퇴장 (레드카드)" pts="-3점" />
            <FPRow card="🟡🟥 경고 후 직접 퇴장" pts="-4점" />
          </div>
        </div>
        <p className="text-xs mt-2 text-fifa-muted/70">출전 정지 등 행정 징계는 해당 선수에게 부과되며 팀 페어플레이 점수에는 영향을 주지 않습니다.</p>
      </Section>

      {/* 3위팀 진출 */}
      <Section icon={Star} title="3위팀 16강 진출 기준" color="text-green-400" defaultOpen={false}>
        <p>12개 조 각 3위팀 중 <strong className="text-white">상위 8팀</strong>이 32강에 진출합니다.</p>
        <div className="mt-3 space-y-2">
          <p className="text-white font-medium">3위팀 순위 결정 기준 (조별 2위팀 순위와 동일 방식)</p>
          <Row rank="1" label="승점" />
          <Row rank="2" label="득실차 (전체)" />
          <Row rank="3" label="다득점 (전체)" />
          <Row rank="4" label="페어플레이 포인트" />
          <Row rank="5" label="FIFA 랭킹" />
          <Row rank="6" label="추첨" />
        </div>
        <p className="text-xs mt-3 bg-fifa-blue/10 border border-fifa-blue/20 rounded px-3 py-2 text-white/70">
          3위팀 간에는 상대전적(Head-to-Head)을 적용하지 않습니다. 각 팀이 서로 다른 조에서 플레이하기 때문입니다.
        </p>
      </Section>

      {/* 32강 진출 구조 */}
      <Section icon={Shuffle} title="32강 대진 구조" color="text-purple-400" defaultOpen={false}>
        <p>각 조 1위(12팀) + 각 조 2위(12팀) + 3위 상위 8팀 = <strong className="text-white">총 32팀</strong>이 녹아웃 스테이지에 진출합니다.</p>
        <div className="mt-3 text-xs rounded-lg border border-fifa-border/40 overflow-hidden">
          <div className="px-4 py-2 bg-white/5 font-semibold text-white">진출 경로</div>
          <div className="divide-y divide-fifa-border/20">
            {[
              ['조 1위', '12팀', 'text-green-400'],
              ['조 2위', '12팀', 'text-blue-400'],
              ['조 3위 중 상위 8팀', '8팀', 'text-yellow-400'],
            ].map(([label, count, color]) => (
              <div key={label} className="flex justify-between px-4 py-2">
                <span>{label}</span>
                <span className={`font-bold ${color}`}>{count}</span>
              </div>
            ))}
            <div className="flex justify-between px-4 py-2 bg-white/5 font-semibold text-white">
              <span>합계</span>
              <span>32팀</span>
            </div>
          </div>
        </div>
        <p className="text-xs mt-3 text-fifa-muted/70">
          32강 매칭 방식(어느 조 1위가 어느 조 3위를 만나는지)은 진출한 3위팀의 조에 따라 FIFA 공식 브래킷표로 결정됩니다.
        </p>
      </Section>

      {/* 출처 */}
      <p className="text-center text-xs text-fifa-muted/50 pb-2">
        출처: FIFA World Cup 2026 – Competition Regulations (승인 2024) · FIFA.com
      </p>
    </div>
  );
}
