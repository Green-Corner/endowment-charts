const GOLD = "#ffc627";
const MAROON = "#8c1d40";
const LABEL_FONT = "'Arial', 'Helvetica', sans-serif";
const MOBILE_CHART_WIDTH = 600;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

Chart.defaults.font.family = LABEL_FONT;
Chart.defaults.color = "#000";
Chart.defaults.animation.duration = reduceMotion ? 0 : 1150;
Chart.defaults.animation.easing = "easeOutQuart";
Chart.defaults.plugins.tooltip.enabled = false;

const valueLabels = {
  id: "valueLabels",
  afterDatasetsDraw(chart, _args, opts) {
    const { ctx } = chart;
    const meta = chart.getDatasetMeta(opts.datasetIndex || 0);
    const fontSize = typeof opts.size === "function"
      ? opts.size(chart)
      : opts.size || 42;
    ctx.save();
    ctx.fillStyle = opts.color || "#000";
    ctx.font = `${opts.weight || 900} ${fontSize}px ${LABEL_FONT}`;
    ctx.textAlign = opts.align || "center";
    ctx.textBaseline = "bottom";
    meta.data.forEach((bar, index) => {
      const raw = chart.data.datasets[0].data[index];
      const label = opts.formatter ? opts.formatter(raw, index) : String(raw);
      const offset = typeof opts.offset === "function"
        ? opts.offset(chart)
        : opts.offset || 14;
      const xOffset = typeof opts.xOffset === "function"
        ? opts.xOffset(chart, index)
        : opts.xOffset?.[index] || 0;
      const y = bar.y - offset;
      const x = bar.x + xOffset;
      ctx.fillText(label, x, y);
    });
    ctx.restore();
  }
};

const barLightPulse = {
  id: "barLightPulse",
  afterEvent(chart) {
    const hasActiveBar = chart.getActiveElements().length > 0;

    if (!hasActiveBar && chart.$lightPulseFrame) {
      cancelAnimationFrame(chart.$lightPulseFrame);
      chart.$lightPulseFrame = null;
      chart.draw();
      return;
    }

    if (!hasActiveBar || reduceMotion || chart.$lightPulseFrame) return;

    const animateLight = () => {
      if (!chart.getActiveElements().length) {
        chart.$lightPulseFrame = null;
        chart.draw();
        return;
      }

      chart.draw();
      chart.$lightPulseFrame = requestAnimationFrame(animateLight);
    };

    chart.$lightPulseFrame = requestAnimationFrame(animateLight);
  },
  afterDatasetsDraw(chart) {
    const activeBars = chart.getActiveElements();
    if (!activeBars.length) return;

    activeBars.forEach(({ element }) => {
      const { x, y, base, width } = element.getProps(["x", "y", "base", "width"], true);
      const height = base - y;
      const pulse = reduceMotion
        ? .5
        : (Math.sin(performance.now() / 260) + 1) / 2;

      chart.ctx.save();
      chart.ctx.fillStyle = `rgba(255, 255, 255, ${.04 + pulse * .13})`;
      chart.ctx.fillRect(x - width / 2, y, width, height);
      chart.ctx.restore();
    });
  },
  afterDestroy(chart) {
    if (chart.$lightPulseFrame) cancelAnimationFrame(chart.$lightPulseFrame);
  }
};

Chart.register(barLightPulse, valueLabels);

function makeBarChart(id, labels, data, color, max, labelOptions = {}, mobileLabels = labels) {
  const canvas = document.getElementById(id);
  const isMobile = canvas.clientWidth < MOBILE_CHART_WIDTH;

  return new Chart(canvas, {
    type: "bar",
    data: {
      labels: isMobile ? mobileLabels : labels,
      datasets: [{
        data,
        backgroundColor: color,
        hoverBackgroundColor: color,
        hoverBorderWidth: 0,
        borderWidth: 0,
        borderRadius: 0,
        barPercentage: isMobile ? .76 : .94,
        categoryPercentage: isMobile ? .84 : .94
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: isMobile ? 44 : 62,
          right: isMobile ? 4 : 16,
          bottom: 0,
          left: isMobile ? 4 : 8
        }
      },
      interaction: { mode: "nearest", intersect: true },
      onResize(chart, size) {
        const mobile = size.width < MOBILE_CHART_WIDTH;
        chart.data.labels = mobile ? mobileLabels : labels;
        chart.data.datasets[0].barPercentage = mobile ? .76 : .94;
        chart.data.datasets[0].categoryPercentage = mobile ? .84 : .94;
        chart.options.layout.padding.top = mobile ? 44 : 62;
        chart.options.layout.padding.right = mobile ? 4 : 16;
        chart.options.layout.padding.left = mobile ? 4 : 8;
      },
      onHover(event, elements) {
        event.native.target.style.cursor = elements.length ? "pointer" : "default";
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: "#000",
            font(context) {
              return {
                size: context.chart.width < MOBILE_CHART_WIDTH ? 13 : 21,
                weight: "900"
              };
            },
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0
          }
        },
        y: {
          display: false,
          beginAtZero: true,
          suggestedMax: max,
          grid: { display: false },
          border: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
        valueLabels: labelOptions
      }
    }
  });
}

function buildBubbles() {
  const data = [
    ["1 year", "15.7%", 250],
    ["3 years", "11.6%", 184],
    ["5 years", "8.2%", 130],
    ["10 years", "10%", 160],
    ["15 years", "8.2%", 130]
  ];
  const holder = document.getElementById("performanceBubbles");
  data.forEach(([label, value, size], index) => {
    const bubble = document.createElement("div");
    bubble.className = "bubble-item";
    bubble.dataset.label = label;
    bubble.style.setProperty("--size", `${size}px`);
    bubble.style.setProperty("--mobile-size", `${Math.max(96, Math.round(size * .64))}px`);
    bubble.style.animationDelay = `${index * 90}ms`;
    bubble.tabIndex = 0;
    bubble.setAttribute("aria-label", `${label}: ${value}`);
    bubble.innerHTML = `<span class="bubble-ripple"></span><span class="bubble-pin"></span>${value}`;
    holder.appendChild(bubble);
  });
}

function buildHero() {
  new Chart(document.getElementById("totalEndowmentChart"), {
    type: "bar",
    data: {
      labels: ["FY16", "FY17", "FY18", "FY19", "FY20", "FY21", "FY22", "FY23", "FY24", "FY25", "FY26"],
      datasets: [{
        data: [.613, .69, .76, .96, .99, 1.34, 1.52, 1.65, 1.73, 1.86, 2.05],
        backgroundColor: GOLD,
        hoverBackgroundColor: GOLD,
        hoverBorderWidth: 0,
        borderWidth: 0,
        barPercentage: .94,
        categoryPercentage: .96
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 34, right: 0, bottom: 0, left: 0 } },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
        valueLabels: {
          size(chart) {
            return chart.width < MOBILE_CHART_WIDTH ? 20 : 32;
          },
          color: "#fff",
          align: "left",
          offset(chart) {
            return chart.width < MOBILE_CHART_WIDTH ? 14 : 26;
          },
          xOffset(chart, index) {
            if (index !== 0) return 0;
            return chart.width < MOBILE_CHART_WIDTH ? -12 : -44;
          },
          formatter(value, index) {
            if (index === 0) return "$613M";
            return "";
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: "#fff",
            font(context) {
              return {
                size: context.chart.width < MOBILE_CHART_WIDTH ? 11 : 20,
                weight: "900"
              };
            },
            maxRotation: 0,
            minRotation: 0
          }
        },
        y: {
          display: false,
          beginAtZero: true,
          suggestedMax: 2.22
        }
      },
      onHover(event, elements) {
        event.native.target.style.cursor = elements.length ? "pointer" : "default";
      }
    }
  });
}

const visualizations = [
  ["totalEndowmentChart", buildHero],
  ["performanceBubbles", buildBubbles],
  ["allocationChart", () => makeBarChart(
    "allocationChart",
    [["Asset allocation", "for the long-term", "investment pool"], "Private equity", ["Diversifying", "strategies"], ["Fixed", "income"], ["Real", "assets"], "Cash"],
    [36.3, 27.1, 15, 15.2, 5.7, .7],
    MAROON,
    42,
    {
      size(chart) {
        return chart.width < MOBILE_CHART_WIDTH ? 27 : 49;
      },
      offset(chart) {
        return chart.width < MOBILE_CHART_WIDTH ? 10 : 18;
      },
      formatter(value) {
        return `${value}%`;
      }
    },
    [["Long-term", "pool"], ["Private", "equity"], "Diversifiers", ["Fixed", "income"], ["Real", "assets"], "Cash"]
  )],
  ["fundsTotalChart", () => makeBarChart(
    "fundsTotalChart",
    ["Students", "Faculty", "Academics", "Other"],
    [1918, 211, 148, 398],
    MAROON,
    2150,
    {
      size(chart) {
        return chart.width < MOBILE_CHART_WIDTH ? 28 : 48;
      },
      offset(chart) {
        return chart.width < MOBILE_CHART_WIDTH ? 10 : 16;
      },
      formatter(value) {
        return value.toLocaleString("en-US");
      }
    }
  )],
  ["fundsCreatedChart", () => makeBarChart(
    "fundsCreatedChart",
    ["Students", "Faculty", "Academics", "Other"],
    [34, 9, 15, 6],
    MAROON,
    40,
    {
      size(chart) {
        return chart.width < MOBILE_CHART_WIDTH ? 28 : 48;
      },
      offset(chart) {
        return chart.width < MOBILE_CHART_WIDTH ? 10 : 16;
      }
    }
  )],
  ["beneficiaryChart", () => makeBarChart(
    "beneficiaryChart",
    ["Students", "Faculty", "Academics", "Other"],
    [30, 15, 15, 40],
    GOLD,
    46,
    {
      size(chart) {
        return chart.width < MOBILE_CHART_WIDTH ? 28 : 48;
      },
      offset(chart) {
        return chart.width < MOBILE_CHART_WIDTH ? 10 : 18;
      },
      formatter(value) {
        return `${value}%`;
      }
    }
  )]
];

const visualizationObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;

    const visualization = visualizations.find(([id]) => id === entry.target.id);
    visualization?.[1]();
    observer.unobserve(entry.target);
  });
}, {
  threshold: 0.18,
  rootMargin: "0px 0px -8% 0px"
});

visualizations.forEach(([id]) => {
  const element = document.getElementById(id);
  if (element) visualizationObserver.observe(element);
});
