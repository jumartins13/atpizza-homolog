import { z } from "zod";
import { PlayerCreatedPayloadSchema, PlayerCreatedResponseSchema, PlayerResponseSchema, UpdatePlayerPayloadSchema } from "./player.schema";

export type PlayerResponse = z.infer<typeof PlayerResponseSchema>;
export type PlayersResponse = PlayerResponse[];

export type PlayerCreatedResponse = z.infer<typeof PlayerCreatedResponseSchema>;
export type PlayerCreatedPayload = z.infer<typeof PlayerCreatedPayloadSchema>;

export type UpdatePlayerPayload = z.infer<typeof UpdatePlayerPayloadSchema>;