import { useMemo, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import styles from "./interactiveTutorChart.module.css";

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

const getY = (point) => {
  if (typeof point === "number") return point;
  if (point && typeof point === "object") {
    if (Number.isFinite(point.y)) return point.y;
    if (Number.isFinite(point)) return point;
  }
  return 0;
};

const getX = (point, fallback) => {
  if (point && typeof point === "object" && Number.isFinite(point.x)) return point.x;
  return fallback;
};

const inferRegion = (index, total) => {
  if (total <= 0) return "transient";
  const ratio = index / Math.max(total - 1, 1);
  if (ratio < 0.33) return "transient";
  if (ratio < 0.7) return "convergence";
  return "steady";
};

const formatMaybe = (value, digits = 4) =>
  Number.isFinite(value) ? value.toFixed(digits) : "-";

export const getBubbleContent = ({ graphKind, region, yValue, slope, xValue, params }) => {
  const algoText = params.algorithm || "adaptive filter";
  const muText = Number.isFinite(params.mu) ? `mu=${params.mu}` : null;
  const orderText = Number.isFinite(params.order) ? `M=${params.order}` : null;
  const lambdaText = Number.isFinite(params.lambda) ? `lambda=${params.lambda}` : null;

  if (graphKind === "mse") {
    if (region === "transient") {
      return `The filter is still learning and error remains elevated (MSE=${formatMaybe(
        yValue
      )}) near iteration ${Math.round(xValue)}. ${muText ? `A larger ${muText} usually speeds adaptation but may induce oscillations.` : ""
        }`;
    }
    if (region === "convergence") {
      return `Error is dropping with slope ${formatMaybe(
        slope,
        5
      )}, indicating convergence. ${orderText ? `Order ${orderText} controls model flexibility and convergence smoothness.` : ""
        }`;
    }
    return `The response is in steady state: residual MSE=${formatMaybe(
      yValue
    )} reflects misadjustment/noise floor. ${algoText === "RLS" && lambdaText ? `With ${lambdaText}, RLS tracks changes while limiting jitter.` : ""
      }`;
  }

  if (graphKind === "weights") {
    if (region === "transient") {
      return `Weight adaptation is aggressive in this learning phase. The coefficient is moving quickly to model the signal path.`;
    }
    if (region === "convergence") {
      return `Weight updates are shrinking; coefficients are aligning to a stable inverse/predictor model.`;
    }
    return `Weights are mostly stable now. Small fluctuations represent tracking noise and finite-step adaptation.`;
  }

  if (graphKind === "psd") {
    return `At ${formatMaybe(xValue, 2)} Hz, PSD=${formatMaybe(
      yValue
    )}. Use this to inspect whether filtering suppresses unwanted spectral energy while preserving ECG content bands.`;
  }

  if (graphKind === "filtering") {
    return `Filtered output at t=${formatMaybe(xValue, 3)} s is ${formatMaybe(
      yValue
    )}. ${region === "transient"
        ? "Adaptive coefficients are still tuning."
        : region === "convergence"
          ? "The output is approaching the clean morphology."
          : "The filter is stable; remaining error is mostly residual noise."
      }`;
  }

  return `Sample ${Math.round(xValue)} shows value ${formatMaybe(yValue)}. ${region === "transient"
      ? "The model is learning."
      : region === "convergence"
        ? "The model is converging."
        : "The model is stable."
    }`;
};

export const InteractiveTutorChart = ({
  title,
  graphKind,
  chartData,
  options,
  params,
  height = 260,
}) => {
  const containerRef = useRef(null);
  const [hoverState, setHoverState] = useState(null);

  const dataLength = chartData?.datasets?.[0]?.data?.length || 0;

  const updateHover = (chart, element, nativeEvent) => {
    if (!chart || !element) return;
    const datasetIndex = element.datasetIndex || 0;
    const index = element.index || 0;
    const dataset = chart.data.datasets?.[datasetIndex];
    if (!dataset?.data?.length) return;

    const current = dataset.data[index];
    const prev = dataset.data[Math.max(0, index - 1)];
    const yCurrent = getY(current);
    const yPrev = getY(prev);
    const xCurrent = getX(current, index);
    const region = inferRegion(index, dataset.data.length);
    const slope = yCurrent - yPrev;
    const bubbleText = getBubbleContent({
      graphKind,
      region,
      yValue: yCurrent,
      slope,
      xValue: xCurrent,
      params: params || {},
    });

    const rect = containerRef.current?.getBoundingClientRect();
    const offsetX = nativeEvent?.offsetX ?? 0;
    const offsetY = nativeEvent?.offsetY ?? 0;
    const left = clamp(offsetX + 18, 10, (rect?.width || 420) - 270);
    const top = clamp(offsetY - 14, 10, (rect?.height || 260) - 110);

    setHoverState({
      index,
      region,
      left,
      top,
      bubbleText,
    });
  };

  const mergedOptions = useMemo(() => {
    const base = options || {};
    const existingPlugins = base.plugins || {};
    const existingTooltip = existingPlugins.tooltip || {};
    return {
      ...base,
      interaction: {
        mode: "nearest",
        intersect: false,
        axis: "x",
        ...(base.interaction || {}),
      },
      onHover: (event, elements, chart) => {
        if (elements?.length) {
          updateHover(chart, elements[0], event?.native);
        } else {
          setHoverState(null);
        }
        if (typeof base.onHover === "function") {
          base.onHover(event, elements, chart);
        }
      },
      plugins: {
        ...existingPlugins,
        tooltip: {
          ...existingTooltip,
          enabled: false,
          external: (ctx) => {
            const tooltip = ctx.tooltip;
            if (!tooltip || tooltip.opacity === 0) {
              setHoverState(null);
              return;
            }
            if (!tooltip.dataPoints?.length) return;
            updateHover(ctx.chart, tooltip.dataPoints[0], {
              offsetX: tooltip.caretX,
              offsetY: tooltip.caretY,
            });
          },
        },
      },
    };
  }, [options]);

  return (
    <div className={styles.chartCard}>
      {/* <h4 className={styles.chartTitle}>{title}</h4> */}

      <div className={styles.chartWrap} ref={containerRef} style={{ height }}>
        <div className="dashboard-chart-shell">
          <Line data={chartData} options={mergedOptions} />
        </div>
        {hoverState && (
          <div className={styles.bubble} style={{ left: hoverState.left, top: hoverState.top }}>
            {hoverState.bubbleText}
          </div>
        )}
      </div>
      {dataLength <= 1 && <p className={styles.hoverHint}>Hover guidance appears when enough samples exist.</p>}
    </div>
  );
};
