-- CreateEnum
CREATE TYPE "FunctionalType" AS ENUM ('ROAD_SHOE', 'TRACK_SHOE', 'SPIKES_PINS', 'BIKE', 'OTHER');

-- CreateEnum
CREATE TYPE "DeviceType" AS ENUM ('SMARTWATCH', 'PHONE', 'HR_MONITOR');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "privacyConsentTimestamp" TIMESTAMP(3),
    "acceptedPolicyId" TEXT,
    "privacyPolicyId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gear_functionals" (
    "id" TEXT NOT NULL,
    "stravaId" TEXT,
    "name" TEXT NOT NULL,
    "type" "FunctionalType" NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "gear_functionals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gear_devices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "DeviceType" NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "gear_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "stravaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "movingTime" INTEGER NOT NULL,
    "elapsedTime" INTEGER NOT NULL,
    "totalElevationGain" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "sportType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "averageHeartrate" DOUBLE PRECISION,
    "sufferScore" DOUBLE PRECISION,
    "rawJson" JSONB,
    "isPurged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "functionalId" TEXT,
    "deviceId" TEXT,
    "spikesId" TEXT,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_statistics" (
    "id" TEXT NOT NULL,
    "sport_name" TEXT NOT NULL,
    "terrain_type" TEXT NOT NULL,
    "total_distance_km" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_time_min" INTEGER NOT NULL DEFAULT 0,
    "total_elevation_m" INTEGER NOT NULL DEFAULT 0,
    "sessions_count" INTEGER NOT NULL DEFAULT 0,
    "max_distance_km" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "max_elevation_m" INTEGER NOT NULL DEFAULT 0,
    "last_activity_date" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "user_statistics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacyPolicy" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrivacyPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "gear_functionals_stravaId_key" ON "gear_functionals"("stravaId");

-- CreateIndex
CREATE UNIQUE INDEX "activities_stravaId_key" ON "activities"("stravaId");

-- CreateIndex
CREATE UNIQUE INDEX "user_statistics_userId_sport_name_terrain_type_key" ON "user_statistics"("userId", "sport_name", "terrain_type");

-- CreateIndex
CREATE UNIQUE INDEX "PrivacyPolicy_version_key" ON "PrivacyPolicy"("version");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_acceptedPolicyId_fkey" FOREIGN KEY ("acceptedPolicyId") REFERENCES "PrivacyPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_privacyPolicyId_fkey" FOREIGN KEY ("privacyPolicyId") REFERENCES "PrivacyPolicy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gear_functionals" ADD CONSTRAINT "gear_functionals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gear_functionals" ADD CONSTRAINT "gear_functionals_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "gear_functionals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gear_devices" ADD CONSTRAINT "gear_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_functionalId_fkey" FOREIGN KEY ("functionalId") REFERENCES "gear_functionals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "gear_devices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_spikesId_fkey" FOREIGN KEY ("spikesId") REFERENCES "gear_functionals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_statistics" ADD CONSTRAINT "user_statistics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
