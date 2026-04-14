import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, RotateCcw, ChevronRight, Shuffle } from 'lucide-react';
import { DRAW_POTS, CONFEDERATIONS } from '../leagues/worldcup2026/data.js';
import { createInitialDrawState, runFullDraw, generateDrawSteps } from '../utils/draw.js';
import { BASE_URL } from '../config.js';
import { useTeamName } from '../i18n/useTeamName.js';

const POT_COLORS = {
  pot1: { bg: 'bg-yellow-900/30', border: 'border-yellow-600', text: 'text-yellow-400', label: 'Pot 1' },
  pot2: { bg: 'bg-blue-900/30', border: 'border-blue-600', text: 'text-blue-400', label: 'Pot 2' },
  pot3: { bg: 'bg-purple-900/30', border: 'border-purple-600', text: 'text-purple-400', label: 'Pot 3' },
  pot4: { bg: 'bg-green-900/30', border: 'border-green-600', text: 'text-green-400', label: 'Pot 4' },
};

const CONF_COLORS = {
  UEFA: 'bg-blue-900/40 text-blue-300',
  CONMEBOL: 'bg-yellow-900/40 text-yellow-300',
  CAF: 'bg-green-900/40 text-green-300',
  AFC: 'bg-red-900/40 text-red-300',
  CONCACAF: 'bg-orange-900/40 text-orange-300',
  OFC: 'bg-purple-900/40 text-purple-300',
};

function TeamBall({ team, potKey, highlight = false, small = false }) {
  const teamName = useTeamName();
  const tn = teamName(team);
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all duration-300 cursor-default
        ${small ? 'text-xs' : 'text-sm'}
        ${highlight ? `${POT_COLORS[potKey]?.bg} ${POT_COLORS[potKey]?.border} animate-ball-bounce` : 'bg-white/5 border-fifa-border/50'}
      `}
    >
      {team.flagImg
        ? <>
            <img src={`${BASE_URL}${team.flagImg}`} alt={tn} className={small ? 'w-5 h-3' : 'w-6 h-4'} style={{objectFit:'cover', borderRadius:'2px'}} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }} />
            <span style={{ display: 'none' }} className={small ? 'text-sm' : 'text-base'}>{team.flag}</span>
          </>
        : <span className={small ? 'text-sm' : 'text-base'}>{team.flag}</span>}
      <span className={`font-medium ${highlight ? 'text-white' : 'text-fifa-text'}`}>{tn}</span>
      <span className={`text-xs px-1 rounded ${CONF_COLORS[team.confederation] || 'bg-gray-800 text-gray-400'}`}>
        {team.confederation}
      </span>
      {team.host && <span className="text-xs text-fifa-gold">H</span>}
    </div>
  );
}

export default function DrawSimulator() {
  const { t } = useTranslation('bracket');
  const teamName = useTeamName();
  const [drawState, setDrawState] = useState(createInitialDrawState(DRAW_POTS));
  const [steps, setSteps] = useState([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(600);
  const [lastDrawn, setLastDrawn] = useState(null);
  const intervalRef = useRef(null);

  const reset = () => {
    clearInterval(intervalRef.current);
    setDrawState(createInitialDrawState(DRAW_POTS));
    setSteps([]);
    setStepIdx(-1);
    setIsPlaying(false);
    setLastDrawn(null);
  };

  const startAutoPlay = () => {
    if (steps.length === 0) {
      const newSteps = generateDrawSteps(DRAW_POTS);
      setSteps(newSteps);
      setStepIdx(0);
      setDrawState(newSteps[0]);
      setLastDrawn(newSteps[0].stepTeam);
      setIsPlaying(true);
      return;
    }
    setIsPlaying(true);
  };

  const instantDraw = () => {
    clearInterval(intervalRef.current);
    const result = runFullDraw(DRAW_POTS);
    setDrawState(result);
    setSteps([]);
    setStepIdx(-1);
    setIsPlaying(false);
    setLastDrawn(null);
  };

  useEffect(() => {
    if (!isPlaying || steps.length === 0) return;
    intervalRef.current = setInterval(() => {
      setStepIdx((prev) => {
        const next = prev + 1;
        if (next >= steps.length) {
          setIsPlaying(false);
          clearInterval(intervalRef.current);
          return prev;
        }
        setDrawState(steps[next]);
        setLastDrawn(steps[next].stepTeam);
        return next;
      });
    }, speed);
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, steps, speed]);

  const totalAssigned = drawState.groups.reduce((s, g) => s + g.teams.length, 0);
  const isComplete = drawState.isComplete || (steps.length > 0 && stepIdx >= steps.length - 1) || totalAssigned === 48;
  const progress = steps.length > 0 ? Math.round(((stepIdx + 1) / steps.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-fifa-muted text-sm">{t('draw.speed')}</span>
          {[1000, 600, 300].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                speed === s ? 'bg-fifa-gold text-black' : 'bg-white/10 text-fifa-muted hover:text-white'
              }`}
            >
              {s === 1000 ? t('draw.speedSlow') : s === 600 ? t('draw.speedNormal') : t('draw.speedFast')}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={reset} className="btn-ghost flex items-center gap-1 text-sm">
            <RotateCcw size={14} /> {t('draw.reset')}
          </button>
          <button onClick={instantDraw} className="btn-ghost flex items-center gap-1 text-sm">
            <Shuffle size={14} /> {t('draw.instantDraw')}
          </button>
          <button
            onClick={isPlaying ? () => setIsPlaying(false) : startAutoPlay}
            disabled={isComplete && steps.length > 0}
            className="btn-gold flex items-center gap-1 text-sm disabled:opacity-50"
          >
            <Play size={14} /> {isPlaying ? t('draw.pause') : isComplete ? t('draw.completed') : t('draw.drawStart')}
          </button>
        </div>
      </div>

      {/* Progress */}
      {steps.length > 0 && (
        <div className="card p-3">
          <div className="flex justify-between text-xs text-fifa-muted mb-1">
            <span>{t('draw.drawProgress')}</span>
            <span>{stepIdx + 1}/{steps.length}</span>
          </div>
          <div className="h-1.5 bg-fifa-border rounded-full overflow-hidden">
            <div
              className="h-full bg-fifa-gold rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Last Drawn */}
      {lastDrawn && (
        <div className="card p-3 flex items-center gap-3 border-fifa-gold/30 bg-yellow-900/10 animate-fade-in">
          {lastDrawn.flagImg
          ? <img src={`${BASE_URL}${lastDrawn.flagImg}`} alt="" className="w-8 h-5" style={{objectFit:'cover', borderRadius:'2px'}} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }} />
          : null}
        <span className="text-2xl" style={lastDrawn.flagImg ? { display: 'none' } : {}}>{lastDrawn.flag}</span>
          <div>
            <p className="text-xs text-fifa-muted">{t('draw.lastDrawn')}</p>
            <p className="font-bold text-white">{teamName(lastDrawn)}</p>
          </div>
          <ChevronRight size={16} className="text-fifa-muted" />
          <div>
            <p className="text-xs text-fifa-muted">{t('draw.assignedGroup')}</p>
            <p className="font-bold text-fifa-gold text-xl">
              {t('draw.groupLabel', { group: drawState.history[drawState.history.length - 1]?.group })}
            </p>
          </div>
        </div>
      )}

      {/* Pots */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(POT_COLORS).map(([potKey, colors]) => {
          const remaining = drawState.remainingPots?.[potKey] || [];
          const total = DRAW_POTS[potKey]?.length || 0;
          const drawn = total - remaining.length;
          return (
            <div key={potKey} className={`card p-3 border ${colors.border}`}>
              <div className={`text-xs font-bold mb-2 ${colors.text}`}>
                {colors.label}
                <span className="ml-2 font-normal text-fifa-muted">{drawn}/{total}</span>
              </div>
              <div className="space-y-1">
                {remaining.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center gap-1 text-xs text-fifa-muted"
                  >
                    {team.flagImg
                      ? <img src={`${BASE_URL}${team.flagImg}`} alt="" className="w-5 h-3" style={{objectFit:'cover', borderRadius:'2px'}} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }} />
                      : null}
                    <span style={team.flagImg ? { display: 'none' } : {}}>{team.flag}</span>
                    <span>{teamName(team)}</span>
                  </div>
                ))}
                {remaining.length === 0 && (
                  <p className={`text-xs ${colors.text}`}>{t('draw.drawComplete')}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Draw Result - Groups Grid */}
      <div>
        <h3 className="text-sm font-bold text-fifa-muted mb-3">{t('draw.drawResult')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {drawState.groups.map((group) => (
            <div key={group.name} className="card p-3">
              <div className="text-xs font-bold text-fifa-gold mb-2">{t('draw.groupName', { name: group.name })}</div>
              {group.teams.length === 0 ? (
                <p className="text-xs text-fifa-border">{t('draw.unassigned')}</p>
              ) : (
                <div className="space-y-1.5">
                  {group.teams.map((team, idx) => {
                    const potKey = Object.entries(POT_COLORS)[idx]?.[0] || 'pot4';
                    return (
                      <div key={team.id} className="flex items-center gap-1.5 text-xs">
                        {team.flagImg
                          ? <img src={`${BASE_URL}${team.flagImg}`} alt="" className="w-5 h-3" style={{objectFit:'cover', borderRadius:'2px'}} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }} />
                          : null}
                        <span className="text-sm" style={team.flagImg ? { display: 'none' } : {}}>{team.flag}</span>
                        <span className="text-white font-medium flex-1">{teamName(team)}</span>
                        <span className={`text-xs px-1 rounded ${CONF_COLORS[team.confederation]}`}>
                          {team.confederation.slice(0, 3)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
