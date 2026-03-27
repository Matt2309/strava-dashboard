"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// ============================================================================
// CONFIGURATION
// ============================================================================

const TRACK_CONFIG = {
    totalLanes: 7,
    laneWidth: 25,

    // Curved geometry
    baseRadius: 500, // Increased to "widen" the track curve
    centerX: 100,
    centerY: 120,

    // Straight lines
    straightBottom: 420, // Extended to fill height properly

    // Animation
    animationStagger: 0.15,
    lineAnimationDuration: 2.2,
    labelAnimationDelay: 1.6,

    // ViewBox recalculated to include all generated geometry
    svgViewBox: "360 120 400 300" as const,
    strokeWidth: 1.2, // Reduced thickness for a more elegant and technical look
};

// ============================================================================
// CAD-LIKE GEOMETRY
// ============================================================================

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
    return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
    };
}

function generateTrack(config: typeof TRACK_CONFIG) {
    const lanes = [];

    for (let i = 0; i < config.totalLanes; i++) {
        const laneNumber = i < config.totalLanes - 1 ? i + 1 : null;

        const r = config.baseRadius + i * config.laneWidth;

        // Widened angles for a softer and more realistic curve
        const startAngle = Math.PI * 0.02; // Almost vertical
        const endAngle = Math.PI * 0.9;    // Very wide curve, almost semicircular

        const start = polarToCartesian(
            config.centerX,
            config.centerY - 150,
            r,
            startAngle
        );

        const end = polarToCartesian(
            config.centerX,
            config.centerY - 150,
            r,
            endAngle
        );

        // =========================
        // CURVE (perfect arc)
        // =========================
        const curvePath = `
            M ${start.x} ${start.y}
            A ${r} ${r} 0 0 1 ${end.x} ${end.y}
        `;

        // =========================
        // STRAIGHT LINE (pure vertical)
        // =========================
        const straightX = start.x;

        // Now the straight line connects perfectly to the start of the curve (start.y)
        const straightPath = `
            M ${straightX} ${config.straightBottom}
            L ${straightX} ${start.y} 
        `;

        lanes.push({
            laneNumber,
            curvePath,
            straightPath,
            labelX: straightX + 12, // Dynamically centered relative to the line
            labelY: config.straightBottom - 8,
            showLabel: laneNumber !== null,
        });
    }

    return lanes;
}

// ============================================================================
// ANIMATION
// ============================================================================

const getPathVariants = (i: number) => ({
    initial: {
        pathLength: 0,
        opacity: 0,
    },
    animate: {
        pathLength: 1,
        opacity: 0.8, // Slightly reduced opacity for a better "glow" effect
        transition: {
            pathLength: {
                duration: TRACK_CONFIG.lineAnimationDuration,
                delay: i * TRACK_CONFIG.animationStagger,
                ease: "easeInOut" as const,
            },
            opacity: {
                duration: 0.2,
                delay: i * TRACK_CONFIG.animationStagger,
            },
        },
    },
});

const getCurveVariants = (i: number) => ({
    initial: {
        pathLength: 0,
        pathOffset: 1, // ← starts from the end of the path
        opacity: 0,
    },
    animate: {
        pathLength: 1,
        pathOffset: 0, // ← animates towards the start (inversion)
        opacity: 0.8,
        transition: {
            pathLength: {
                duration: TRACK_CONFIG.lineAnimationDuration,
                delay: i * TRACK_CONFIG.animationStagger,
                ease: "easeInOut" as const,
            },
            pathOffset: {
                duration: TRACK_CONFIG.lineAnimationDuration,
                delay: i * TRACK_CONFIG.animationStagger,
                ease: "easeInOut" as const,
            },
            opacity: {
                duration: 0.2,
                delay: i * TRACK_CONFIG.animationStagger,
            },
        },
    },
});

const getLabelVariants = (i: number) => ({
    initial: {
        opacity: 0,
        y: 10,
    },
    animate: {
        opacity: 0.9,
        y: 0,
        transition: {
            duration: 0.4,
            ease: "easeOut" as const,
            delay:
                TRACK_CONFIG.labelAnimationDelay +
                i * TRACK_CONFIG.animationStagger,
        },
    },
});

// ============================================================================
// COMPONENT
// ============================================================================

export function RunningTrackAnimation() {
    const lanes = generateTrack(TRACK_CONFIG);
    const { theme, systemTheme } = useTheme();
    const [lineColor, setLineColor] = useState<string>("white");

    useEffect(() => {
        // Determine the current theme (dark or light) only after mounting
        const currentTheme = theme === "system" ? systemTheme : theme;
        const isDark = currentTheme === "dark";
        setLineColor(isDark ? "white" : "black");
    }, [theme, systemTheme]);

    return (
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden flex items-end justify-end">
            <svg
                viewBox={TRACK_CONFIG.svgViewBox}
                className="w-full h-full opacity-60"
                // Crucial: ensures that the lowest point of the track matches the bottom of the screen
                preserveAspectRatio="xMidYMax slice"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <title>Running Track Animation</title>
                {/* LINES */}
                <g
                    stroke={lineColor}
                    strokeWidth={TRACK_CONFIG.strokeWidth}
                    strokeLinecap="round"
                >
                    {lanes.map((lane, i) => (
                        <g key={lane.laneNumber}>
                            {/* STRAIGHT LINE */}
                            <motion.path
                                d={lane.straightPath}
                                variants={getPathVariants(i)}
                                initial="initial"
                                animate="animate"
                            />

                            {/* CURVE */}
                            <motion.path
                                d={lane.curvePath}
                                variants={getCurveVariants(i)}
                                initial="initial"
                                animate="animate"
                            />
                        </g>
                    ))}
                </g>

                {/* NUMBERS */}
                <g
                    fill={lineColor}
                    fontSize="18"
                    fontWeight="700"
                    textAnchor="middle"
                    style={{ letterSpacing: "-1px" }}
                >
                    {lanes.map((lane, i) => (
                        lane.showLabel && (
                            <motion.text
                                key={lane.laneNumber}
                                x={lane.labelX}
                                y={lane.labelY}
                                variants={getLabelVariants(i)}
                                initial="initial"
                                animate="animate"
                            >
                                {lane.laneNumber}
                            </motion.text>
                        )
                    ))}
                </g>
            </svg>
        </div>
    );
}