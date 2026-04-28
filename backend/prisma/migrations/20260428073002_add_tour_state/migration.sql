-- CreateTable
CREATE TABLE "tour_states" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "hasCompletedTour" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "xpAwarded" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tour_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tour_states_userId_key" ON "tour_states"("userId");
