"use client";

import type { ColumnDef, Row } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Activity, formatDate, formatMovingTime } from "@/lib";
import { ROUTES } from "@/lib/routes";

function ActionsCell({ row }: { row: Row<Partial<Activity>> }) {
	const router = useRouter();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={<Button variant="ghost" className="h-8 w-8 p-0" />}
			>
				<span className="sr-only">Open activity details</span>
				<MoreHorizontal className="h-4 w-4" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuGroup>
					<DropdownMenuLabel>Actions</DropdownMenuLabel>
					<DropdownMenuItem
						onClick={() =>
							router.push(
								ROUTES["activity-detail"].build(String(row.original.id)),
							)
						}
					>
						Activity details
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export const columns: ColumnDef<Partial<Activity>>[] = [
	{
		accessorKey: "sport_type",
		header: () => <div className="font-bold">Sport Type</div>,
		cell: ({ row }) => {
			const sport_type: string = row.getValue("sport_type");
			return <div className="font-medium">{sport_type}</div>;
		},
	},
	{
		accessorKey: "distance",
		header: () => <div className="font-bold">Distance</div>,
		cell: ({ row }) => {
			const distance: number = row.getValue("distance");
			const distanceInKm = (distance / 1000).toFixed(2);
			return <div className="font-medium">{distanceInKm}km</div>;
		},
	},
	{
		accessorKey: "moving_time",
		header: () => <div className="font-bold">Moving Time</div>,
		cell: ({ row }) => {
			const moving_time: number = row.getValue("moving_time");
			const movingTime = formatMovingTime(moving_time);
			return <div className="font-medium">{movingTime}</div>;
		},
	},
	{
		accessorKey: "total_elevation_gain",
		header: () => <div className="font-bold">Elevation</div>,
		cell: ({ row }) => {
			const total_elevation_gain: number = row.getValue("total_elevation_gain");
			const elevationGain = total_elevation_gain.toFixed(0);
			return <div className="font-medium">{elevationGain} mt</div>;
		},
	},
	{
		accessorKey: "start_date",
		header: () => <div className="font-bold">Date</div>,
		cell: ({ row }) => {
			const start_date: string = row.getValue("start_date");
			const activityDate = formatDate(start_date);
			return <div className="font-medium">{activityDate}</div>;
		},
	},
	{
		id: "actions",
		header: () => <div className="font-bold">Azioni</div>,
		cell: ({ row }) => <ActionsCell row={row} />,
	},
];
