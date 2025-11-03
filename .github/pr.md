# fix(layout): raise Home hero & correct anchor stop positions (dvh/clamp, scroll-margin-top)

### Why
On mobile Safari the dynamic address bar shrinks viewport height, causing the Home hero panel to sit too low with a huge top gap and tiny bottom gap. Also, anchor jumps stop too low, hiding the first lines of content.

### What
- Home section: reduced **external** paddings of the section (panel untouched) via CSS vars + `clamp()` with `dvh`.
- Anchor behavior: added `scroll-margin-top` through a shared class to land sections slightly higher and avoid hidden headings.

### How
- `helpers.css`: new variables `--home-hero-*`, `--anchor-offset`; classes `home-hero-section`, `section-anchor-offset`.
- `HomePage.jsx`: applied `home-hero-section`, removed explicit `pt-*/pb-*` on the section.
- Applied `section-anchor-offset` to key sections (`home`, `calendar`, `gallery`, etc.) without changing their inner layout.

### Scope/Risks
- No token changes, no Tailwind import order changes.
- Pure spacing adjustments; colors/blur/shadows untouched.
- Low risk; verify iOS Safari (expanded/collapsed URL bar) + desktop.

### QA
1) Open Home on iPhone Safari: panel sits higher, wheel doesn’t overlap.  
2) Tap nav anchors to Calendar/Gallery: stop is higher, headings visible.  
3) Desktop Chrome/Firefox: no visible regressions.  
