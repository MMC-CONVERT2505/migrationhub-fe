/**
 * Position of "Connect Source" in the migration tool's own 9-step journey. The tool still
 * counts its steps this way, so this number is passed to it as the `journeyStep` query
 * param on handoff (see PaymentSuccessPage) and must not change with the 4-step stepper
 * shown in this app (see constants/migrationFlow).
 */
export const HANDOFF_STEP = 6;
