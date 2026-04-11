import { prisma } from "../lib/prisma";

const muscleGroups = [
	{ name: "Chest" },
	{ name: "Back" },
	{ name: "Shoulders" },
	{ name: "Arms (Biceps)" },
	{ name: "Arms (Triceps)" },
	{ name: "Forearms" },
	{ name: "Legs (Quadriceps)" },
	{ name: "Legs (Hamstrings)" },
	{ name: "Legs (Glutes)" },
	{ name: "Legs (Calves)" },
	{ name: "Core/Abs" },
];

const exercises = [
	{
		nameEng: "Barbell Bench Press",
		nameIta: "Panca Piana",
		muscleGroup: "Chest",
	},
	{
		nameEng: "Dumbbell Bench Press",
		nameIta: "Panca Manubri",
		muscleGroup: "Chest",
	},
	{
		nameEng: "Incline Dumbbell Press",
		nameIta: "Panca Inclinata Manubri",
		muscleGroup: "Chest",
	},
	{ nameEng: "Cable Chest Fly", nameIta: "Fly su Cavi", muscleGroup: "Chest" },
	{ nameEng: "Push-ups", nameIta: "Flessioni", muscleGroup: "Chest" },
	{
		nameEng: "Barbell Deadlift",
		nameIta: "Stacco da Terra",
		muscleGroup: "Back",
	},
	{
		nameEng: "Barbell Rows",
		nameIta: "Rematore Bilanciere",
		muscleGroup: "Back",
	},
	{
		nameEng: "Dumbbell Rows",
		nameIta: "Rematore Manubrio",
		muscleGroup: "Back",
	},
	{ nameEng: "Lat Pulldown", nameIta: "Lat Machine", muscleGroup: "Back" },
	{ nameEng: "Pull-ups", nameIta: "Trazioni", muscleGroup: "Back" },
	{
		nameEng: "Assisted Pull-ups",
		nameIta: "Trazioni Assistite",
		muscleGroup: "Back",
	},
	{
		nameEng: "Military Press",
		nameIta: "Lento in Piedi",
		muscleGroup: "Shoulders",
	},
	{
		nameEng: "Dumbbell Shoulder Press",
		nameIta: "Lento Manubri",
		muscleGroup: "Shoulders",
	},
	{
		nameEng: "Lateral Raise",
		nameIta: "Alzate Laterali",
		muscleGroup: "Shoulders",
	},
	{
		nameEng: "Cable Lateral Raise",
		nameIta: "Alzate Laterali su Cavi",
		muscleGroup: "Shoulders",
	},
	{ nameEng: "Reverse Fly", nameIta: "Reverse Fly", muscleGroup: "Shoulders" },
	{
		nameEng: "Barbell Curl",
		nameIta: "Curl Bilanciere",
		muscleGroup: "Arms (Biceps)",
	},
	{
		nameEng: "Dumbbell Curl",
		nameIta: "Curl Manubri",
		muscleGroup: "Arms (Biceps)",
	},
	{
		nameEng: "Cable Curl",
		nameIta: "Curl su Cavi",
		muscleGroup: "Arms (Biceps)",
	},
	{
		nameEng: "EZ Bar Curl",
		nameIta: "Curl EZ Bar",
		muscleGroup: "Arms (Biceps)",
	},
	{
		nameEng: "Tricep Dips",
		nameIta: "Dip su Panca",
		muscleGroup: "Arms (Triceps)",
	},
	{
		nameEng: "Tricep Rope Pushdown",
		nameIta: "Pushdown su Cavi",
		muscleGroup: "Arms (Triceps)",
	},
	{
		nameEng: "Overhead Extension",
		nameIta: "Estensione Sopra la Testa",
		muscleGroup: "Arms (Triceps)",
	},
	{
		nameEng: "Close Grip Bench Press",
		nameIta: "Panca Presa Stretta",
		muscleGroup: "Arms (Triceps)",
	},
	{
		nameEng: "Back Squat",
		nameIta: "Squat Bilanciere",
		muscleGroup: "Legs (Quadriceps)",
	},
	{
		nameEng: "Leg Press",
		nameIta: "Leg Press",
		muscleGroup: "Legs (Quadriceps)",
	},
	{
		nameEng: "Leg Extension",
		nameIta: "Leg Extension",
		muscleGroup: "Legs (Quadriceps)",
	},
	{
		nameEng: "Front Squat",
		nameIta: "Front Squat",
		muscleGroup: "Legs (Quadriceps)",
	},
	{
		nameEng: "Leg Curl",
		nameIta: "Leg Curl",
		muscleGroup: "Legs (Hamstrings)",
	},
	{
		nameEng: "Romanian Deadlift",
		nameIta: "Stacco Rumeno",
		muscleGroup: "Legs (Hamstrings)",
	},
	{
		nameEng: "Nordic Hamstring Curl",
		nameIta: "Nordic Curl",
		muscleGroup: "Legs (Hamstrings)",
	},
	{
		nameEng: "Bulgarian Split Squat",
		nameIta: "Bulgarian Squat",
		muscleGroup: "Legs (Glutes)",
	},
	{
		nameEng: "Hip Thrust",
		nameIta: "Hip Thrust",
		muscleGroup: "Legs (Glutes)",
	},
	{
		nameEng: "Machine Hack Squat",
		nameIta: "Hack Squat",
		muscleGroup: "Legs (Glutes)",
	},
	{
		nameEng: "Standing Calf Raise",
		nameIta: "Calf Raise in Piedi",
		muscleGroup: "Legs (Calves)",
	},
	{
		nameEng: "Seated Calf Raise",
		nameIta: "Calf Raise Seduto",
		muscleGroup: "Legs (Calves)",
	},
	{
		nameEng: "Barbell Ab Wheel",
		nameIta: "Wheel Addominale",
		muscleGroup: "Core/Abs",
	},
	{
		nameEng: "Cable Woodchop",
		nameIta: "Woodchop su Cavi",
		muscleGroup: "Core/Abs",
	},
	{
		nameEng: "Hanging Leg Raise",
		nameIta: "Sollevamento Gambe in Sospensione",
		muscleGroup: "Core/Abs",
	},
];

async function main() {
	console.log("Seeding database...");

	await prisma.muscleGroup.deleteMany({});

	for (const group of muscleGroups) {
		await prisma.muscleGroup.create({ data: group });
	}
	console.log("Muscle groups created");

	const allGroups = await prisma.muscleGroup.findMany();
	const groupMap = new Map(allGroups.map((g) => [g.name, g.id]));

	for (const exercise of exercises) {
		const groupId = groupMap.get(exercise.muscleGroup);
		if (groupId) {
			await prisma.exercise.create({
				data: {
					nameEng: exercise.nameEng,
					nameIta: exercise.nameIta,
					muscleGroupId: groupId,
					photoUrl: "https://via.placeholder.com/400x300",
				},
			});
		}
	}
	console.log("Exercises created");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
