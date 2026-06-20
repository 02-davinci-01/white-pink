"use client";

import { useRef, useEffect, useState, useCallback, Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

// ─── LRC lyrics data ───
type LrcLine = { time: number; text: string };

function parseLrc(raw: string): LrcLine[] {
  const lines: LrcLine[] = [];
  for (const line of raw.split("\n")) {
    const m = line.match(/^\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)$/);
    if (!m) continue;
    const text = m[4].trim();
    if (!text) continue;
    const time = parseInt(m[1]) * 60 + parseInt(m[2]) + parseInt(m[3]) / (m[3].length === 3 ? 1000 : 100);
    lines.push({ time, text });
  }
  return lines.sort((a, b) => a.time - b.time);
}

const LRC_WHITE_FERRARI = parseLrc(`[00:00.00]Bad luck to talk on these rides
[00:08.74]Mind on the road, your dilated eyes watch the clouds float
[00:16.43]White Ferrari, had a good time
[00:26.33]I let you out at Central
[00:35.16]I didn't care to state the plain
[00:40.77]Kept my mouth closed
[00:42.82]We're both so familiar
[00:51.58]White Ferrari, good times
[00:55.74]Stick by me, close by me
[00:59.33]You were fine, you were fine here
[01:02.60]That's just a slow body
[01:05.95]Left when I forgot to speak
[01:09.73]So I text the speech, lesser speeds, Texas speed, yes
[01:14.74]Basic takes its toll on me 'ventually, 'ventually, yes
[01:20.22]Ah, on me 'ventually, 'ventually, yes
[01:25.64]I care for you still and I will forever
[01:34.55]That was my part of the deal, honest
[01:40.06]We got so familiar
[01:45.39]Spending each day of the year
[01:48.88]White Ferrari, good times
[01:57.60]In this life
[02:02.16]In this life
[02:11.94]One too many years
[02:13.68]Some tattooed eyelids on a facelift
[02:20.80]Mind over matter is magic, I do magic
[02:28.52]If you think about it, it'll be over in no time
[02:32.98]And that's life
[02:33.72]Love
[02:35.75]Love
[02:37.38]Love
[02:51.07]Love
[03:07.02]I'm sure we're taller in another dimension
[03:11.45]You say we're small and not worth the mention
[03:15.79]You're tired of movin', your body's achin'
[03:20.28]We could vacay, there's places to go
[03:24.59]Clearly, this isn't all that there is
[03:28.61]Can't take what's been given
[03:31.10]But we're so okay here, we're doing fine
[03:35.78]Primal and naked
[03:37.88]You dream of walls that hold us in prison
[03:42.24]It's just a skull, least that's what they call it
[03:46.61]And we're free to roam`);

const LRC_EUGENE = parseLrc(`[00:00.62]Light struck from the lemon tree
[00:06.27]What if I'd never seen hysterical light from Eugene?
[00:14.79]Lemon yogurt
[00:17.43]Remember I pulled at your shirt
[00:20.34]I dropped the ashtray on the floor
[00:24.25]I just wanted to be near you
[00:28.95]Emerald Park, wonders never cease
[00:34.39]The man who taught me to swim
[00:37.18]He couldn't quite say my first name
[00:43.08]Like a Father, he led community water on my head
[00:48.72]And he called me "Subaru"
[00:52.51]And now, I want to be near you
[00:57.11]Since I was old enough to speak
[01:03.29]I've said it with alarm
[01:08.30]Some part of me was lost in your sleeve
[01:14.42]Where you hid your cigarettes
[01:17.94]No, I'll never forget
[01:20.72]I just want to be near you
[01:25.24]Still, I pray to what I cannot see
[01:30.97]In the sprinkler, I mark
[01:33.74]The evidence known from the start
[01:39.45]From the bed near your death
[01:42.23]And all the machines that made a mess
[01:45.17]Far away, the falcon flew
[01:49.01]Now I want to be near you
[01:53.59]What's left is only bittersweet
[01:59.16]For the rest of my life
[02:02.06]Admitting the best is behind me
[02:07.71]Now I'm drunk and afraid
[02:10.49]Wishing the world would go away
[02:13.34]What's the point of singing songs
[02:17.39]If they'll never even hear you?`);

const LRC_LINDISFARNE = parseLrc(`[00:00.34]Kestrels breed
[00:04.24]Looking further than I can see
[00:12.14]Without tact to read
[00:17.62]She'd take a shine to me
[00:26.78]Beacon don't fly too high
[00:39.26]Beacon don't fly too high
[00:50.52]For all your time
[00:53.18]Playful crime in rain
[00:56.52]Worth it being cold
[00:59.39]Roofing for the lanes
[01:02.21]A lesson lost again
[01:13.31]A lesson lost again
[01:26.04]Cute but I'll take the bus
[01:29.65]With fees and favours gone
[01:32.61]Cracks in savers pass
[01:35.50]And a white that sometimes shone
[01:39.24]Wanton borrowed gun
[01:45.38]Wanton borrowed gun
[01:52.47]Kestrels breed
[01:56.33]Looking further than I can see
[02:04.32]Without tact to read
[02:09.83]She'd take a shine to me
[02:18.94]Beacon don't fly too high
[02:31.40]Beacon don't fly too high`);

const LRC_MILK = parseLrc(`[00:00.24]Sleep on this bed
[00:09.83]Tossing and turning you'll never figure out a way
[00:19.68]Harder to be free
[00:24.35]When you look at me
[00:29.25]Hoping to find me awake on this lonely bed
[00:38.87]Hopeful
[00:58.12]Sleep on this bed
[01:07.81]Tossing and turning you'll never figure out a way
[01:17.61]Harder to be free
[01:22.44]When you look at me
[01:27.36]Hoping to find me awake in this lonely bed
[01:36.12]And it's true
[01:41.02]You will drift away
[01:46.23]And I won't mind
[01:50.51]Yes, it's true
[01:55.57]I know I, oh, na-na
[02:00.22]You will drift away
[02:05.13]Don't you drift away
[02:09.93]Don't you drift away
[02:12.88]No, I won't mind
[02:14.85]Here's to a long life
[02:19.59]You will drift away
[02:22.34]And I won't mind
[02:24.59]Here's to you, ooh
[02:48.67]And I, ah, na-na
[02:53.48]You will drift away
[02:58.68]And I won't mind
[03:03.10]Yes, it's true
[03:08.03]And I, ah, na-na-na
[03:12.87]You will drift away
[03:17.56]Don't you drift away
[03:22.36]Don't you drift away
[03:25.21]No, I won't mind
[03:27.24]Here's to a long life
[03:31.92]You will drift away
[03:34.97]And I won't mind
[03:37.41]Here's to`);

const LRC_YEBBAS = parseLrc(`[00:00.42]How much better can I show my love for you
[00:05.72]Than say, "I do, I do, I do"?
[00:16.53]I do, I do, I do
[00:24.23]You may not know right where you're going, but
[00:28.67]I do, I do, I do
[00:32.35]And all the times you wasn't chosen
[00:36.60]Well, I'll make it up to you
[00:40.33]All of the feelings you're not showing
[00:44.75]When your river's overflowing, mmm
[00:50.50]It's the truth, swear to you
[00:53.70]I do, I do, I do, I do, I do
[01:03.44]And all that you are, I do
[01:10.85]My single line of stars in noon
[01:18.35]Reflection of the very moon, I do
[01:25.65]I do, I do, I do
[01:36.03]Show my love for you
[01:42.74]Can I show my love for you?
[01:50.78]Can I show my love for you?`);

const LRC_NIKES = parseLrc(`[00:27.60]These bitches want Nikes
[00:34.54]They looking for a check
[00:37.68]Tell 'em it ain't likely
[00:41.52]Said she need a ring like Carmelo
[00:48.44]You must be on that white like Othello
[00:55.52]All you want is Nikes
[00:59.51]But the real ones, just like you
[01:06.22]Just like me
[01:10.14]I don't play, I don't make time
[01:16.59]But if you need dick I got you, and I yam from the line
[01:23.37]Pour up for A$AP
[01:26.92]R.I.P. Pimp C
[01:30.39]R.I.P. Trayvon, that nigga look just like me
[01:38.57]Woo, fuckin' buzzin', woo
[01:46.05]That my little cousin, he got a little trade
[01:51.05]His girl keep the scales, a little mermaid
[01:54.65]We out by the pool, some little mermaids
[01:58.20]Me and them gel like twigs with them bangs
[02:02.75]Now that's a real mermaid
[02:05.13]You been holding your breath
[02:08.16]Weighted down
[02:12.32]Punk madre, punk papa
[02:19.50]He don't care for me
[02:22.96]But he cares for me
[02:26.32]And that's good enough
[02:33.25]We don't talk much or nothing
[02:36.71]But when we talking about something
[02:40.17]We have good discussion
[02:47.07]I met his friends last week
[02:50.63]Feels like they're up to something
[02:54.21]That's good for us
[03:00.76]We'll let you guys prophesy
[03:07.53]We'll let you guys prophesy
[03:09.60]We gon' see the future first
[03:14.65]We'll let you guys prophesy
[03:16.43]We gon' see the future first
[03:18.19]Living so the last night feels like a past life
[03:21.56]Speaking of the don't know what got into people
[03:23.47]Devil be possessin' homies
[03:24.59]Demons try to body jump
[03:28.56]Acid on me like the rain
[03:30.27]Weed crumbles into glitter
[03:32.96]Rain, glitter
[03:35.49]We laid out on this wet floor
[03:37.26]Away turf, no astro
[03:38.97]Mesmerized how the strobes glow
[03:40.76]Look at all the people feet dance
[03:46.63]But he ain't with you
[03:58.41]I may be younger but I'll look after you
[04:05.20]We're not in love but I'll make love to you
[04:12.08]When you're not here I'll save some for you
[04:19.21]I'm not him but I'll mean something to you
[04:24.90]I'll mean something to you
[04:31.69]I'll mean something to you
[04:39.87]You got a roommate, he'll hear what we do
[04:46.87]It's only awkward if you're fucking him, too`);

// ─── track list: alternating lyrics / instrumental, Nikes first ───
const TRACKS = [
  { artist: "Frank Ocean", title: "NIKES", album: "BLOND", motif: "petal" as const, src: "/songs/nikes.mp3", lyrics: LRC_NIKES },
  { artist: "Ryuichi Sakamoto", title: "ANDATA", album: "async", motif: "wave" as const, src: "/songs/andata.mp3", lyrics: [] as LrcLine[] },
  { artist: "Frank Ocean", title: "WHITE FERRARI", album: "BLOND", motif: "car" as const, src: "/songs/white-ferrari.mp3", lyrics: LRC_WHITE_FERRARI },
  { artist: "Requiem", title: "#3", album: "—", motif: "flower" as const, src: "/songs/number-3.mp3", lyrics: [] as LrcLine[] },
  { artist: "Sufjan Stevens", title: "EUGENE", album: "Carrie & Lowell", motif: "flower" as const, src: "/songs/eugene.mp3", lyrics: LRC_EUGENE },
  { artist: "Requiem", title: "CS70 & STRINGS", album: "—", motif: "heart" as const, src: "/songs/requiem.mp3", lyrics: [] as LrcLine[] },
  { artist: "James Blake", title: "LINDISFARNE I", album: "James Blake", motif: "wave" as const, src: "/songs/lindisfarne-i.mp3", lyrics: LRC_LINDISFARNE },
  { artist: "Sweet Trip", title: "MILK", album: "You Will Never Know Why", motif: "petal" as const, src: "/songs/milk.mp3", lyrics: LRC_MILK },
  { artist: "Drake & Yebba", title: "YEBBA'S HEARTBREAK", album: "CLB", motif: "heart" as const, src: "/songs/yebbas-heartbreak.mp3", lyrics: LRC_YEBBAS },
];

type Motif = (typeof TRACKS)[number]["motif"];

// ─── pixel art ───
const MOTIFS: Record<Motif, string[]> = {
  heart: ["............","..pp..pp....","pppppppp...",".pppppppp...",".pppppppp...","..pppppp....","...pppp.....","....pp......","............","...ww..ww...","............","............"],
  wave: ["............","............",".w........w.",".ww......ww.","..ww....ww..","...wwppww...","....wppw....","...wwppww...","..ww....ww..",".ww......ww.",".w........w.","............"],
  car: ["............","............","....wwww....","...wwwwwww..",".wwwwwwwwww.","wwwwwwwwwwww","wwwwwwwwwwww",".pp......pp.",".pp......pp.","............","............","............"],
  flower: ["............","....pp......","..p.pp.p....","..ppwwpp....",".pppwwppp...","..ppwwpp....","..p.pp.p....","....pp......","....ww......","....ww......","...w..w.....","............"],
  petal: ["............",".......pp...","......pppp..",".....pppp...","....pppp....","...pppp.....","..wppp......","..wpp.......","..pp........",".pp.........","............","............"],
};

function buildPixelShadows(rows: string[], px: number, cmap: Record<string, string>) {
  const shadows: string[] = [];
  for (let y = 0; y < rows.length; y++)
    for (let x = 0; x < rows[y].length; x++) {
      const ch = rows[y][x];
      if (ch === "." || ch === " ") continue;
      const col = cmap[ch];
      if (col) shadows.push(`${x * px}px ${y * px}px 0 0 ${col}`);
    }
  return shadows.join(", ");
}

function PixelArt({ motif, px, color }: { motif: Motif; px: number; color?: string }) {
  const rows = MOTIFS[motif] || MOTIFS.flower;
  let maxLen = 0;
  for (const r of rows) maxLen = Math.max(maxLen, r.length);
  return (
    <div
      style={{
        width: px, height: px,
        marginRight: maxLen * px - px,
        marginBottom: rows.length * px - px,
        boxShadow: buildPixelShadows(rows, px, { p: color || "#f0567f", w: "#d8b6c0" }),
      }}
    />
  );
}

function EqBars({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2.5, height: 15 }}>
      {[0, 0.3, 0.15, 0.45, 0.2].map((d, i) => (
        <div key={i} style={{
          width: 2.5, height: "100%", background: color, borderRadius: 1,
          transformOrigin: "bottom",
          animation: `wwEq ${0.8 + (i % 3) * 0.25}s ease-in-out infinite`,
          animationDelay: `${d}s`,
        }} />
      ))}
    </div>
  );
}

function fmt(s: number) {
  const m = (s / 60) | 0;
  const sec = Math.floor(s % 60);
  return m + ":" + String(sec).padStart(2, "0");
}

const MOTIF_KEYS: Motif[] = ["heart", "wave", "car", "flower", "petal"];

// ─── synced lyrics / instrumental art component ───
function SyncedLyrics({ lyrics, currentTime, playing }: { lyrics: LrcLine[]; currentTime: number; playing: boolean }) {
  const [collapsed, setCollapsed] = useState(true);
  const hasAutoOpened = useRef(false);
  const [instrumentalMotif, setInstrumentalMotif] = useState(0);

  useEffect(() => {
    if (lyrics.length) return;
    const id = setInterval(() => setInstrumentalMotif((i) => (i + 1) % MOTIF_KEYS.length), 5000);
    return () => clearInterval(id);
  }, [lyrics.length]);

  useEffect(() => {
    if (playing && !hasAutoOpened.current) {
      setCollapsed(false);
      hasAutoOpened.current = true;
    }
  }, [playing]);

  const hasLyrics = lyrics.length > 0;

  let activeIdx = -1;
  if (hasLyrics) {
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time) { activeIdx = i; break; }
    }
  }

  const windowSize = 4;
  const start = Math.max(0, activeIdx - 1);
  const end = Math.min(lyrics.length, activeIdx + windowSize);
  const visibleLines = hasLyrics ? (activeIdx >= 0 ? lyrics.slice(start, end) : lyrics.slice(0, windowSize)) : [];

  return (
    <div style={{
      position: "absolute",
      left: "var(--pad-x)",
      top: "50%",
      transform: "translateY(-50%)",
      zIndex: 12,
      pointerEvents: "auto",
    }} className="lyrics-area">
      {/* collapsed: grid-sized square button */}
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 10,
        background: "linear-gradient(155deg, rgba(255,255,255,0.6), rgba(255,248,251,0.4))",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        border: "1px solid rgba(255,255,255,0.75)",
        boxShadow: "0 8px 20px -10px rgba(150,110,135,0.25), inset 0 1px 0 rgba(255,255,255,0.9)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        top: "50%",
        left: 0,
        transform: "translateY(-50%)",
        opacity: collapsed ? 1 : 0,
        scale: collapsed ? "1" : "0.8",
        transition: "opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), scale 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        pointerEvents: collapsed ? "auto" : "none",
      }}
        onClick={() => setCollapsed(false)}
      >
        <PixelArt motif="flower" px={3} color="#f0567f" />
      </div>

      {/* expanded panel */}
      <div style={{
        maxWidth: "var(--lyrics-panel-maxw)",
        opacity: collapsed ? 0 : 1,
        scale: collapsed ? "0.9" : "1",
        transform: collapsed ? "translateX(-20px)" : "translateX(0)",
        transition: "opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), scale 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
        pointerEvents: collapsed ? "none" : "auto",
      }}>
        <div style={{
          position: "relative",
          background: "linear-gradient(155deg, rgba(255,255,255,0.55), rgba(255,248,251,0.35))",
          backdropFilter: "blur(30px) saturate(170%)",
          WebkitBackdropFilter: "blur(30px) saturate(170%)",
          border: "1px solid rgba(255,255,255,0.75)",
          boxShadow: "0 16px 40px -20px rgba(150,110,135,0.28), inset 0 1px 0 rgba(255,255,255,0.9)",
          borderRadius: 20,
          padding: "20px 24px",
        }}>
          {/* pink collapse circle at top-right corner */}
          <div
            onClick={() => setCollapsed(true)}
            style={{
              position: "absolute",
              top: -8,
              right: -8,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "#f0567f",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px -4px rgba(240,86,127,0.5)",
              transition: "transform 0.2s ease",
              zIndex: 2,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <div style={{ width: 8, height: 1.5, background: "#fff", borderRadius: 1 }} />
          </div>

          {hasLyrics ? (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 100 }}>
                {visibleLines.map((line) => {
                  const lineIdx = lyrics.indexOf(line);
                  const isActive = lineIdx === activeIdx;
                  const isPast = lineIdx < activeIdx;
                  return (
                    <div
                      key={line.time}
                      style={{
                        fontFamily: "var(--font-space-grotesk), sans-serif",
                        fontSize: isActive ? 15 : 13,
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? "#2a2226" : isPast ? "#cbb2bb" : "#a8929c",
                        opacity: isActive ? 1 : isPast ? 0.4 : 0.6,
                        transform: isActive ? "translateY(0)" : isPast ? "translateY(-2px)" : "translateY(2px)",
                        transition: "all 0.7s cubic-bezier(0.25, 1, 0.5, 1)",
                        lineHeight: 1.55,
                        letterSpacing: "0.01em",
                      }}
                    >
                      {line.text}
                    </div>
                  );
                })}
              </div>
              {playing && (
                <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
                  <EqBars color="#ee5c84" />
                  <span style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 7, letterSpacing: "0.2em", color: "#cbb2bb" }}>SYNCED</span>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "8px 0" }}>
              <div style={{ position: "relative", width: 60, height: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {MOTIF_KEYS.map((m, i) => (
                  <div key={m} style={{
                    position: "absolute",
                    opacity: instrumentalMotif === i ? 1 : 0,
                    transform: instrumentalMotif === i ? "scale(1) rotate(0deg)" : "scale(0.7) rotate(10deg)",
                    transition: "opacity 1s ease, transform 1s ease",
                  }}>
                    <PixelArt motif={m} px={4} color="#ee5c84" />
                  </div>
                ))}
              </div>
              <span style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 8, letterSpacing: "0.2em", color: "#cbb2bb" }}>
                INSTRUMENTAL
              </span>
              {playing && <EqBars color="#ee5c84" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── right-side glass panel with project origin story ───
function RightPanel() {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div style={{
      position: "absolute",
      right: "var(--pad-x)",
      top: "50%",
      transform: "translateY(-50%)",
      zIndex: 12,
      pointerEvents: "auto",
    }} className="right-panel-area">
      {/* collapsed: grid-sized square button */}
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 10,
        background: "linear-gradient(155deg, rgba(255,255,255,0.65), rgba(255,248,251,0.42))",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.8)",
        boxShadow: "0 8px 22px -10px rgba(150,110,135,0.28), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(200,170,185,0.15)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "absolute",
        top: "50%",
        right: 0,
        transform: "translateY(-50%)",
        opacity: collapsed ? 1 : 0,
        scale: collapsed ? "1" : "0.8",
        transition: "opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), scale 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        pointerEvents: collapsed ? "auto" : "none",
      }}
        onClick={() => setCollapsed(false)}
      >
        <PixelArt motif="heart" px={3} color="#f0567f" />
      </div>

      {/* expanded panel */}
      <div style={{
        maxWidth: "var(--right-panel-maxw)",
        opacity: collapsed ? 0 : 1,
        scale: collapsed ? "0.9" : "1",
        transform: collapsed ? "translateX(20px)" : "translateX(0)",
        transition: "opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), scale 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
        pointerEvents: collapsed ? "none" : "auto",
      }}>
        <div style={{
          position: "relative",
          background: "linear-gradient(155deg, rgba(255,255,255,0.55), rgba(255,248,251,0.32))",
          backdropFilter: "blur(32px) saturate(180%)",
          WebkitBackdropFilter: "blur(32px) saturate(180%)",
          border: "1px solid rgba(255,255,255,0.78)",
          boxShadow: "0 18px 44px -22px rgba(150,110,135,0.3), inset 0 1px 0 rgba(255,255,255,0.92), inset 0 -1px 0 rgba(200,170,185,0.12)",
          borderRadius: 20,
          padding: "20px 24px",
        }}>
          {/* pink collapse circle at top-left corner */}
          <div
            onClick={() => setCollapsed(true)}
            style={{
              position: "absolute",
              top: -8,
              left: -8,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "#f0567f",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px -4px rgba(240,86,127,0.5)",
              transition: "transform 0.2s ease",
              zIndex: 2,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <div style={{ width: 8, height: 1.5, background: "#fff", borderRadius: 1 }} />
          </div>

          <p style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: 13,
            fontWeight: 400,
            color: "#5a4a52",
            lineHeight: 1.7,
            letterSpacing: "0.02em",
            margin: 0,
          }}>
            the idea entered my head, when i saw a woman with a white iPhone and a pink suction cover. very pretty colors init? :p
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── glass iPod player with smooth animation ───
function Player({
  track, elapsed, duration, playing, open,
  onToggleOpen, onTogglePlay, onPrev, onNext, onCenterClick,
}: {
  track: (typeof TRACKS)[number]; elapsed: number; duration: number; playing: boolean; open: boolean;
  onToggleOpen: () => void; onTogglePlay: () => void; onPrev: () => void; onNext: () => void; onCenterClick: () => void;
}) {
  const prog = duration > 0 ? Math.min(1, elapsed / duration) : 0;
  const glass: React.CSSProperties = {
    background: "linear-gradient(155deg, rgba(255,255,255,0.72), rgba(255,248,251,0.5))",
    backdropFilter: "blur(30px) saturate(170%)",
    WebkitBackdropFilter: "blur(30px) saturate(170%)",
    border: "1px solid rgba(255,255,255,0.9)",
    boxShadow: "0 22px 50px -26px rgba(150,110,135,0.32), inset 0 1px 0 rgba(255,255,255,0.95)",
  };

  return (
    <div style={{ position: "relative" }}>
      {/* collapsed pill */}
      <div
        onClick={onToggleOpen}
        style={{
          ...glass,
          display: "flex", alignItems: "center", gap: 13,
          padding: "10px 16px 10px 12px", borderRadius: 100,
          cursor: "pointer", width: 248,
          opacity: open ? 0 : 1,
          transform: open ? "scale(0.95) translateY(8px)" : "scale(1) translateY(0)",
          transition: "opacity 0.35s ease, transform 0.35s ease",
          pointerEvents: open ? "none" : "auto",
        }}
      >
        <div style={{
          flex: "none", width: 30, height: 30, borderRadius: 9,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.8)",
        }}>
          <PixelArt motif={track.motif} px={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontWeight: 600, fontSize: 12, color: "#392d33", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "0.01em" }}>
            {track.title}
          </div>
          <div style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 9, color: "#ab8a94", marginTop: 2 }}>
            {track.artist}
          </div>
        </div>
        {playing && <EqBars color="#f0567f" />}
      </div>

      {/* expanded iPod */}
      <div style={{
        ...glass,
        position: "absolute", top: 0, right: 0,
        width: 232, borderRadius: 30, padding: "16px 16px 20px",
        overflow: "hidden",
        opacity: open ? 1 : 0,
        transform: open ? "scale(1) translateY(0)" : "scale(0.92) translateY(-12px)",
        transition: "opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        pointerEvents: open ? "auto" : "none",
      }}>
        <div style={{ position: "absolute", top: "-30%", left: "-15%", width: "60%", height: "55%", background: "radial-gradient(circle, rgba(255,255,255,0.55), transparent 70%)", pointerEvents: "none" }} />
        {/* header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, position: "relative" }}>
          <span style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 8, letterSpacing: "0.32em", color: "#b29aa3" }}>wW · RADIO</span>
          <div onClick={onToggleOpen} style={{ cursor: "pointer", fontSize: 13, color: "#c1aab3", lineHeight: 1 }}>⌃</div>
        </div>
        {/* LCD */}
        <div style={{
          position: "relative", borderRadius: 14, padding: "13px 14px",
          background: "linear-gradient(165deg,#fbf5f7,#f2e9ed)",
          boxShadow: "inset 0 2px 6px rgba(150,120,135,0.18), inset 0 0 0 1px rgba(255,255,255,0.7)",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(120,90,105,0.04) 0, rgba(120,90,105,0.04) 1px, transparent 1px, transparent 3px)", pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, position: "relative" }}>
            <span style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 8, letterSpacing: "0.16em", color: "#c97d99" }}>{track.album}</span>
            {playing && <EqBars color="#ef9bb6" />}
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", position: "relative" }}>
            <div style={{ flex: "none", width: 52, height: 52, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", boxShadow: "inset 0 0 0 1px rgba(180,150,165,0.2)" }}>
              <PixelArt motif={track.motif} px={4} color="#ee5c84" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 7, letterSpacing: "0.2em", color: "#b29aa3", marginBottom: 5 }}>NOW PLAYING</div>
              <div style={{ fontFamily: "var(--font-space-grotesk), sans-serif", fontWeight: 600, fontSize: 14, color: "#3a2d33", lineHeight: 1.05 }}>{track.title}</div>
              <div style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 9, color: "#e0698f", marginTop: 4 }}>{track.artist}</div>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ height: 3, borderRadius: 3, background: "rgba(180,140,158,0.22)", position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${prog * 100}%`, borderRadius: 3, background: "linear-gradient(90deg,#f7a9c1,#ee5c84)", transition: "width 0.3s linear" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontFamily: "var(--font-space-mono), monospace", fontSize: 8, color: "#b29aa3", fontVariantNumeric: "tabular-nums" }}>
              <span>{fmt(elapsed)}</span><span>{fmt(duration)}</span>
            </div>
          </div>
        </div>
        {/* click wheel */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
          <div style={{ position: "relative", width: 132, height: 132, borderRadius: "50%", background: "radial-gradient(circle at 50% 38%, #ffffff, #f4edf0 72%, #ece2e7 100%)", boxShadow: "0 8px 18px -8px rgba(160,125,140,0.5), inset 0 1px 2px rgba(255,255,255,0.95), inset 0 -3px 8px rgba(175,145,160,0.2)" }}>
            <WheelBtn label="REQUIEM" onClick={onToggleOpen} style={{ top: 9, left: 0, right: 0, height: 26, fontSize: 7, letterSpacing: "0.18em" }} />
            <WheelBtn label="◄◄" onClick={onPrev} style={{ left: 6, top: 0, bottom: 0, width: 34 }} />
            <WheelBtn label="►►" onClick={onNext} style={{ right: 6, top: 0, bottom: 0, width: 34 }} />
            <WheelBtn label={playing ? "❚❚" : "►"} onClick={onTogglePlay} style={{ bottom: 10, left: 0, right: 0, height: 24 }} />
            {/* solid pink center square */}
            <CenterButton onClick={onCenterClick} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CenterButton({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%,-50%)",
        width: 50,
        height: 50,
        borderRadius: "50%",
        background: "radial-gradient(circle at 50% 40%, #fff, #f3ebee 82%)",
        boxShadow: "0 2px 8px -2px rgba(160,125,140,0.5), inset 0 1px 1px rgba(255,255,255,0.9)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{
        width: 14,
        height: 14,
        borderRadius: 2,
        background: "#f0567f",
      }} />
    </div>
  );
}

function WheelBtn({ label, onClick, style }: { label: string; onClick: () => void; style: React.CSSProperties }) {
  return (
    <div onClick={onClick} style={{ position: "absolute", ...style, cursor: "pointer", fontFamily: "var(--font-space-mono), monospace", fontSize: 11, color: "#b29aa3", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {label}
    </div>
  );
}

// ─── 3D: cherry blossom petal particles ───
function BlossomPetals({ treePosition }: { treePosition: [number, number, number] }) {
  const count = 60;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const petalData = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        position: new THREE.Vector3(
          treePosition[0] + (Math.random() - 0.5) * 6,
          treePosition[1] + Math.random() * 5 + 1,
          treePosition[2] + (Math.random() - 0.5) * 6,
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          -(0.2 + Math.random() * 0.4),
          (Math.random() - 0.5) * 0.3,
        ),
        rotation: new THREE.Euler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
        ),
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 1,
        ),
        phase: Math.random() * Math.PI * 2,
        scale: 0.04 + Math.random() * 0.06,
      });
    }
    return data;
  }, [treePosition]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const dt = Math.min(delta, 0.05);
    for (let i = 0; i < count; i++) {
      const p = petalData[i];
      p.position.x += (p.velocity.x + Math.sin(p.position.y * 0.5 + p.phase) * 0.15) * dt;
      p.position.y += p.velocity.y * dt;
      p.position.z += (p.velocity.z + Math.cos(p.position.y * 0.3 + p.phase) * 0.1) * dt;
      p.rotation.x += p.rotSpeed.x * dt;
      p.rotation.y += p.rotSpeed.y * dt;
      p.rotation.z += p.rotSpeed.z * dt;

      if (p.position.y < -1) {
        p.position.set(
          treePosition[0] + (Math.random() - 0.5) * 5,
          treePosition[1] + 3 + Math.random() * 3,
          treePosition[2] + (Math.random() - 0.5) * 5,
        );
      }

      dummy.position.copy(p.position);
      dummy.rotation.set(p.rotation.x, p.rotation.y, p.rotation.z);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[1, 0.6]} />
      <meshBasicMaterial
        color="#f4a8c0"
        side={THREE.DoubleSide}
        transparent
        opacity={0.65}
      />
    </instancedMesh>
  );
}

// ─── model transform state ───
type ModelTransform = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
};

const DEFAULT_CAR: ModelTransform = { position: [-5.60, -3.90, -1.60], rotation: [0, 0.55, 0], scale: 2.10 };
const DEFAULT_TREE: ModelTransform = { position: [1.30, -4.40, -6.80], rotation: [0, 0.55, 0], scale: 7.6 };
const SYNC_ROTATION_SPEED = 0.08;

type CameraState = {
  position: [number, number, number];
  lookAt: [number, number, number];
};
const DEFAULT_CAMERA: CameraState = { position: [10, 0, 14], lookAt: [-5, -2, -4.5] };

// ─── 3D: pulsing glow sprite behind tree ───
function TreeGlow({ position }: { position: [number, number, number] }) {
  const matRef = useRef<THREE.SpriteMaterial>(null);
  const spriteRef = useRef<THREE.Sprite>(null);

  const glowTexture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(244, 168, 192, 0.6)");
    gradient.addColorStop(0.3, "rgba(240, 130, 170, 0.25)");
    gradient.addColorStop(0.6, "rgba(253, 200, 220, 0.1)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  useFrame((state) => {
    if (!matRef.current || !spriteRef.current) return;
    const t = state.clock.elapsedTime;
    const pulse = 0.5 + Math.sin(t * 1.2) * 0.15 + Math.sin(t * 0.7) * 0.1;
    matRef.current.opacity = pulse;
    const s = 12 + Math.sin(t * 0.9) * 1.5;
    spriteRef.current.scale.set(s, s, 1);
  });

  return (
    <sprite ref={spriteRef} position={[position[0], position[1] + 2.5, position[2] - 1.5]}>
      <spriteMaterial ref={matRef} map={glowTexture} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  );
}

// ─── 3D: pulsing glow behind car ───
function CarGlow({ position }: { position: [number, number, number] }) {
  const matRef = useRef<THREE.SpriteMaterial>(null);
  const spriteRef = useRef<THREE.Sprite>(null);

  const glowTexture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(240, 86, 127, 0.45)");
    gradient.addColorStop(0.25, "rgba(244, 168, 192, 0.25)");
    gradient.addColorStop(0.5, "rgba(253, 200, 220, 0.1)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((state) => {
    if (!matRef.current || !spriteRef.current) return;
    const t = state.clock.elapsedTime;
    const pulse = 0.45 + Math.sin(t * 1.4) * 0.15 + Math.sin(t * 0.9) * 0.1;
    matRef.current.opacity = pulse;
    const s = 10 + Math.sin(t * 1.1) * 1.5;
    spriteRef.current.scale.set(s, s, 1);
  });

  return (
    <sprite ref={spriteRef} position={[position[0], position[1] + 1.5, position[2] - 1]}>
      <spriteMaterial ref={matRef} map={glowTexture} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  );
}

// ─── 3D: Tree model (GLB) with subtle bob ───
function TreeModel({ transform }: { transform: ModelTransform }) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/sakura-voxel-opt-v2.glb", true);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.position.y = transform.position[1] + Math.sin(t * 0.6) * 0.35;
  });

  return (
    <group ref={groupRef} position={transform.position} rotation={transform.rotation} scale={transform.scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

// ─── 3D: Car model (GLB) with driver ───
function CarModel({ transform, screenPosRef }: {
  transform: ModelTransform;
  screenPosRef?: { current: { x: number; y: number } | null };
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/testarossa-with-driver-opt.glb", true);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);
  const projVec = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.rotation.x = transform.rotation[0];
    groupRef.current.rotation.y = transform.rotation[1] + t * SYNC_ROTATION_SPEED;
    groupRef.current.rotation.z = transform.rotation[2];

    if (screenPosRef) {
      projVec.set(...transform.position);
      projVec.project(state.camera);
      screenPosRef.current = {
        x: (projVec.x * 0.5 + 0.5) * state.size.width,
        y: (-projVec.y * 0.5 + 0.5) * state.size.height,
      };
    }
  });

  return (
    <group ref={groupRef} position={transform.position} rotation={transform.rotation} scale={transform.scale}>
      <primitive object={clonedScene} />
    </group>
  );
}

// ─── 3D: scene with camera ───
function SceneContent({ carTransform = DEFAULT_CAR, treeTransform = DEFAULT_TREE, cameraState = DEFAULT_CAMERA, carScreenPosRef }: {
  carTransform?: ModelTransform; treeTransform?: ModelTransform; cameraState?: CameraState;
  carScreenPosRef?: { current: { x: number; y: number } | null };
}) {
  const { camera } = useThree();
  const car = carTransform ?? DEFAULT_CAR;
  const tree = treeTransform ?? DEFAULT_TREE;
  const cam = cameraState ?? DEFAULT_CAMERA;

  useEffect(() => {
    camera.position.set(...cam.position);
    camera.lookAt(...cam.lookAt);
  }, [camera, cam.position, cam.lookAt]);

  return (
    <>
      <ambientLight intensity={1.2} color="#fff5f8" />
      <directionalLight position={[5, 10, 7]} intensity={1.4} color="#ffffff" />
      <directionalLight position={[-3, 8, 5]} intensity={0.8} color="#ffe0ec" />
      <directionalLight position={[0, 4, 8]} intensity={0.5} color="#ffffff" />
      <hemisphereLight args={["#ffffff", "#f5d0dd", 0.6]} />
      <OrbitControls enablePan enableZoom enableRotate />
      <ContactShadows position={[0, -4.5, 0]} opacity={0.35} scale={20} blur={2.5} far={8} color="#d4a0b8" />
      <Suspense fallback={null}>
        <TreeGlow position={tree.position} />
        <CarGlow position={car.position} />
        <CarModel transform={car} screenPosRef={carScreenPosRef} />
        <TreeModel transform={tree} />
        <BlossomPetals treePosition={tree.position} />
      </Suspense>
    </>
  );
}

// ─── 2D: flipping grid + petal canvas overlays ───
type Petal2D = {
  x: number; y: number; vy: number; vx: number;
  rot: number; vr: number; ph: number;
  cube: boolean; s: number; a: number; c: string;
};

function mkPetal(W: number, H: number, seed: boolean): Petal2D {
  const colors = ["#ffd9e4", "#fbc7d6", "#f4afc4", "#fde9f0"];
  return {
    x: Math.random() * W, y: seed ? Math.random() * H : -20,
    vy: 0.32 + Math.random() * 0.6, vx: -0.35 + Math.random() * 0.45,
    rot: Math.random() * 6.28, vr: -0.03 + Math.random() * 0.06, ph: Math.random() * 6,
    cube: Math.random() < 0.5, s: 4 + Math.random() * 5,
    a: 0.4 + Math.random() * 0.35, c: colors[(Math.random() * 4) | 0],
  };
}

function useCanvasOverlays(carScreenPosRef?: { current: { x: number; y: number } | null }, burstRef?: { current: boolean }) {
  const bgRef = useRef<HTMLCanvasElement>(null);
  const petalRef = useRef<HTMLCanvasElement>(null);
  const petalsRef = useRef<Petal2D[]>([]);
  const flipsRef = useRef<{ gx: number; gy: number; life: number; max: number; pink: boolean }[]>([]);
  const mouseRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMouseMove);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    petalsRef.current = Array.from({ length: 18 }, () => mkPetal(W(), H(), true));

    const sizeCanvases = () => {
      [bgRef, petalRef].forEach((r) => {
        const c = r.current;
        if (!c) return;
        c.width = W() * dpr;
        c.height = H() * dpr;
        c.getContext("2d")!.setTransform(dpr, 0, 0, dpr, 0, 0);
      });
    };
    sizeCanvases();

    const cell = 48;
    let last = performance.now();
    let raf: number;

    const loop = (t: number) => {
      const dt = Math.min(50, t - last);
      last = t;

      const bg = bgRef.current;
      if (bg) {
        const ctx = bg.getContext("2d")!;
        ctx.clearRect(0, 0, W(), H());
        ctx.strokeStyle = "rgba(60,40,52,0.03)";
        ctx.lineWidth = 1;
        for (let x = cell; x < W(); x += cell) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H()); ctx.stroke(); }
        for (let y = cell; y < H(); y += cell) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W(), y); ctx.stroke(); }

        let flips = flipsRef.current;
        if (Math.random() < 0.4 && flips.length < 40) {
          flips.push({ gx: (Math.random() * (W() / cell)) | 0, gy: (Math.random() * (H() / cell)) | 0, life: 0, max: 50 + Math.random() * 70, pink: Math.random() < 0.32 });
        }
        const mouse = mouseRef.current;
        if (mouse && flips.length < 80) {
          const mGx = Math.floor(mouse.x / cell);
          const mGy = Math.floor(mouse.y / cell);
          if (Math.random() < 0.45) {
            flips.push({ gx: mGx + Math.floor((Math.random() - 0.5) * 4), gy: mGy + Math.floor((Math.random() - 0.5) * 4), life: 0, max: 30 + Math.random() * 40, pink: Math.random() < 0.5 });
          }
        }
        const carScreen = carScreenPosRef?.current;
        if (carScreen && flips.length < 90) {
          const carGx = Math.floor(carScreen.x / cell);
          const carGy = Math.floor(carScreen.y / cell);
          for (let ci = 0; ci < 3; ci++) {
            if (Math.random() < 0.55) {
              flips.push({ gx: carGx + Math.floor((Math.random() - 0.5) * 10), gy: carGy + Math.floor((Math.random() - 0.5) * 8), life: 0, max: 35 + Math.random() * 55, pink: Math.random() < 0.7 });
            }
          }
        }
        if (burstRef?.current) {
          burstRef.current = false;
          const cols = Math.ceil(W() / cell);
          const rows = Math.ceil(H() / cell);
          for (let i = 0; i < 120; i++) {
            flips.push({
              gx: (Math.random() * cols) | 0,
              gy: (Math.random() * rows) | 0,
              life: 0,
              max: 40 + Math.random() * 80,
              pink: Math.random() < 0.65,
            });
          }
        }
        flips.forEach((f) => (f.life += dt / 16));
        flipsRef.current = flips = flips.filter((f) => f.life < f.max);
        for (const f of flips) {
          const p = f.life / f.max;
          const sx = Math.abs(Math.cos(p * Math.PI));
          const a = Math.sin(p * Math.PI);
          ctx.save();
          ctx.translate(f.gx * cell + cell / 2, f.gy * cell + cell / 2);
          ctx.scale(Math.max(0.04, sx), 1);
          ctx.globalAlpha = a * (f.pink ? 0.35 : 0.4);
          ctx.fillStyle = f.pink ? "#f6b9cd" : "#ece6ea";
          ctx.fillRect(-cell / 2 + 3, -cell / 2 + 3, cell - 6, cell - 6);
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      }

      const pc = petalRef.current;
      if (pc) {
        const ctx = pc.getContext("2d")!;
        ctx.clearRect(0, 0, W(), H());
        for (const p of petalsRef.current) {
          p.x += (p.vx + Math.sin(p.y * 0.012 + p.ph) * 0.4) * (dt / 16);
          p.y += p.vy * (dt / 16);
          p.rot += p.vr * (dt / 16);
          if (p.y > H() + 20) Object.assign(p, mkPetal(W(), H(), false));
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = p.a;
          if (p.cube) {
            ctx.fillStyle = p.c;
            ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s);
            ctx.fillStyle = "rgba(255,255,255,0.5)";
            ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.32);
          } else {
            ctx.fillStyle = p.c;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.s * 0.6, p.s * 0.38, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    window.addEventListener("resize", sizeCanvases);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", sizeCanvases); window.removeEventListener("mousemove", onMouseMove); };
  }, []);

  return { bgRef, petalRef };
}

// ─── main scene ───
export default function Scene() {
  const carScreenPosRef = useRef<{ x: number; y: number } | null>(null);
  const burstRef = useRef(false);
  const { bgRef, petalRef } = useCanvasOverlays(carScreenPosRef, burstRef);
  const [playerOpen, setPlayerOpen] = useState(false);
  const [trackIdx, setTrackIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [typingDone, setTypingDone] = useState(false);
  const [quotePulseKey, setQuotePulseKey] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const track = TRACKS[trackIdx];

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    audio.addEventListener("timeupdate", () => setCurrentTime(audio.currentTime));
    audio.addEventListener("durationchange", () => setDuration(audio.duration || 0));
    audio.addEventListener("ended", () => {
      setTrackIdx((i) => (i + 1) % TRACKS.length);
    });

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = track.src;
    audio.load();
    setCurrentTime(0);
    if (playing) {
      audio.play().catch(() => {});
    }
  }, [trackIdx]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [playing]);

  useEffect(() => {
    const timer = setTimeout(() => setTypingDone(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  const handlePrev = useCallback(() => {
    setTrackIdx((i) => (i - 1 + TRACKS.length) % TRACKS.length);
    setPlaying(true);
  }, []);

  const handleNext = useCallback(() => {
    setTrackIdx((i) => (i + 1) % TRACKS.length);
    setPlaying(true);
  }, []);

  const handleTogglePlay = useCallback(() => {
    setPlaying((p) => !p);
  }, []);

  const handleCenterClick = useCallback(() => {
    burstRef.current = true;
    setQuotePulseKey(k => k + 1);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "radial-gradient(130% 120% at 54% 30%, #ffffff 0%, #fffafc 52%, #fdf2f6 82%, #fbeef3 100%)",
      overflow: "hidden", fontFamily: "var(--font-space-mono), monospace", color: "#2a2226",
    }}>
      {/* bg grid canvas */}
      <canvas ref={bgRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 1, pointerEvents: "none" }} />

      {/* 3D scene */}
      <div style={{ position: "absolute", inset: 0, zIndex: 3 }}>
        <Canvas
          gl={{ antialias: true, alpha: true, toneMapping: THREE.NoToneMapping }}
          dpr={[1, 1.5]}
          style={{ background: "transparent" }}
          onCreated={() => setLoaded(true)}
        >
          <SceneContent
            carTransform={DEFAULT_CAR}
            treeTransform={DEFAULT_TREE}
            cameraState={DEFAULT_CAMERA}
            carScreenPosRef={carScreenPosRef}
          />
        </Canvas>
      </div>

      {/* petal canvas overlay */}
      <canvas ref={petalRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 5, pointerEvents: "none" }} />

      {/* ── loading state ── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 20,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 28,
        background: "#ffffff",
        opacity: (loaded && typingDone) ? 0 : 1,
        pointerEvents: (loaded && typingDone) ? "none" : "auto",
        transition: "opacity 2.2s cubic-bezier(0.4, 0, 0, 1)",
      }}>
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <div style={{
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: "clamp(11px, 1.2vw, 15px)",
            color: "#f0567f",
            overflow: "hidden",
            whiteSpace: "nowrap",
            animation: "wwTypewriter 3.2s steps(21, end) forwards",
            width: 0,
            letterSpacing: "0.18em",
          }}>
            requiem is for memory
          </div>
          <span style={{
            fontFamily: "var(--font-space-mono), monospace",
            fontSize: "clamp(11px, 1.2vw, 15px)",
            color: "#f0567f",
            animation: typingDone ? "none" : "wwBlinkUnderscore 0.7s step-end infinite",
            opacity: typingDone ? 0 : 1,
            transition: "opacity 0.5s ease",
          }}>_</span>
        </div>
        <span style={{ width: 13, height: 13, background: "#f0567f", display: "block", animation: "pinkPulse 2s ease-in-out infinite" }} />
      </div>

      {/* ── UI overlay ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none" }}>

        {/* TOP LEFT: pink square + title */}
        <div className="title-block" style={{ position: "absolute", top: "var(--pad-top)", left: "var(--pad-x)" }}>
          <span style={{ width: "var(--pink-square-size)", height: "var(--pink-square-size)", background: "#f0567f", display: "block", marginBottom: 14 }} />
          <h1 style={{
            fontFamily: "var(--font-space-grotesk), sans-serif",
            fontSize: "var(--title-size)", fontWeight: 600,
            lineHeight: 1, color: "#2a2226", margin: 0, letterSpacing: "-0.02em",
          }}>
            wWHIT<span style={{ display: "inline-block", transform: "scaleX(-1)" }}>e</span>{" "}
            <span style={{ color: "#f0567f" }}>+</span> PINk
          </h1>
          {/* vertical kanji */}
          <div className="kanji-text" style={{
            writingMode: "vertical-rl",
            fontFamily: "var(--font-shippori), serif",
            fontSize: "var(--kanji-size)", letterSpacing: "0.42em",
            color: "#d4c0c8", marginTop: "var(--kanji-mt)", userSelect: "none",
          }}>
            空のフレーム
          </div>
        </div>

        {/* TOP CENTER: nav glyphs */}
        <div className="nav-glyphs" style={{
          position: "absolute", top: "var(--pad-top)", left: "50%", transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: "var(--glyph-gap)", color: "#d6c5cc",
        }}>
          <span style={{ width: "var(--pink-square-size)", height: "var(--pink-square-size)", background: "#f7b9cb", display: "inline-block" }} />
          <span style={{ fontSize: "var(--glyph-size)" }}>▦</span>
          <span style={{ fontSize: "var(--glyph-size)" }}>◯</span>
          <span style={{ fontSize: "var(--glyph-size)" }}>✕</span>
        </div>

        {/* TOP RIGHT: iPod player */}
        <div className="player-area" style={{
          position: "absolute", top: "var(--pad-top)", right: "var(--pad-x)",
          display: "flex", flexDirection: "column", alignItems: "flex-end",
          pointerEvents: "auto",
        }}>
          <Player
            track={track} elapsed={currentTime} duration={duration} playing={playing} open={playerOpen}
            onToggleOpen={() => setPlayerOpen((o) => !o)}
            onTogglePlay={handleTogglePlay}
            onPrev={handlePrev}
            onNext={handleNext}
            onCenterClick={handleCenterClick}
          />
        </div>

        {/* LEFT CENTER: synced lyrics */}
        <SyncedLyrics lyrics={track.lyrics} currentTime={currentTime} playing={playing} />

        {/* RIGHT CENTER: project origin */}
        <RightPanel />

        {/* BOTTOM LEFT: minimal caption */}
        <div className="bottom-left" style={{
          position: "absolute", bottom: "var(--pad-bottom)", left: "var(--pad-x)",
          fontFamily: "var(--font-space-mono), monospace", fontSize: "var(--bottom-text-size)",
          letterSpacing: "0.34em", color: "#cbb2bb", lineHeight: 1.9,
        }}>
          TESTAROSSA<br />· WHITE ·
        </div>

        {/* quote */}
        <div className="quote-area" style={{
          position: "absolute", bottom: "var(--pad-bottom)", left: "50%", transform: "translateX(-50%)",
          fontFamily: "var(--font-space-mono), monospace",
          fontSize: "var(--quote-size)",
          letterSpacing: "0.18em", color: "#cbb2bb", textAlign: "center",
        }}>
          <span key={quotePulseKey} style={{
            display: "inline-block",
            animation: quotePulseKey > 0 ? "wwQuotePulse 2s ease-in-out" : "none",
          }}>
            for all grief is a window of memory
          </span>
        </div>

        {/* BOTTOM RIGHT: ON AIR */}
        <div className="onair-area" style={{ position: "absolute", bottom: "var(--pad-bottom)", right: "var(--pad-x)", pointerEvents: "auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "var(--onair-gap)",
            padding: "var(--onair-pad)", borderRadius: 100,
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(16px) saturate(150%)", WebkitBackdropFilter: "blur(16px) saturate(150%)",
            border: "1px solid rgba(255,255,255,0.85)",
            boxShadow: "0 10px 24px -14px rgba(170,120,145,0.35)",
          }}>
            <span style={{ width: "var(--onair-blob)", height: "var(--onair-blob)", borderRadius: "50%", background: "#f0567f", display: "inline-block", animation: "wwBlink 1.6s steps(1) infinite" }} />
            <span style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: "var(--onair-font)", letterSpacing: "0.36em", color: "#9a838e" }}>ON AIR</span>
          </div>
        </div>
      </div>
    </div>
  );
}

useGLTF.preload("/sakura-voxel-opt-v2.glb", true);
useGLTF.preload("/testarossa-with-driver-opt.glb", true);
