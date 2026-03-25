"use client";

import { ActivityCard } from "@/components/ActivityCard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetActivities } from "@/hooks/use-strava";

export function ActivityList() {
	const { data, isLoading, isError } = useGetActivities();

	if (isLoading) {
		return (
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list, order never changes
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-6 w-3/4" />
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-2 gap-4">
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
								<Skeleton className="h-12 w-full" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex h-[80vh] items-center justify-center">
				<p className="text-red-500">Error loading activities.</p>
			</div>
		);
	}

	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{(data ?? []).map((activity) => (
				<ActivityCard key={activity.id} activity={activity} />
			))}
		</div>
	);
}
