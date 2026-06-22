import type { NBAGame, Team, PlayerProp, PropStat } from '../types';
import { format, addDays } from 'date-fns';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba';

function parseTeam(competitor: any): Team {
  return {
    id: competitor.id,
    name: competitor.team.displayName,
    abbreviation: competitor.team.abbreviation,
    logo: competitor.team.logo,
    record: competitor.records?.[0]?.summary,
  };
}

function parseStatus(event: any): NBAGame['status'] {
  const type = event.status?.type?.name;
  if (type === 'STATUS_SCHEDULED' || type === 'STATUS_IN_PROGRESS' === false) {
    if (event.status?.type?.completed) return 'final';
    if (event.status?.type?.state === 'in') return 'live';
    if (event.status?.type?.state === 'post') return 'final';
    return 'scheduled';
  }
  if (type === 'STATUS_FINAL' || type === 'STATUS_FINAL_OVERTIME') return 'final';
  if (type === 'STATUS_IN_PROGRESS' || type === 'STATUS_HALFTIME') return 'live';
  if (type === 'STATUS_POSTPONED' || type === 'STATUS_CANCELED') return 'postponed';
  return 'scheduled';
}

function parseGame(event: any): NBAGame {
  const competition = event.competitions[0];
  const home = competition.competitors.find((c: any) => c.homeAway === 'home');
  const away = competition.competitors.find((c: any) => c.homeAway === 'away');
  const status = parseStatus(event);

  return {
    id: event.id,
    homeTeam: parseTeam(home),
    awayTeam: parseTeam(away),
    date: event.date,
    status,
    statusText: event.status?.type?.shortDetail || event.status?.type?.description || '',
    homeScore: status !== 'scheduled' ? parseInt(home.score || '0') : undefined,
    awayScore: status !== 'scheduled' ? parseInt(away.score || '0') : undefined,
    period: competition.status?.period,
    clock: competition.status?.displayClock,
  };
}

export async function fetchGamesForDate(date: Date): Promise<NBAGame[]> {
  const dateStr = format(date, 'yyyyMMdd');
  const url = `${ESPN_BASE}/scoreboard?dates=${dateStr}&limit=20`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`ESPN API error: ${res.status}`);

  const data = await res.json();
  const events: any[] = data.events || [];
  return events.map(parseGame);
}

export async function fetchTodayAndUpcoming(): Promise<{ today: NBAGame[]; upcoming: NBAGame[] }> {
  const today = new Date();
  const results = await Promise.allSettled([
    fetchGamesForDate(today),
    fetchGamesForDate(addDays(today, 1)),
    fetchGamesForDate(addDays(today, 2)),
    fetchGamesForDate(addDays(today, 3)),
  ]);

  const [todayRes, d1, d2, d3] = results;
  const todayGames = todayRes.status === 'fulfilled' ? todayRes.value : [];
  const upcomingGames = [
    ...(d1.status === 'fulfilled' ? d1.value : []),
    ...(d2.status === 'fulfilled' ? d2.value : []),
    ...(d3.status === 'fulfilled' ? d3.value : []),
  ];

  return { today: todayGames, upcoming: upcomingGames };
}

// Round a season average to the nearest .5 for a prop line
function toLine(avg: number): number {
  return Math.round(avg * 2) / 2;
}

// Fetch with a timeout so slow ESPN calls don't hang forever
async function fetchWithTimeout(url: string, ms = 4000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

// Fetch season averages for one player from ESPN
async function fetchPlayerSeasonAvg(athleteId: string): Promise<Record<PropStat, number> | null> {
  try {
    const res = await fetchWithTimeout(
      `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/athletes/${athleteId}/statistics`
    );
    if (!res.ok) return null;
    const data = await res.json();

    // ESPN returns categories array; find the regular season splits
    const splits = data.splits?.categories ?? [];
    const general = splits.find((c: any) => c.name === 'general') ?? splits[0];
    if (!general) return null;

    const stats: any = {};
    general.stats?.forEach((s: any) => { stats[s.name] = parseFloat(s.value ?? '0'); });

    return {
      points: stats['avgPoints'] ?? stats['points'] ?? 0,
      rebounds: stats['avgRebounds'] ?? stats['rebounds'] ?? 0,
      assists: stats['avgAssists'] ?? stats['assists'] ?? 0,
      threes: stats['avg3PointFieldGoalsMade'] ?? stats['threePointFieldGoalsMade'] ?? 0,
    };
  } catch {
    return null;
  }
}

// Fetch top players + their prop lines for a game
export async function fetchPropsForGame(gameId: string): Promise<PlayerProp[]> {
  try {
    const res = await fetch(`${ESPN_BASE}/summary?event=${gameId}`);
    if (!res.ok) return [];
    const data = await res.json();

    const rosters: any[] = data.rosters ?? [];
    if (rosters.length === 0) return [];

    const props: PlayerProp[] = [];

    // Fetch all teams in parallel, 3 candidates per team
    await Promise.all(rosters.slice(0, 2).map(async (roster) => {
      const teamAbbrev: string = roster.team?.abbreviation ?? '';
      const athletes: any[] = roster.athletes ?? [];
      const candidates = athletes.slice(0, 3).filter((a: any) => a.athlete?.id);

      // All player stat fetches in parallel
      const withAvgs = await Promise.all(
        candidates.map(async (a: any) => {
          const avgs = await fetchPlayerSeasonAvg(a.athlete.id);
          return { athlete: a.athlete, avgs };
        })
      );

      const ranked = withAvgs
        .filter((x) => x.avgs && x.avgs.points > 5)
        .sort((a, b) => (b.avgs?.points ?? 0) - (a.avgs?.points ?? 0))
        .slice(0, 3);

      for (const { athlete, avgs } of ranked) {
        if (!avgs) continue;
        const statDefs: { stat: PropStat; avg: number }[] = [
          { stat: 'points', avg: avgs.points },
          { stat: 'rebounds', avg: avgs.rebounds },
          { stat: 'assists', avg: avgs.assists },
        ];
        if (avgs.threes >= 1.5) statDefs.push({ stat: 'threes', avg: avgs.threes });

        for (const { stat, avg } of statDefs) {
          if (avg < 1) continue;
          props.push({
            playerId: athlete.id,
            playerName: athlete.displayName,
            playerPhoto: athlete.headshot?.href,
            teamAbbrev,
            gameId,
            stat,
            line: toLine(avg),
            seasonAvg: avg,
          });
        }
      }
    }));

    return props;
  } catch {
    return [];
  }
}

// Fetch actual player stats from a completed game's box score
export async function fetchBoxScoreStats(
  gameId: string
): Promise<Record<string, Record<PropStat, number>>> {
  try {
    const res = await fetch(`${ESPN_BASE}/summary?event=${gameId}`);
    if (!res.ok) return {};
    const data = await res.json();

    const result: Record<string, Record<PropStat, number>> = {};
    const boxscore = data.boxscore;
    if (!boxscore) return {};

    for (const team of boxscore.players ?? []) {
      for (const statGroup of team.statistics ?? []) {
        for (const athlete of statGroup.athletes ?? []) {
          const id: string = athlete.athlete?.id;
          if (!id) continue;
          const stats: string[] = athlete.stats ?? [];
          const keys: string[] = statGroup.keys ?? [];

          const get = (name: string) => {
            const i = keys.indexOf(name);
            return i >= 0 ? parseFloat(stats[i] ?? '0') : 0;
          };

          result[id] = {
            points: get('PTS'),
            rebounds: get('REB'),
            assists: get('AST'),
            threes: get('3PM'),
          };
        }
      }
    }

    return result;
  } catch {
    return {};
  }
}

export async function fetchGameById(gameId: string): Promise<NBAGame | null> {
  try {
    const res = await fetch(`${ESPN_BASE}/summary?event=${gameId}`);
    if (!res.ok) return null;
    const data = await res.json();
    // ESPN summary has a different structure, parse accordingly
    const header = data.header;
    if (!header) return null;

    const home = header.competitions[0].competitors.find((c: any) => c.homeAway === 'home');
    const away = header.competitions[0].competitors.find((c: any) => c.homeAway === 'away');

    return {
      id: header.id,
      homeTeam: {
        id: home.id,
        name: home.team.displayName,
        abbreviation: home.team.abbreviation,
        logo: home.team.logo,
        record: home.record,
      },
      awayTeam: {
        id: away.id,
        name: away.team.displayName,
        abbreviation: away.team.abbreviation,
        logo: away.team.logo,
        record: away.record,
      },
      date: header.competitions[0].date,
      status: header.competitions[0].status?.type?.completed ? 'final' : 'scheduled',
      statusText: header.competitions[0].status?.type?.shortDetail || '',
      homeScore: parseInt(home.score || '0'),
      awayScore: parseInt(away.score || '0'),
    };
  } catch {
    return null;
  }
}
