# Endowment Charts

A responsive collection of animated endowment visualizations built with HTML, CSS, and Chart.js.

## Features

- Animated bar and bubble charts that appear when scrolled into view
- Subtle hover interactions for desktop users
- Static chart image fallbacks below `768px`
- Accessible labels for charts and fallback images
- ASU brand colors:
  - Gold: `#ffc627`
  - Maroon: `#8c1d40`

## Run Locally

No build step or package installation is required.

From this directory, start a local server:

```sh
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000) in a browser.

## Project Files

- `index.html` contains the page structure and fallback images.
- `styles.css` controls layout, responsive behavior, and bubble interactions.
- `script.js` defines the Chart.js data, animations, and bar interactions.
- `chart.umd.min.js` is the local Chart.js library.
- `*-fallback.*` files are the chart images displayed below `768px`.

## Responsive Behavior

At widths of `768px` and above, the page displays the live Chart.js visualizations. Below `768px`, the live charts are hidden and replaced by optimized fallback images.

To update a visualization, edit its data in `script.js`. If the mobile presentation also changes, update the corresponding fallback image in the project folder.
