export interface TournamentPrizeConfiguration {
  guaranteedPoints: number;
  entriesThreshold: number;
  additionalPointsPerEntry: number;
  // Array order defines TOP 1, TOP 2, ...; rank IDs cannot become duplicated.
  positions: { percentage: number }[];
}
