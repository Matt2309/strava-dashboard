import { hasUniformSets } from "@/lib/schemas/engine-room.schema";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { PlanDetailRep } from "./types";

interface ExerciseSetTableProps {
	reps: PlanDetailRep[];
	restTime: string;
}

export function ExerciseSetTable({ reps, restTime }: ExerciseSetTableProps) {
	if (reps.length === 0) {
		return (
			<p className="text-sm italic text-muted-foreground">No sets configured</p>
		);
	}

	if (hasUniformSets(reps)) {
		const [first] = reps;
		const parts = [
			`${reps.length} × ${first.targetReps ?? "—"}`,
			first.targetRpe != null ? `RPE ${first.targetRpe}` : null,
			first.weight != null ? `${first.weight} kg` : null,
			first.machineType ?? null,
			`rest ${restTime}`,
		].filter(Boolean);

		return (
			<p className="text-sm font-medium text-foreground">{parts.join(" · ")}</p>
		);
	}

	// Non-uniform (pyramid) scheme: the sets genuinely differ, so show every
	// row instead of collapsing to a single line.
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Set</TableHead>
					<TableHead>Reps</TableHead>
					<TableHead>RPE</TableHead>
					<TableHead>Kg</TableHead>
					<TableHead>Type</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{reps.map((rep) => (
					<TableRow key={rep.id}>
						<TableCell>{rep.setNumber}</TableCell>
						<TableCell>{rep.targetReps ?? "—"}</TableCell>
						<TableCell>{rep.targetRpe ?? "—"}</TableCell>
						<TableCell>{rep.weight ?? "—"}</TableCell>
						<TableCell>{rep.machineType ?? "—"}</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
