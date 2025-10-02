import { z } from 'zod';
import { EBackHand, EMainHand } from './player.enum';

const PlayerDetailsSchema = z.object({
  country: z.string(),
  height: z.string().optional().or(z.null()),
  startOfTheRanking: z.number().int().nonnegative().optional().or(z.null()),
  socialNetwork: z.string().url().optional().or(z.string().length(0)).or(z.null()),
  mainHand: z.nativeEnum(EMainHand).or(z.null()),
  backHand: z.nativeEnum(EBackHand).or(z.null()),
})

const PlayerGamesSchema = z.object({
  roundId: z.number().int().nonnegative(), // Por rodada
  victories: z.number().int().nonnegative(),
  defeats: z.number().int().nonnegative(),
  gamesAgainst: z.number().int().nonnegative(),
  gamesInFavor: z.number().int().nonnegative(),
  scoreBalance: z.number().int(), // Será o valor de games a favor menos o valor de games contra
  points: z.number().int().nonnegative()
});

const MatchSchema = z.object({
  id: z.string(),
  player1Id: z.string(),
  score1Id: z.number().int().nonnegative(),
  player2Id: z.string(),
  score2Id: z.number().int().nonnegative(),
  winnerId: z.string() // Quem tiver o score maior
})

const PlayerResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  games: PlayerGamesSchema,
  details: PlayerDetailsSchema,
  groupId: z.string(),
  avatarUrl: z.string()
});

// const PlayerSimpleDataSchema = z.object({
//   name: z.string().min(1, "Nome é obrigatório"),
//   email: z.string().email("E-mail inválido")
// });

const PlayerCreatedResponseSchema = z.object({
  id: z.string(),
  email: z.string(),
  games: PlayerGamesSchema
});

// Se for um novo usuário, atualiza o nome do jogador com o registrado do google
const PlayerCreatedPayloadSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email()
});

const UpdatePlayerPayloadSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Nome é obrigatório"),
  details: PlayerDetailsSchema,
  avatarUrl: z.string()
});

export {
PlayerResponseSchema,
PlayerCreatedResponseSchema,
PlayerCreatedPayloadSchema,
UpdatePlayerPayloadSchema,
MatchSchema
};