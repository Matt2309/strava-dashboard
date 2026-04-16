"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	type CreatePlanInput,
	type CreatePlanOutput,
	createPlanSchema,
} from "@/lib/schemas/engine-room.schema";
import DayContent from "@/components/forms/create-plan/day-content";
import {useCreatePlan} from "@/hooks/use-engine-room";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import {ROUTES} from "@/lib/routes";

export function CreateProgramForm() {
	const [activeDay, setActiveDay] = useState(0);
	const [dayCount, setDayCount] = useState(1);
    const mutation = useCreatePlan();
    const router = useRouter();

	const form = useForm<CreatePlanInput, any, CreatePlanOutput>({
		resolver: zodResolver(createPlanSchema),
		defaultValues: {
			name: "",
			type: "",
			durationWeeks: 12,
			days: Array.from({ length: 1 }, (_, i) => ({
				name: `DAY ${i + 1}`,
				order: i + 1,
				notes: "",
				exercises: [],
			})),
		},
	});

	const dayFields = useFieldArray({
		control: form.control,
		name: "days",
	});

    async function onSubmit(data: CreatePlanOutput) {
        //expiry date
        let calculatedExpiryDate = null;

        if (data.durationWeeks) {
            const today = new Date();
            const daysToAdd = data.durationWeeks * 7;

            today.setDate(today.getDate() + daysToAdd);
            calculatedExpiryDate = today;
        }

        // 3. Prepariamo il payload pulito per il backend
        const finalPayload: CreatePlanOutput = {
            ...data,
            expiryDate: calculatedExpiryDate,
        };


        await mutation.mutateAsync(
            finalPayload,
            {
                onSuccess() {
                    toast.success(
                        `Plan created succefully`,
                    );
                    router.push(ROUTES["engine-room"].path)
                },
                onError(error) {
                    toast.error(
                        `Error creating plan: ${error}`,
                    );
                },
            },
        );
	}

	function onReset() {
		setActiveDay(0);
		setDayCount(1);
		form.reset();
	}

	const addNewDay = () => {
		const newDayNumber = dayCount + 1;
		dayFields.append({
			name: `DAY ${newDayNumber}`,
			order: newDayNumber,
			notes: "",
			exercises: [],
		});
		setDayCount(newDayNumber);
		setActiveDay(dayFields.fields.length); // length punta correttamente al nuovo indice generato
	};

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
                </div>
            </div>

            {/* Day Tabs */}
            <div className="flex gap-2 pb-4 border-b border-border">
                {dayFields.fields.map((day, index) => (
                    <button
                        key={day.id}
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
                <Button type="button" variant="outline" onClick={onReset}>
                    Cancel
                </Button>
                <Button type="submit" className="ml-auto">
                    Publish Program
                </Button>
            </div>
        </form>
	);
}
