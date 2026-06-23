Wi-Fi Nebula

A generative art visualizer that animates your browser's real connection data as a living nebula.

Live demo: https://arnu-bansal.github.io/wifi-nebula

How it works

Signal strength (0–100%) is blended from two real browser sources:

SourceHowWeightNetwork Information APIeffectiveType, downlink, rtt65%Active pingfetch() round-trip time to your origin35%

The nebula reacts:


Brighter core + faster pulses → stronger signal
Dim, slow flicker → poor connection or high latency
Hue shifts from teal (weak) toward blue-violet (strong)


Stack


p5.js — generative canvas animation
navigator.connection (Network Information API)
fetch() for active ping measurement
Vanilla JS + CSS, no build step


Deploy to GitHub Pages

bashgit init
git add .
git commit -m "init wifi nebula"
gh repo create wifi-nebula --public --push --source=.
# then enable Pages: Settings → Pages → Branch: main / root

File structure

wifi-nebula/
├── index.html   # entry point
├── style.css    # dark space aesthetic
├── signal.js    # connection data + ping module
└── sketch.js    # p5.js nebula animation

Browser support

Network Information API works in Chrome/Edge/Android. Firefox and Safari fall back to ping-only mode — the nebula still works, just uses latency alone.
