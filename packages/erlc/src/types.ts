import { z } from "zod";

const locationSchema = z
  .object({
    LocationX: z.number(),
    LocationZ: z.number(),
    PostalCode: z.string(),
    StreetName: z.string(),
    BuildingNumber: z.string(),
  })
  .passthrough();

export const erlcPlayerSchema = z
  .object({
    Team: z.string(),
    Player: z.string(),
    Callsign: z.string().optional(),
    Location: locationSchema.optional(),
    Permission: z.string().optional(),
    WantedStars: z.number().optional(),
  })
  .passthrough();

const joinLogSchema = z
  .object({ Join: z.boolean(), Timestamp: z.number(), Player: z.string() })
  .passthrough();
const killLogSchema = z
  .object({ Killed: z.string(), Timestamp: z.number(), Killer: z.string() })
  .passthrough();
const commandLogSchema = z
  .object({ Player: z.string(), Timestamp: z.number(), Command: z.string() })
  .passthrough();
const modCallSchema = z
  .object({ Caller: z.string(), Moderator: z.string(), Timestamp: z.number() })
  .passthrough();
const emergencyCallSchema = z
  .object({
    Team: z.string(),
    Caller: z.number(),
    Players: z.array(z.unknown()),
    Position: z.tuple([z.number(), z.number()]),
    StartedAt: z.number(),
    CallNumber: z.number(),
    Description: z.string(),
    PositionDescriptor: z.string(),
  })
  .passthrough();
const vehicleSchema = z
  .object({
    Name: z.string(),
    Owner: z.string(),
    Plate: z.string(),
    Texture: z.string(),
    ColorHex: z.string(),
    ColorName: z.string(),
  })
  .passthrough();
const staffSchema = z
  .object({
    Admins: z.record(z.string(), z.string()).optional(),
    Mods: z.union([z.record(z.string(), z.string()), z.array(z.unknown())]).optional(),
    Helpers: z.record(z.string(), z.string()).optional(),
  })
  .passthrough();

export const erlcServerInfoSchema = z
  .object({
    Name: z.string(),
    OwnerId: z.number(),
    CoOwnerIds: z.array(z.number()),
    CurrentPlayers: z.number().int().nonnegative(),
    MaxPlayers: z.number().int().nonnegative(),
    JoinKey: z.string(),
    AccVerifiedReq: z.string(),
    TeamBalance: z.boolean(),
    Players: z.array(erlcPlayerSchema).optional(),
    Staff: staffSchema.optional(),
    JoinLogs: z.array(joinLogSchema).optional(),
    Queue: z.array(z.number()).optional(),
    KillLogs: z.array(killLogSchema).optional(),
    CommandLogs: z.array(commandLogSchema).optional(),
    ModCalls: z.array(modCallSchema).optional(),
    EmergencyCalls: z.array(emergencyCallSchema).optional(),
    Vehicles: z.array(vehicleSchema).optional(),
  })
  .passthrough();

export type ErlcPlayer = z.infer<typeof erlcPlayerSchema>;
export type ErlcServerInfo = z.infer<typeof erlcServerInfoSchema>;

export const serverInfoOptionsSchema = z.object({
  Players: z.boolean().optional(),
  Staff: z.boolean().optional(),
  JoinLogs: z.boolean().optional(),
  Queue: z.boolean().optional(),
  KillLogs: z.boolean().optional(),
  CommandLogs: z.boolean().optional(),
  ModCalls: z.boolean().optional(),
  EmergencyCalls: z.boolean().optional(),
  Vehicles: z.boolean().optional(),
});

export type ServerInfoOptions = z.infer<typeof serverInfoOptionsSchema>;

export const erlcServerCommandResponseSchema = z
  .object({
    message: z.string().optional(),
    commandId: z.string().optional(),
  })
  .passthrough();

export type ErlcServerCommandResponse = z.infer<typeof erlcServerCommandResponseSchema>;
