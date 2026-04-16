"use client";

import {
	AlertCircle,
	CalendarIcon,
	ClockIcon,
	GaugeIcon,
	HeartIcon,
	MountainIcon,
	TrendingUpIcon,
	ZapIcon,
} from "lucide-react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useExportToToon, useGetActivity } from "@/hooks/use-strava";
import { calculatePace, formatDate, formatMovingTime } from "@/lib/utils";
import {BackButton} from "@/components/buttons/back-button";

export default function ActivityPage() {
	const params = useParams();
	const id = params.id as string;

	// Replaced useStrava() with the new TanStack Query hooks
	const { data: activity, isLoading: isLoadingActivity } = useGetActivity(id);
	const exportToToon = useExportToToon();

	const handleExport = async () => {
		try {
			const toonData = await exportToToon.mutateAsync({ id });

			// Safety check: stringify the data if the mutation returns an object
			const blobContent =
				typeof toonData === "string" ? toonData : JSON.stringify(toonData);
			const blob = new Blob([blobContent], { type: "application/json" });

			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `activity_${id}.toon.json`;
			a.click();
			URL.revokeObjectURL(url);

			toast.success("Export Successful", {
				description: "The activity has been exported to a TOON file.",
			});
		} catch (error) {
			console.error("Failed to export to TOON:", error);
			toast.error("Export Failed", {
				description: "There was a problem exporting the activity.",
			});
		}
	};

	if (isLoadingActivity) {
		return (
			<div className="p-4">
				<header className="flex items-center justify-between mb-4">
					<Skeleton className="h-10 w-48" />
					<Skeleton className="h-10 w-32" />
				</header>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					<Card className="lg:col-span-2">
						<CardHeader>
							<Skeleton className="h-8 w-3/4" />
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-4">
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
							</div>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<Skeleton className="h-8 w-1/2" />
						</CardHeader>{" "}
						{/* Fixed the </Header> typo from original code here */}
						<CardContent>
							<Skeleton className="h-6 w-full mb-2" />
							<Skeleton className="h-6 w-full" />
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	if (!activity) {
		return (
			<div className="flex h-screen items-center justify-center">
				<Alert variant="destructive" className="w-full max-w-md">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>
						Activity not found. It might have been deleted or you may not have
						permission to view it.
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	const distanceInKm = (activity.distance / 1000).toFixed(2);
	const movingTime = formatMovingTime(activity.moving_time);
	const elevationGain = activity.total_elevation_gain.toFixed(0);
	const activityDate = formatDate(activity.start_date);
	const pace = calculatePace(activity.distance, activity.moving_time);

	return (
		<div className="p-4">
			<header className="flex items-center justify-between mb-4">
				<div className="flex items-center gap-2">
					<BackButton/>
					<h1 className="text-2xl font-bold">Activity Details</h1>
				</div>
				<Button onClick={handleExport} disabled={exportToToon.isPending}>
					{exportToToon.isPending ? "Exporting..." : "Export to TOON"}
				</Button>
			</header>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>{activity.name}</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-4">
							<div className="flex items-center">
								<TrendingUpIcon className="w-5 h-5 mr-2 text-primary" />
								<div>
									<p className="font-semibold">{distanceInKm} km</p>
									<p className="text-sm text-muted-foreground">Distance</p>
								</div>
							</div>
							<div className="flex items-center">
								<ClockIcon className="w-5 h-5 mr-2 text-primary" />
								<div>
									<p className="font-semibold">{movingTime}</p>
									<p className="text-sm text-muted-foreground">Moving Time</p>
								</div>
							</div>
							<div className="flex items-center">
								<GaugeIcon className="w-5 h-5 mr-2 text-primary" />
								<div>
									<p className="font-semibold">{pace} /km</p>
									<p className="text-sm text-muted-foreground">Pace</p>
								</div>
							</div>
							<div className="flex items-center">
								<MountainIcon className="w-5 h-5 mr-2 text-primary" />
								<div>
									<p className="font-semibold">{elevationGain} m</p>
									<p className="text-sm text-muted-foreground">Elevation</p>
								</div>
							</div>
							<div className="flex items-center">
								<CalendarIcon className="w-5 h-5 mr-2 text-primary" />
								<div>
									<p className="font-semibold">{activityDate}</p>
									<p className="text-sm text-muted-foreground">Date</p>
								</div>
							</div>
							{activity.average_heartrate && (
								<div className="flex items-center">
									<HeartIcon className="w-5 h-5 mr-2 text-primary" />
									<div>
										<p className="font-semibold">
											{activity.average_heartrate.toFixed(0)} bpm
										</p>
										<p className="text-sm text-muted-foreground">Avg HR</p>
									</div>
								</div>
							)}
							{activity.suffer_score && (
								<div className="flex items-center">
									<ZapIcon className="w-5 h-5 mr-2 text-primary" />
									<div>
										<p className="font-semibold">
											{activity.suffer_score.toFixed(0)}
										</p>
										<p className="text-sm text-muted-foreground">
											Training Load
										</p>
									</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Gear info</CardTitle>
					</CardHeader>
					<CardContent>
						<CardDescription>Device</CardDescription>
						<p>{activity.device_name}</p>
						<CardDescription>Gear</CardDescription>
						<p>
							{activity.gear && `${activity.gear?.name} -`}
							{activity.gear && ` ${activity.gear?.converted_distance} km`}
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
