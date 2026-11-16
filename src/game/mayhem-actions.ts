import { PORTFOLIOS, type Portfolio } from './mayhem';
import { rng } from './rng';
import type { Leader } from './types';

export interface DuelStory {
  portfolio: Portfolio;
  crisis: string;
  myAction: string;
  theirAction: string;
  climax: string;
  upset: boolean;
}

const CRISES: Record<Portfolio, readonly string[]> = {
  education: [
    'National Literacy & Schooling Drive',
    'Space & Scientific Research Race',
    'University & Technical Academy Reform',
    'Public Curriculum & Cultural Modernization',
    'National Scholarship & Lab Funding Summit',
    'Universal School Access Act',
  ],
  war: [
    'Two-Front Mobilization Crisis',
    'Strategic Strait Naval Blockade',
    'Allied High Command Summit',
    'Border Escalation & Defense Line',
    'Air & Supply Corridor Operation',
    'Emergency War Cabinet Session',
  ],
  economy: [
    'Sovereign Debt & Currency Run',
    'Five-Year Industrial Modernization Plan',
    'Inflation Shock & Central Bank Summit',
    'Global Trade & Tariff Standoff',
    'Infrastructure & Energy Grid Boom',
    'Emergency Budget & Tax Overhaul',
  ],
  domestic: [
    'Constitutional Reform Referendum',
    'General Strike & Social Pact Talks',
    'Civil Rights & Institutional Overhaul',
    'Coalition Confidence Vote',
    'National Welfare & Pension Bill',
    'State Authority & Public Order Crisis',
  ],
  foreign: [
    'High-Stakes Peace Conference',
    'Backchannel Brinkmanship Summit',
    'Continental Security & Alliance Pact',
    'Sanctions & Diplomatic Standoff',
    'Treaty Ratification Showdown',
    'Global Non-Alignment & Summit Talks',
  ],
};

type Tier = 'high' | 'mid' | 'low';

const TIER_ACTIONS: Record<Portfolio, Record<Tier, readonly string[]>> = {
  education: {
    high: [
      'Builds flagship technical institutes and makes universal schooling a national priority.',
      'Triples research budgets and launches a historic literacy and science campaign.',
      'Reforms the entire school system and attracts world-leading scholars and laboratories.',
      'Establishes free compulsory education and opens a network of modern universities.',
      'Unites scientific academies behind an ambitious national technology program.',
    ],
    mid: [
      'Passes a steady school modernization bill and expands teacher training.',
      'Negotiates a balanced university budget with provincial education boards.',
      'Updates textbooks and funds new regional vocational colleges.',
      'Maintains stable funding for public schools and national museums.',
      'Brokers a compromise on exam standards and classroom construction.',
    ],
    low: [
      'Forms a sub-committee that debates textbook fonts for eighteen months.',
      'Cuts laboratory grants to fund a ceremonial ministry renovation.',
      'Proposes a baffling curriculum reform that leaves teachers and students confused.',
      'Sidelines university deans and stalls the school construction bill.',
      'Delivers a three-hour ribbon-cutting speech with no new funding attached.',
    ],
  },
  war: {
    high: [
      'Rallies the war cabinet, secures supply lines, and executes a decisive counter-offensive.',
      'Reorganizes the high command and turns a desperate defense into a strategic breakthrough.',
      'Mobilizes industrial production and coordinates a victorious multi-front campaign.',
      'Holds the line under heavy pressure before striking the enemy flank at dawn.',
      'Unites allied commanders around a bold operational plan that breaks the siege.',
    ],
    mid: [
      'Fortifies border defenses and keeps the reserve divisions in disciplined readiness.',
      'Conducts a cautious defensive campaign that preserves key supply depots.',
      'Modernizes artillery logistics and holds the frontier through winter.',
      'Coordinates a measured deterrence patrol along the contested zone.',
      'Stabilizes the front line after weeks of positional attrition.',
    ],
    low: [
      'Convenes a six-hour committee argument over parade uniforms while the front stalls.',
      'Orders an ill-prepared advance without maps, fuel reserves, or winter boots.',
      'Changes the battle plan three times in one morning, confusing the generals.',
      'Ignores intelligence warnings and leaves the main supply bridge unguarded.',
      'Inspects a ceremonial guard regiment while field commanders wait for orders.',
    ],
  },
  economy: {
    high: [
      'Launches a sweeping industrial and infrastructure boom that doubles export capacity.',
      'Stabilizes the currency overnight and ignites a decade of record growth.',
      'Pushes through a landmark modernization pact that transforms ports, rails, and factories.',
      'Restores confidence with a bold recovery program that puts millions back to work.',
      'Anchors sound monetary policy while opening high-value manufacturing corridors.',
    ],
    mid: [
      'Presents a pragmatic balanced budget that keeps inflation and debt in check.',
      'Signs a steady trade agreement and trims industrial bottlenecks.',
      'Nudges growth forward with targeted tax relief and port upgrades.',
      'Calms bond markets with a cautious fiscal package and central bank backing.',
      'Brokers a wage-and-price compromise between unions and factory owners.',
    ],
    low: [
      'Prints banknotes around the clock, triggering a sudden run on the currency.',
      'Imposes overnight price freezes that empty grocery shelves by Tuesday.',
      'Spends the emergency reserve on prestige monuments while factories sit idle.',
      'Announces three contradictory tax decrees in a single afternoon.',
      'Blames speculators while the national treasury runs out of foreign reserves.',
    ],
  },
  domestic: {
    high: [
      'Forges a historic national reconciliation and anchors lasting constitutional institutions.',
      'Commands overwhelming public authority and passes landmark social legislation.',
      'Defuses a nationwide crisis and reshapes the state with a decisive reform mandate.',
      'Unites fractured factions behind a foundational civic and institutional settlement.',
      'Builds an unshakable domestic coalition that transforms daily life across the country.',
    ],
    mid: [
      'Steers a workable coalition bill through parliament after late-night talks.',
      'Maintains calm in the provinces with pragmatic administrative reforms.',
      'Balances competing parliamentary factions to keep the cabinet intact.',
      'Settles the municipal dispute with a measured package of local grants.',
      'Preserves institutional stability through a turbulent parliamentary session.',
    ],
    low: [
      'Calls a surprise confidence vote and immediately loses three coalition partners.',
      'Sparks a cabinet revolt by reshuffling four ministries before breakfast.',
      'Gets bogged down in protocol disputes while protesters fill the capital square.',
      'Proposes an unpopular decree that unites rival parties against the government.',
      'Retreats to the presidential residence while parliament deadlocks for weeks.',
    ],
  },
  foreign: {
    high: [
      'Reshapes the international order with a historic treaty and masterly summit diplomacy.',
      'Outmaneuvers rival powers at the conference table and secures a landmark alliance.',
      'Opens a bold diplomatic channel that defuses a global standoff on favorable terms.',
      'Commands the summit room and unites foreign capitals behind a new security architecture.',
      'Turns a tense diplomatic crisis into a generational geopolitical triumph.',
    ],
    mid: [
      'Maintains cordial embassy ties and signs a practical bilateral cooperation protocol.',
      'Holds firm in treaty talks and secures a respectable border communiqué.',
      'Represents the country steadily at the regional summit without major concessions.',
      'Keeps alliance commitments on track through quiet ministerial shuttle talks.',
      'Concludes a standard consular and trade accord with neighboring states.',
    ],
    low: [
      'Arrives late to the summit, misreads the briefing folder, and alienates key allies.',
      'Walks out of peace talks on day one, leaving the delegation isolated.',
      'Signs a vague communiqué that concedes the main point without getting anything back.',
      'Creates a diplomatic incident over seating protocol at the state banquet.',
      'Sends conflicting cables to three embassies at once, baffling foreign capitals.',
    ],
  },
};

/** Signature historical moves for iconic leaders on specific portfolios. */
const SIGNATURES: Record<string, Partial<Record<Portfolio, string>>> = {
  Q8016: {
    war: 'Delivers a defiant wartime broadcast and rallies the Grand Alliance across Atlantic and Channel.',
    foreign: 'Forges the wartime Big Three coalition and shapes the post-war Atlantic charter.',
  },
  Q8007: {
    economy: 'Launches the New Deal works programs, reviving banks, industry, and employment.',
    domestic: 'Establishes Social Security and rallies the nation with Fireside Chats.',
    war: 'Mobilizes the Arsenal of Democracy across both oceans.',
    foreign: 'Architects the United Nations and the wartime allied coalition.',
  },
  Q2042: {
    war: 'Appeals for resistance from London and leads Free France to liberation.',
    domestic: 'Founds the Fifth Republic by referendum and restores strong executive authority.',
    foreign: 'Pursues a sovereign grand strategy of national independence between the blocs.',
    economy: 'Presides over the Trente Glorieuses industrial and nuclear modernization.',
  },
  Q7416: {
    economy: 'Deregulates the City, privatizes state industries, and breaks the inflation spiral.',
    war: 'Dispatches the naval task force to retake the Falklands.',
    foreign: 'Stands firm in Cold War summits while negotiating hard in Brussels.',
  },
  Q8023: {
    domestic: 'Leads a peaceful post-apartheid transition through truth, reconciliation, and a new constitution.',
    foreign: 'Commands unmatched moral authority across capitals worldwide.',
  },
  Q5152: {
    education: 'Introduces a new alphabet and establishes secular compulsory schooling nationwide.',
    war: 'Wins the War of Independence and secures the republic’s borders.',
    domestic: 'Founds a modern secular republic and overhauls law and civic life.',
  },
  Q131248: {
    economy: 'Transforms a colonial port into a global financial and high-tech powerhouse.',
    education: 'Builds a rigorous bilingual education system and world-class polytechnics.',
    domestic: 'Creates universal public housing and a tightly run meritocratic civil service.',
  },
  Q30487: {
    foreign: 'Signs historic nuclear disarmament treaties and brings the Cold War to a peaceful end.',
    economy: 'Attempts an erratic Perestroika reform as supply chains unravel.',
  },
  Q1047: {
    education: 'Establishes the Indian Institutes of Technology and champions scientific research.',
    domestic: 'Anchors parliamentary democracy and secular federalism across a newly independent nation.',
    foreign: 'Co-founds the Non-Aligned Movement on the world stage.',
  },
  Q567: {
    economy: 'Steers the Eurozone through sovereign debt storms while keeping export industry strong.',
    foreign: 'Brokers marathon European Council compromises in Brussels.',
    war: 'Avoids military entanglements and keeps defense spending minimal.',
  },
  Q2492: {
    economy: 'Unleashes the Wirtschaftswunder social-market recovery alongside Ludwig Erhard.',
    foreign: 'Anchors the country in the West and seals Franco-German reconciliation.',
  },
  Q1394: {
    war: 'Organizes the Red Army victory in the civil war to hold power.',
    economy: 'Swings from War Communism requisitions to the New Economic Policy.',
  },
  Q855: {
    war: 'Mobilizes vast industrial reserves behind the Urals to win the Eastern Front.',
    economy: 'Enforces ruthless Five-Year heavy industrialization plans.',
    foreign: 'Carves out an Eastern sphere of influence at Yalta and Potsdam.',
  },
  Q5816: {
    war: 'Wins a continental civil war through protracted guerrilla and mobile campaigns.',
    economy: 'Launches the Great Leap Forward, causing catastrophic economic disruption.',
    education: 'Shutters universities across the country during the Cultural Revolution.',
  },
  Q9640: {
    education: 'Signs the Elementary and Secondary Education Act and Higher Education Act.',
    domestic: 'Pushes the Civil Rights Act, Voting Rights Act, and Medicare through Congress.',
    foreign: 'Escalates troop commitments in Vietnam, miring the presidency.',
  },
  Q9588: {
    foreign: 'Opens relations with Beijing and signs the SALT détente accords with Moscow.',
    domestic: 'Gets consumed by the Watergate tapes scandal and constitutional crisis.',
  },
  Q9960: {
    economy: 'Pushes sweeping tax cuts and deregulation alongside a sharp rise in deficits.',
    foreign: 'Raises Cold War pressure before signing the INF nuclear treaty in Reykjavik and Washington.',
  },
  Q76: {
    economy: 'Enacts the post-2008 stimulus recovery and auto-industry rescue.',
    domestic: 'Passes the Affordable Care Act after a marathon congressional battle.',
    foreign: 'Seals the Paris Climate Accord and the Vienna nuclear deal.',
  },
  Q9696: {
    education: 'Launches the Apollo moonshot, galvanizing science and engineering.',
    foreign: 'Navigates the thirteen-day Cuban Missile Crisis naval quarantine.',
  },
  Q11256: {
    education: 'Mobilizes nationwide literacy brigades and universal medical schooling.',
    war: 'Repels the Bay of Pigs landing and entrenches revolutionary forces.',
  },
  Q39524: {
    foreign: 'Nationalizes the Suez Canal and emerges as the voice of pan-Arab non-alignment.',
    education: 'Expands free public schooling and university access across Cairo and the Nile.',
  },
  Q1149: {
    war: 'Wins the 1971 war decisively, redrawing the map of South Asia.',
    economy: 'Accelerates the Green Revolution to achieve national grain self-sufficiency.',
  },
  Q171730: {
    war: 'Takes total command as "Father of Victory" in 1917–1918 and sees the war through.',
    foreign: 'Dominates the Paris Peace Conference to impose the Treaty of Versailles.',
  },
  Q15981: {
    foreign: 'Presents the May 9 Declaration, laying the cornerstone of European integration.',
  },
  Q2185: {
    economy: 'Launches high-speed rail, civil nuclear power, and industrial modernization.',
  },
  Q2038: {
    domestic: 'Abolishes the death penalty, decentralizes the state, and expands cultural landmarks.',
    foreign: 'Co-architects the Maastricht Treaty and the single European currency.',
  },
  Q18434: {
    domestic: 'Passes the Popular Front accords: paid holidays and the 40-hour workweek.',
    education: 'Raises the school-leaving age and opens scientific research councils.',
  },
  Q9545: {
    education: 'Makes "Education, education, education" the centerpiece of public investment.',
    domestic: 'Seals the historic Good Friday Agreement in Northern Ireland.',
  },
  Q37610: {
    war: 'Forges the national defense forces and prevails in the 1948 war.',
    domestic: 'Builds state institutions while absorbing mass immigration.',
  },
  Q179888: {
    foreign: 'Seals the Locarno Treaties and the Kellogg-Briand peace pact.',
  },
};

const CLIMAX_FAVORITE_WON: readonly string[] = [
  'Experience and historical weight carry the portfolio.',
  'A commanding performance leaves the rival ministry no room to recover.',
  'Decisive statecraft wins the day on this front.',
  'The heavyweight agenda prevails as the dust settles.',
];

const CLIMAX_CLOSE_WON: readonly string[] = [
  'A razor-thin clash tips at the final cabinet vote!',
  'After a tense standoff, your minister edges out the rival.',
  'Neither side yields easily, but your portfolio takes the point.',
  'A narrow tactical edge decides a fierce exchange.',
];

const CLIMAX_CLOSE_LOST: readonly string[] = [
  'A tight exchange slips away in the final hours.',
  'The rival minister edges ahead after a tense back-and-forth.',
  'Close to the wire, the opposing cabinet takes this portfolio.',
  'Your minister fights hard, but the rival agenda carries the vote.',
];

const CLIMAX_UPSET_WON: readonly string[] = [
  'Major upset! Your underdog minister catches the heavyweight completely off guard!',
  'Shock result! A bold eleventh-hour gambit topples the favored rival!',
  'Against all expectations, your minister pulls off a stunning upset!',
  'Upset in the ministry! The favorite overreaches and loses the portfolio!',
];

const CLIMAX_UPSET_LOST: readonly string[] = [
  'Shock upset! The underdog rival slips past your heavyweight minister!',
  'Upset! A surprise counter-move catches your favored minister flat-footed!',
  'Against the odds, the rival outsider steals this portfolio!',
  'Stunning twist! Your favorite stumbles against an unexpected gambit!',
];

const RIVAL_TITLES: readonly string[] = [
  'The Iron Chancellery',
  'The Post-War Architects',
  'The Grand Coalition',
  'The Summit Heavyweights',
  'The Continental Pact',
  'The Non-Aligned Council',
  'The Sovereign Directorate',
  'The Wartime Cabinet',
  'The Executive Axis',
  'The Meridian Alliance',
];

function tierOf(score: number): Tier {
  if (score >= 8) return 'high';
  if (score >= 5) return 'mid';
  return 'low';
}

function pickFrom<T>(list: readonly T[], rand: () => number): T {
  return list[Math.floor(rand() * list.length)]!;
}

/** Deterministic generator for a specific duel so reloads and shared seeds show identical stories. */
function duelRng(seed: number, round: number, slot: number): () => number {
  const mixed = (seed ^ Math.imul(round + 1, 0x9e3779b1) ^ Math.imul(slot + 1, 0x85ebca6b)) >>> 0;
  return rng(mixed || 1);
}

export function rivalCoalitionName(seed: number, round: number): string {
  const r = duelRng(seed, round, 99);
  return pickFrom(RIVAL_TITLES, r);
}

export function buildDuelStory(
  seed: number,
  round: number,
  slot: number,
  mine: Leader,
  theirs: Leader,
  myScore: number,
  theirScore: number,
  won: boolean,
): DuelStory {
  const portfolio = PORTFOLIOS[slot]!;
  const rand = duelRng(seed, round, slot);

  const crisis = pickFrom(CRISES[portfolio], rand);

  const myTier = tierOf(myScore);
  const theirTier = tierOf(theirScore);

  const mySig = SIGNATURES[mine.id]?.[portfolio];
  const theirSig = SIGNATURES[theirs.id]?.[portfolio];

  const myPool = TIER_ACTIONS[portfolio][myTier];
  const theirPool = TIER_ACTIONS[portfolio][theirTier];

  const myAction = mySig ?? pickFrom(myPool, rand);
  let theirAction = theirSig ?? pickFrom(theirPool, rand);
  if (theirAction === myAction) {
    const alt = theirPool.filter((a) => a !== myAction);
    if (alt.length > 0) theirAction = pickFrom(alt, rand);
  }

  const upset = (won && myScore < theirScore) || (!won && theirScore < myScore);
  const gap = Math.abs(myScore - theirScore);

  let climax: string;
  if (upset) {
    climax = pickFrom(won ? CLIMAX_UPSET_WON : CLIMAX_UPSET_LOST, rand);
  } else if (gap >= 3) {
    climax = won
      ? pickFrom(CLIMAX_FAVORITE_WON, rand)
      : `${theirs.name} dominates the ${portfolio} brief with overwhelming historical weight.`;
  } else {
    climax = pickFrom(won ? CLIMAX_CLOSE_WON : CLIMAX_CLOSE_LOST, rand);
  }

  return {
    portfolio,
    crisis,
    myAction,
    theirAction,
    climax,
    upset,
  };
}
