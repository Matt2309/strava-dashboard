import {
	ArrowRightIcon,
	CalendarIcon,
	ClockIcon,
	MountainIcon,
	TrendingUpIcon,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Activity } from "@/lib/types";
import { formatDate, formatMovingTime } from "@/lib/utils";

export function ActivityCard({ activity }: { activity: Activity }) {
	const distanceInKm = (activity.distance / 1000).toFixed(2);
	const movingTime = formatMovingTime(activity.moving_time);
	const elevationGain = activity.total_elevation_gain.toFixed(0);
	const activityDate = formatDate(activity.start_date);

	return (
		<Link href={`/app/(app)/activity/${activity.id}`}>
			<Card className="hover:border-primary transition-colors">
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-lg font-bold">{activity.name}</CardTitle>
					<span className="text-sm text-muted-foreground">
						{activity.sport_type}
					</span>
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
					</div>
					<div className="flex items-center justify-end mt-4">
						<span className="text-sm text-primary">View Details</span>
						<ArrowRightIcon className="w-4 h-4 ml-1 text-primary" />
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
