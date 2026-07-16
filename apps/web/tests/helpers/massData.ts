import { validateMassPayload, type MassPayload } from "@formulam/mass-data";
import masses from "@formulam/mass-data/masses.json";

const payload: unknown = masses;
validateMassPayload(payload);

export const massPayload: MassPayload = payload;
