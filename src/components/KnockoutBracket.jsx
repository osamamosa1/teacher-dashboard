import React from 'react';

const SLOT_H = 40;
const MATCH_GAP = 14;
const MATCH_BLOCK_H = SLOT_H * 2 + 6;

const slotStyle = (isWinner) => ({
  padding: '0.45rem 0.65rem',
  background: isWinner ? 'rgba(16,185,129,0.12)' : 'white',
  border: `1px solid ${isWinner ? '#6ee7b7' : '#e2e8f0'}`,
  borderRadius: '8px',
  fontSize: '0.8rem',
  fontWeight: isWinner ? 700 : 500,
  color: '#0f172a',
  minHeight: SLOT_H,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '0.5rem',
});

const ColumnConnector = ({ height }) => (
  <div
    className="shrink-0 flex items-center justify-center w-4"
    style={{ height }}
    aria-hidden
  >
    <div className="w-full h-0.5 bg-slate-300" />
  </div>
);

const KnockoutBracket = ({ bracket }) => {
  const rounds = bracket?.rounds || [];
  if (!rounds.length) {
    return (
      <p className="text-slate-400 text-sm text-center py-6">
        لم تبدأ مرحلة خروج المغلوب بعد
      </p>
    );
  }

  const sortedRounds = [...rounds].sort((a, b) => a.round - b.round);
  const maxMatches = Math.max(...sortedRounds.map((r) => r.matches.length), 1);
  const matchesHeight = maxMatches * MATCH_BLOCK_H + Math.max(0, maxMatches - 1) * MATCH_GAP;
  const columnHeight = matchesHeight + 28;
  const champion = bracket?.champion_name;

  return (
    <div className="w-full max-w-full overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* LTR معكوس: الجولة 1 شمال ← ... ← الفائز يمين */}
      <div
        dir="ltr"
        className="inline-flex flex-row items-center gap-0 pb-1"
        style={{ minWidth: 'max-content', height: columnHeight }}
      >
        {sortedRounds.map((round, roundIdx) => (
          <React.Fragment key={round.round}>
            {roundIdx > 0 && <ColumnConnector height={columnHeight} />}
            <div className="flex flex-col shrink-0 w-[190px]" style={{ height: columnHeight }}>
              <p className="text-center font-extrabold text-xs text-slate-500 mb-2 shrink-0">
                الجولة {round.round}
              </p>
              <div
                className="flex flex-col justify-around flex-1"
                style={{ minHeight: matchesHeight, gap: MATCH_GAP }}
              >
                {round.matches.map((m) => {
                  const p1Win = m.winner_name && m.winner_name === m.player1_name;
                  const p2Win = m.winner_name && m.winner_name === m.player2_name;
                  return (
                    <div key={m.id} className="flex flex-col gap-1.5 shrink-0">
                      <div style={slotStyle(p1Win)}>
                        <span>{m.player1_name}</span>
                        {(m.status === 'completed' || m.status === 'bye') && (
                          <span className="font-extrabold text-indigo-600">{m.player1_score ?? 0}</span>
                        )}
                      </div>
                      {!m.is_bye && (
                        <div style={slotStyle(p2Win)}>
                          <span>{m.player2_name}</span>
                          {m.status === 'completed' && (
                            <span className="font-extrabold text-indigo-600">{m.player2_score ?? 0}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </React.Fragment>
        ))}

        {champion && (
          <>
            <ColumnConnector height={columnHeight} />
            <div className="flex flex-col shrink-0 w-[130px] justify-center" style={{ height: columnHeight }}>
              <p className="text-center font-extrabold text-xs text-amber-700 mb-2">الفائز</p>
              <div className="px-3 py-3 bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-400 rounded-xl font-extrabold text-amber-900 text-center text-sm">
                🏆 {champion}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default KnockoutBracket;
