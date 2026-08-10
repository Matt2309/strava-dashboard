import { BackButton } from "@/components/buttons/back-button";
import { RedirectButton } from "@/components/buttons/redirect-button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { formatMovingTime } from "@/lib";
import { ROUTES } from "@/lib/routes";
import { getSession } from "@/routers/engine-room";

interface SessionSummaryPageProps {
	params: Promise<{ sessionId: string }>;
}

export default async function SessionSummaryPage({
	params,
}: SessionSummaryPageProps) {
	const { sessionId } = await params;
	const session = await getSession({ sessionId });

	const durationSeconds =
		session.endTime && session.startTime
			? Math.max(
					0,
					Math.round(
						(new Date(session.endTime).getTime() -
							new Date(session.startTime).getTime()) /
							1000,
					),
				)
			: 0;

	const totalVolume = session.exercises.reduce(
		(exerciseTotal, exercise) =>
			exerciseTotal +
			exercise.sets.reduce(
				(setTotal, set) => setTotal + set.reps * (set.weight ?? 0),
				0,
			),
		0,
	);

	return (
		<div className="space-y-8 p-6">
			<BackButton />

			<div className="space-y-2">
				<p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
					Workout Complete
				</p>
				<h1 className="text-4xl font-black">
					{session.day?.name ?? "Session Summary"}
				</h1>
				{session.day?.plan && (
					<p className="text-sm text-muted-foreground">
						{session.day.plan.name}
					</p>
				)}
			</div>

			{/* Stats */}
			<div className="grid grid-cols-3 gap-4">
				<Card>
					<CardHeader>
						<CardTitle className="text-xs uppercase text-muted-foreground">
							Duration
						</CardTitle>
					</CardHeader>
					<CardContent className="text-2xl font-black">
						{durationSeconds > 0 ? formatMovingTime(durationSeconds) : "—"}
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-xs uppercase text-muted-foreground">
							Exercises
						</CardTitle>
					</CardHeader>
					<CardContent className="text-2xl font-black">
						{session.exercises.length}
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-xs uppercase text-muted-foreground">
							Volume
						</CardTitle>
					</CardHeader>
					<CardContent className="text-2xl font-black">
						{totalVolume > 0 ? `${Math.round(totalVolume)} kg` : "—"}
					</CardContent>
				</Card>
			</div>

			{/* Exercises */}
			<div className="space-y-4">
				{session.exercises.map((exercise) => (
					<Card key={exercise.id}>
						<CardHeader>
							<CardTitle>
								{exercise.exercise.nameIta || exercise.exercise.nameEng}
							</CardTitle>
						</CardHeader>
						<CardContent>
							{exercise.sets.length === 0 ? (
								<p className="text-sm italic text-muted-foreground">
									No sets logged
								</p>
							) : (
								<table className="w-full text-sm">
									<thead>
										<tr className="text-left text-muted-foreground uppercase text-xs">
											<th className="py-1 font-semibold">Set</th>
											<th className="py-1 font-semibold">Reps</th>
											<th className="py-1 font-semibold">Weight</th>
											<th className="py-1 font-semibold">RPE</th>
										</tr>
									</thead>
									<tbody>
										{exercise.sets.map((set) => (
											<tr key={set.id} className="border-t border-border">
												<td className="py-2">{set.setNumber}</td>
												<td className="py-2">{set.reps}</td>
												<td className="py-2">
													{set.weight ? `${set.weight} kg` : "—"}
												</td>
												<td className="py-2">{set.rpe ?? "—"}</td>
											</tr>
										))}
									</tbody>
								</table>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			{/* Actions */}
			<div className="flex gap-3">
				{session.day?.plan && (
					<RedirectButton
						url={`/engine-room/${session.day.plan.id}`}
						text="BACK TO PLAN"
						variant="outline"
					/>
				)}
				<RedirectButton
					url={ROUTES["engine-room"].path}
					text="BACK TO ENGINE ROOM"
					variant="default"
				/>
			</div>
		</div>
	);
}
