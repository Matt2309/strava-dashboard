"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import DayContent from "@/components/forms/create-plan/day-content";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useCreatePlan, useUpdatePlan } from "@/hooks/use-engine-room";
import { ROUTES } from "@/lib/routes";
import {
	type PlanFormInput,
	type PlanFormOutput,
	planFormSchema,
	toCreatePlanInput,
	toUpdatePlanInput,
} from "@/lib/schemas/engine-room.schema";

const EMPTY_DEFAULTS: PlanFormInput = {
	name: "",
	type: "",
	durationWeeks: 12,
	days: Array.from({ length: 1 }, (_, i) => ({
		name: `DAY ${i + 1}`,
		order: i + 1,
		notes: "",
		exercises: [],
	})),
};

/** yyyy-mm-dd, what a native <input type="date"> expects/emits. */
function toDateInputValue(date: Date): string {
	const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
	return local.toISOString().slice(0, 10);
}

interface CreateProgramFormProps {
	mode?: "create" | "edit";
	/** Required when mode === "edit". */
	planId?: string;
	/** Prefilled values for edit mode — see planToFormValues. */
	defaultValues?: PlanFormInput;
}

export function CreateProgramForm({
	mode = "create",
	planId,
	defaultValues,
}: CreateProgramFormProps) {
	const isEdit = mode === "edit" && !!planId;
	const [activeDay, setActiveDay] = useState(0);
	const createMutation = useCreatePlan();
	const updateMutation = useUpdatePlan();
	const router = useRouter();

	const form = useForm<PlanFormInput, any, PlanFormOutput>({
		resolver: zodResolver(planFormSchema),
		defaultValues: defaultValues ?? EMPTY_DEFAULTS,
	});

	const dayFields = useFieldArray({
		control: form.control,
		name: "days",
	});

	async function onSubmit(data: PlanFormOutput) {
		if (isEdit && planId) {
			const payload = toUpdatePlanInput(planId, data);
			await updateMutation.mutateAsync(payload, {
				onSuccess() {
					toast.success("Plan updated");
					router.push(ROUTES["plan-detail"].build(planId));
					router.refresh();
				},
				onError(error) {
					toast.error(`Error updating plan: ${error}`);
				},
			});
			return;
		}

		// Create mode only: expand the DURATION/WEEKS convenience input into an
		// actual expiryDate. Edit mode edits expiryDate directly instead (see
		// the header field below) — re-deriving it from durationWeeks on every
		// save would push the expiry forward each time the plan is edited.
		let calculatedExpiryDate: Date | null = null;
		if (data.durationWeeks) {
			const today = new Date();
			today.setDate(today.getDate() + data.durationWeeks * 7);
			calculatedExpiryDate = today;
		}

		const payload = toCreatePlanInput({
			...data,
			expiryDate: calculatedExpiryDate,
		});

		await createMutation.mutateAsync(payload, {
			onSuccess() {
				toast.success("Plan created successfully");
				router.push(ROUTES["engine-room"].path);
			},
			onError(error) {
				toast.error(`Error creating plan: ${error}`);
			},
		});
	}

	function onCancel() {
		if (isEdit && planId) {
			router.push(ROUTES["plan-detail"].build(planId));
			return;
		}
		setActiveDay(0);
		form.reset();
	}

	const addNewDay = () => {
		const newDayNumber = dayFields.fields.length + 1;
		dayFields.append({
			name: `DAY ${newDayNumber}`,
			order: newDayNumber,
			notes: "",
			exercises: [],
		});
		setActiveDay(dayFields.fields.length); // length already points at the new index
	};

	const removeDay = (index: number) => {
		if (dayFields.fields.length <= 1) return;

		const day = form.getValues(`days.${index}`);
		if (
			day.dbId &&
			!window.confirm(
				"Delete this day? Workout sessions already logged against it will keep their history but lose their link to this day.",
			)
		) {
			return;
		}

		const remainingCount = dayFields.fields.length - 1;
		dayFields.remove(index);
		setActiveDay((current) =>
			Math.max(0, Math.min(current, remainingCount - 1)),
		);
	};

	const isPending = createMutation.isPending || updateMutation.isPending;

	return (
		<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
			{/* Program Basics */}
			<div className="grid grid-cols-3 gap-4">
				<div className="col-span-2">
					<Controller
						name="name"
						control={form.control}
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor="program-name">PROGRAM NAME</FieldLabel>
								<Input
									{...field}
									id="program-name"
									placeholder="Hypertrophy Protocol Alpha"
									className="bg-card text-foreground border-border"
									aria-invalid={fieldState.invalid}
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
				</div>

				<div className="col-span-2">
					<Controller
						name="type"
						control={form.control}
						render={({ field, fieldState }) => (
							<Field data-invalid={fieldState.invalid}>
								<FieldLabel htmlFor="program-type">PROGRAM TYPE</FieldLabel>
								<Input
									{...field}
									id="program-type"
									placeholder="Gym"
									className="bg-card text-foreground border-border"
									aria-invalid={fieldState.invalid}
								/>
								{fieldState.invalid && (
									<FieldError errors={[fieldState.error]} />
								)}
							</Field>
						)}
					/>
				</div>

				<div>
					{isEdit ? (
						<Controller
							name="expiryDate"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor="program-expiry">EXPIRY DATE</FieldLabel>
									<Input
										id="program-expiry"
										type="date"
										value={field.value ? toDateInputValue(field.value) : ""}
										onChange={(e) =>
											field.onChange(
												e.target.value ? new Date(e.target.value) : null,
											)
										}
										onBlur={field.onBlur}
										className="bg-card text-foreground border-border"
										aria-invalid={fieldState.invalid}
									/>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
					) : (
						<Controller
							name="durationWeeks"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor="program-duration">DURATION</FieldLabel>
									<div className="flex gap-2">
										<Input
											{...field}
											value={field.value as string | number | undefined}
											id="program-duration"
											placeholder="12"
											className="bg-card text-foreground border-border flex-1"
											aria-invalid={fieldState.invalid}
										/>
										<div className="flex items-end justify-center px-3 py-2 bg-card border border-border rounded-md text-sm font-medium text-foreground">
											WEEKS
										</div>
									</div>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
					)}
				</div>
			</div>

			{/* Day Tabs */}
			<div className="flex flex-wrap gap-2 pb-4 border-b border-border">
				{dayFields.fields.map((day, index) => (
					<div key={day.id} className="relative">
						<button
							type="button"
							onClick={() => setActiveDay(index)}
							className={`px-4 py-2 rounded-md font-semibold transition-colors ${
								activeDay === index
									? "bg-foreground text-background"
									: "bg-card text-foreground border border-border hover:bg-muted"
							}`}
						>
							{day.name}
						</button>
						{dayFields.fields.length > 1 && (
							<button
								type="button"
								onClick={() => removeDay(index)}
								aria-label={`Remove ${day.name}`}
								className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground leading-none"
							>
								✕
							</button>
						)}
					</div>
				))}
				<button
					type="button"
					onClick={addNewDay}
					className="px-3 py-2 rounded-md bg-card text-foreground border border-border hover:bg-muted transition-colors flex items-center gap-2"
				>
					<Plus className="w-4 h-4" />
				</button>
			</div>

			{dayFields.fields.map(
				(day, index) =>
					activeDay === index && (
						<DayContent
							key={day.id}
							control={form.control}
							dayIndex={index}
							dayName={day.name}
						/>
					),
			)}

			{/* Footer */}
			<div className="flex gap-3 pt-6 border-t border-border">
				<Button type="button" variant="outline" onClick={onCancel}>
					Cancel
				</Button>
				<Button type="submit" className="ml-auto" disabled={isPending}>
					{isPending
						? "Saving..."
						: isEdit
							? "Save Changes"
							: "Publish Program"}
				</Button>
			</div>
		</form>
	);
}
