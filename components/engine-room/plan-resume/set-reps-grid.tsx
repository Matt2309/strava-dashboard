interface Rep {
    id: string;
    setNumber: number;
    targetReps: string | null;
    targetRpe: number | null;
    weight: number | null;
    machineType: string | null;
}

interface SetsRepsListProps {
    reps: Rep[];
    restTime?: string;
}

export function SetsRepsGrid({ reps, restTime }: SetsRepsListProps) {
    if (!reps || reps.length === 0) {
        return (
            <p className="italic text-muted-foreground text-sm">
                No sets configured
            </p>
        );
    }

    const totalSets = reps.length;
    // Sets can carry different target reps (e.g. a pyramid scheme); join the
    // distinct values instead of only ever reading the first set.
    const distinctReps = Array.from(
        new Set(reps.map((rep) => rep.targetReps).filter(Boolean)),
    );
    const targetReps = distinctReps.length > 0 ? distinctReps.join(" / ") : "—";
    const weight = reps[0].weight || "—";
    const machineType = reps[0].machineType || "Free Weight";

    return (
        <div className="grid grid-cols-2 gap-y-6 gap-x-6">
            {/* SETS */}
            <div className="flex flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Sets
        </span>
                <span className="text-3xl font-bold">{totalSets}</span>
            </div>

            {/* REPS */}
            <div className="flex flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Reps
        </span>
                <span className="text-3xl font-bold">{targetReps}</span>
            </div>

            {/* TARGET (WEIGHT) */}
            <div className="flex flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Target
        </span>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{weight}</span>
                    {weight !== "—" && (
                        <span className="text-sm font-semibold text-muted-foreground uppercase">
              kg
            </span>
                    )}
                </div>
            </div>

            {/* TYPE */}
            <div className="flex flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Type
        </span>
                <span className="text-lg font-semibold">{machineType}</span>
            </div>

            {/* REST */}
            {restTime && (
                <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Rest
            </span>
                    <span className="text-lg font-semibold">{restTime}</span>
                </div>
            )}
        </div>
    );
}