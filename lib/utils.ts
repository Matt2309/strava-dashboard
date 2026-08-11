import { type ClassValue, clsx } from "clsx";
import React from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function debounce<T extends (...args: any[]) => any>(
	func: T,
	delay: number,
): (...args: Parameters<T>) => void {
	let timeoutId: NodeJS.Timeout;
	return (...args: Parameters<T>) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => func(...args), delay);
	};
}

export function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = React.useState(value);

	React.useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => clearTimeout(handler);
	}, [value, delay]);

	return debouncedValue;
}

export function formatMovingTime(movingTimeInSeconds: number): string {
	const hours = Math.floor(movingTimeInSeconds / 3600);
	const minutes = Math.floor((movingTimeInSeconds % 3600) / 60);
	const seconds = movingTimeInSeconds % 60;

	const parts: string[] = [];
	if (hours > 0) {
		parts.push(`${hours}h`);
	}
	if (minutes > 0) {
		parts.push(`${minutes}m`);
	}
	if (seconds > 0 && hours === 0) {
		parts.push(`${Math.round(seconds)}s`);
	}

	return parts.join(" ");
}

export function calculatePace(
	distanceInMeters: number,
	movingTimeInSeconds: number,
): string {
	if (distanceInMeters === 0) {
		return "0:00";
	}
	const paceInSecondsPerKm = movingTimeInSeconds / (distanceInMeters / 1000);
	const minutes = Math.floor(paceInSecondsPerKm / 60);
	const seconds = Math.round(paceInSecondsPerKm % 60);
	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

/**
 * Formats a rest-time duration (stored in seconds) for display, e.g.
 * `90` -> "1m 30s", `45` -> "45s". Returns "N/A" when unset.
 */
export function formatRestTime(seconds: number | null | undefined): string {
	if (!seconds) return "N/A";
	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
}

/**
 * Parses a free-form target-reps string (e.g. "8", "6-8", "MAX", "AMRAP")
 * into a starting number to prefill the reps input during a workout.
 * Ranges resolve to their lower bound; anything non-numeric ("MAX") falls
 * back to 0 so the athlete enters what they actually did.
 */
export function parseTargetReps(targetReps: string | null | undefined): number {
	if (!targetReps) return 0;
	const match = targetReps.match(/\d+/);
	return match ? Number.parseInt(match[0], 10) : 0;
}
