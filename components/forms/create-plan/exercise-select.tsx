"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useGetExercises } from "@/hooks/use-engine-room";
import type { ExerciseResponse } from "@/lib/schemas/engine-room.schema";
import { useDebounce } from "@/lib/utils";

interface ExerciseSelectProps {
    value: string;
    onChange: (value: string) => void;
    onBlur?: () => void;
    placeholder?: string;
    error?: { message?: string };
    invalid?: boolean;
}

const getDisplayName = (exercise?: ExerciseResponse) => {
    if (!exercise) return "";
    return exercise.nameIta || exercise.nameEng || "";
};

export default function ExerciseSelect({
                                           value,
                                           onChange,
                                           onBlur,
                                           placeholder = "Search exercise...",
                                           error,
                                           invalid,
                                       }: ExerciseSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const debouncedSearch = useDebounce(inputValue, 500);

    const { data: exercises = [], isLoading } = useGetExercises(undefined, {
        enabled: isOpen || debouncedSearch.length > 0,
        search: debouncedSearch,
    });

    const isValueInCurrentList = exercises.some((e) => e.id === value);
    const { data: fallbackExercises = [] } = useGetExercises(undefined, {
        enabled: !!value && !isValueInCurrentList,
        search: "",
    });

    const selectedExerciseName = useMemo(() => {
        if (!value) return "";
        const selected = exercises.find((e) => e.id === value) || fallbackExercises.find((e) => e.id === value);
        return getDisplayName(selected);
    }, [exercises, fallbackExercises, value]);

    useEffect(() => {
        if (!isOpen) {
            setInputValue(selectedExerciseName);
        }
    }, [isOpen, selectedExerciseName]);

    const handleSelectExercise = (exerciseId: string) => {
        onChange(exerciseId);
        setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newInputValue = e.target.value;
        setInputValue(newInputValue);
        setIsOpen(true);

        if (value && newInputValue !== selectedExerciseName) {
            onChange("");
        }
    };

    const handleBlur = () => {
        setIsOpen(false);
        onBlur?.();
    };

    return (
        <Field data-invalid={invalid}>
            <FieldLabel className="text-xs">EXERCISE NAME</FieldLabel>

            <div className="relative">
                <div className="relative">
                    <Input
                        role="combobox"
                        aria-expanded={isOpen}
                        aria-haspopup="listbox"
                        aria-controls="exercise-listbox"
                        aria-invalid={invalid}
                        value={inputValue}
                        onChange={handleInputChange}
                        onFocus={() => setIsOpen(true)}
                        onBlur={handleBlur}
                        placeholder={placeholder}
                        className="bg-input text-foreground border-border pr-8"
                    />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>

                {isOpen && (
                    <div
                        className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto"
                    >
                        {isLoading ? (
                            <div className="p-3 text-sm text-muted-foreground text-center">
                                Loading exercises...
                            </div>
                        ) : exercises.length === 0 ? (
                            <div className="p-3 text-sm text-muted-foreground text-center">
                                No exercises found
                            </div>
                        ) : (
                            <div id="exercise-listbox" role="listbox" className="py-1">
                                {exercises.map((exercise) => {
                                    const isSelected = value === exercise.id;
                                    return (
                                        <div
                                            key={exercise.id}
                                            role="option"
                                            aria-selected={isSelected}
                                            tabIndex={0}
                                            onMouseDown={(e) => {
                                                // Prevent input blur before click registers
                                                e.preventDefault();
                                            }}
                                            onClick={() => handleSelectExercise(exercise.id)}
                                            onKeyDown={(e) => {
                                                // Allow keyboard selection when navigating options
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    handleSelectExercise(exercise.id);
                                                }
                                            }}
                                            className={`w-full px-3 py-2 text-left text-sm cursor-pointer hover:bg-muted transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                                                isSelected
                                                    ? "bg-muted text-foreground font-semibold"
                                                    : "text-foreground"
                                            }`}
                                        >
                                            {getDisplayName(exercise)}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {invalid && error && <FieldError errors={[error]} />}
        </Field>
    );
}