import { Dumbbell, Plus, Trash2 } from "lucide-react";
import { type Control, Controller, useFieldArray } from "react-hook-form";

import ExerciseSelect from "@/components/forms/create-plan/exercise-select";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CreatePlanInput } from "@/lib/schemas/engine-room.schema";

export default function DayContent({
	control,
	dayIndex,
	dayName,
}: {
	control: Control<CreatePlanInput, any>;
	dayIndex: number;
	dayName: string;
}) {
	const {
		fields: exerciseFields,
		append: appendExercise,
		remove: removeExercise,
	} = useFieldArray({
		control,
		name: `days.${dayIndex}.exercises`,
	});

	const addExercise = () => {
		appendExercise({
			exerciseId: "",
			order: (exerciseFields.length || 0) + 1,
			restTime: 60,
			coachNotes: "",
			personalNotes: "",
			reps: [
				{
					setNumber: 1,
					targetReps: "",
				},
			],
		});
	};

	return (
		<div className="space-y-6">
			{/* Day Header */}
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold italic text-foreground">{dayName}</h2>
				<div className="text-sm font-medium text-muted-foreground">
					ESTIMATED: XX MIN
				</div>
			</div>

			{/* Exercises List */}
			<div className="space-y-4">
				{exerciseFields.length === 0 && (
					<div className="text-center py-8 text-muted-foreground">
						No exercises added yet
					</div>
				)}

				{exerciseFields.map((exercise, exerciseIndex) => (
					<div
						key={exercise.id}
						className="space-y-3 border border-border rounded-lg bg-card p-4"
					>
						{/* Row 1: Exercise Name, Sets, Reps, Recovery, Trash */}
						<div className="grid grid-cols-12 gap-3 items-end">
							{/* Exercise Name */}
							<div className="col-span-5">
								<Controller
									name={`days.${dayIndex}.exercises.${exerciseIndex}.exerciseId`}
									control={control}
									render={({ field, fieldState }) => (
										<ExerciseSelect
											value={field.value}
											onChange={field.onChange}
											onBlur={field.onBlur}
											invalid={fieldState.invalid}
											error={fieldState.error}
										/>
									)}
								/>
							</div>

							{/* Sets */}
							<div className="col-span-2">
								<Controller
									name={`days.${dayIndex}.exercises.${exerciseIndex}.reps.0.setNumber`}
									control={control}
									render={({ field, fieldState }) => (
										<Field data-invalid={fieldState.invalid}>
											<FieldLabel className="text-xs">SETS</FieldLabel>
											<Input
												{...field}
												value={field.value as string | number | undefined}
												placeholder="4"
												className="bg-input text-foreground border-border"
												aria-invalid={fieldState.invalid}
											/>
											{fieldState.invalid && (
												<FieldError errors={[fieldState.error]} />
											)}
										</Field>
									)}
								/>
							</div>

							{/* Reps */}
							<div className="col-span-2">
								<Controller
									name={`days.${dayIndex}.exercises.${exerciseIndex}.reps.0.targetReps`}
									control={control}
									render={({ field, fieldState }) => (
										<Field data-invalid={fieldState.invalid}>
											<FieldLabel className="text-xs">REPS</FieldLabel>
											<Input
												{...field}
												placeholder="6-8"
												className="bg-input text-foreground border-border"
												aria-invalid={fieldState.invalid}
											/>
											{fieldState.invalid && (
												<FieldError errors={[fieldState.error]} />
											)}
										</Field>
									)}
								/>
							</div>

							{/* Recovery */}
							<div className="col-span-2">
								<Controller
									name={`days.${dayIndex}.exercises.${exerciseIndex}.restTime`}
									control={control}
									render={({ field, fieldState }) => (
										<Field data-invalid={fieldState.invalid}>
											<FieldLabel className="text-xs">RECOVERY</FieldLabel>
											<Input
												{...field}
												value={field.value as string | number | undefined}
												type="number"
												placeholder="3:00"
												className="bg-input text-foreground border-border"
												aria-invalid={fieldState.invalid}
											/>
											{fieldState.invalid && (
												<FieldError errors={[fieldState.error]} />
											)}
										</Field>
									)}
								/>
							</div>

							{/* Trash Icon */}
							<div className="col-span-1 flex justify-end pb-2">
								<button
									type="button"
									onClick={() => removeExercise(exerciseIndex)}
									className="p-2 rounded-md bg-muted text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>
						</div>

						{/* Row 2: Program Notes, My Setup Notes */}
						<div className="grid grid-cols-2 gap-3">
							{/* Program Notes */}
							<Controller
								name={`days.${dayIndex}.exercises.${exerciseIndex}.coachNotes`}
								control={control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel className="text-xs flex items-center gap-2">
											📋 PROGRAM NOTES
										</FieldLabel>
										<Textarea
											{...field}
											placeholder="Focus on keeping lats engaged throughout the entire pull."
											rows={3}
											className="bg-input text-foreground border-border resize-none"
											aria-invalid={fieldState.invalid}
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>

							{/* My Setup Notes */}
							<Controller
								name={`days.${dayIndex}.exercises.${exerciseIndex}.personalNotes`}
								control={control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel className="text-xs flex items-center gap-2">
											👤 MY SETUP NOTES
										</FieldLabel>
										<Textarea
											{...field}
											placeholder="Use 2-inch riser blocks. Belt at notch 4."
											rows={3}
											className="bg-input text-foreground border-border resize-none"
											aria-invalid={fieldState.invalid}
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
						</div>

						{/* Row 3: Equipment settings */}
						<div className="grid grid-cols-2 gap-3">
							{/* Equipment 1 */}
							<Controller
								name={`days.${dayIndex}.exercises.${exerciseIndex}.equipmentSetting1`}
								control={control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel className="text-xs flex items-center gap-2">
											<Dumbbell size={"20px"} /> EQUIPMENT SETTINGS 1
										</FieldLabel>
										<Textarea
											{...field}
											placeholder="Inclination 45 degrees."
											rows={3}
											className="bg-input text-foreground border-border resize-none"
											aria-invalid={fieldState.invalid}
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>

							{/* Equipment 2 */}
							<Controller
								name={`days.${dayIndex}.exercises.${exerciseIndex}.equipmentSetting2`}
								control={control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel className="text-xs flex items-center gap-2">
											<Dumbbell size={"20px"} /> EQUIPMENT SETTINGS 2
										</FieldLabel>
										<Textarea
											{...field}
											placeholder="Bench seat at snap 2."
											rows={3}
											className="bg-input text-foreground border-border resize-none"
											aria-invalid={fieldState.invalid}
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
						</div>
					</div>
				))}

				{/* Add Exercise Button */}
				<button
					type="button"
					onClick={addExercise}
					className="w-full py-3 border-2 border-dashed border-border rounded-lg text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2 font-semibold"
				>
					<Plus className="w-5 h-5" />
					ADD EXERCISE
				</button>
			</div>

			{/* Day Notes */}
			<Controller
				name={`days.${dayIndex}.notes`}
				control={control}
				render={({ field, fieldState }) => (
					<Field data-invalid={fieldState.invalid}>
						<FieldLabel>DAY NOTES</FieldLabel>
						<Textarea
							{...field}
							placeholder="General notes for this training day..."
							rows={3}
							className="bg-card text-foreground border-border resize-none"
							aria-invalid={fieldState.invalid}
						/>
						{fieldState.invalid && <FieldError errors={[fieldState.error]} />}
					</Field>
				)}
			/>
		</div>
	);
}
