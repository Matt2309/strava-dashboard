-- Baseline migration: the "Engine Room" tables (workout plans, exercises,
-- sets, session logging) were previously applied to every environment via
-- `prisma db push` instead of a tracked migration. This migration captures
-- that already-applied state so migration history matches every real
-- database; it is marked as already applied via `prisma migrate resolve
-- --applied` on any environment where these tables already exist, and
-- applies normally (creating the tables) on a fresh database.

-- CreateTable
CREATE TABLE "public"."exercise_reps" (
    "id" TEXT NOT NULL,
    "userExerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "targetReps" TEXT,
    "targetRpe" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "machineType" TEXT,

    CONSTRAINT "exercise_reps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."exercises" (
    "id" TEXT NOT NULL,
    "muscleGroupId" TEXT NOT NULL,
    "externalId" TEXT,
    "nameEng" TEXT NOT NULL,
    "nameIta" TEXT,
    "photoUrl" TEXT,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."muscle_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "muscle_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session_exercises" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userExerciseId" TEXT,
    "exerciseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "session_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session_sets" (
    "id" TEXT NOT NULL,
    "sessionExerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION,
    "rpe" DOUBLE PRECISION,
    "machineType" TEXT,

    CONSTRAINT "session_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_exercises" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "alternativeExerciseId" TEXT,
    "order" INTEGER NOT NULL,
    "restTime" INTEGER,
    "supersetId" TEXT,
    "supersetOrder" INTEGER,
    "coachNotes" TEXT,
    "personalNotes" TEXT,
    "equipmentSetting1" TEXT,
    "equipmentSetting2" TEXT,

    CONSTRAINT "user_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_workout_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_workout_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workout_days" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "workout_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."workout_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "sessionNotes" TEXT,

    CONSTRAINT "workout_sessions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."exercise_reps" ADD CONSTRAINT "exercise_reps_userExerciseId_fkey" FOREIGN KEY ("userExerciseId") REFERENCES "public"."user_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."exercises" ADD CONSTRAINT "exercises_muscleGroupId_fkey" FOREIGN KEY ("muscleGroupId") REFERENCES "public"."muscle_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_exercises" ADD CONSTRAINT "session_exercises_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "public"."exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_exercises" ADD CONSTRAINT "session_exercises_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."workout_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_exercises" ADD CONSTRAINT "session_exercises_userExerciseId_fkey" FOREIGN KEY ("userExerciseId") REFERENCES "public"."user_exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session_sets" ADD CONSTRAINT "session_sets_sessionExerciseId_fkey" FOREIGN KEY ("sessionExerciseId") REFERENCES "public"."session_exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_exercises" ADD CONSTRAINT "user_exercises_alternativeExerciseId_fkey" FOREIGN KEY ("alternativeExerciseId") REFERENCES "public"."exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_exercises" ADD CONSTRAINT "user_exercises_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "public"."workout_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_exercises" ADD CONSTRAINT "user_exercises_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "public"."exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_workout_plans" ADD CONSTRAINT "user_workout_plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workout_days" ADD CONSTRAINT "workout_days_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."user_workout_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workout_sessions" ADD CONSTRAINT "workout_sessions_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "public"."workout_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."workout_sessions" ADD CONSTRAINT "workout_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
