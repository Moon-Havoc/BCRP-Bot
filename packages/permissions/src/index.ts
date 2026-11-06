export type PermissionKey =
  | `guild.${string}`
  | `staff.${string}`
  | `department.${string}`
  | `rank.${string}`
  | `dashboard.${string}`;

export interface PermissionContext {
  guildId: string;
  discordPermissions: readonly string[];
  guildPermissions: readonly PermissionKey[];
  staffPermissions: readonly PermissionKey[];
  departmentPermissions: readonly PermissionKey[];
  rankPermissions: readonly PermissionKey[];
  dashboardPermissions: readonly PermissionKey[];
  isGuildOwner?: boolean;
}

export interface PermissionRequirement {
  anyOf?: readonly PermissionKey[];
  allOf?: readonly PermissionKey[];
  discordAllOf?: readonly string[];
  allowGuildOwner?: boolean;
}

export function hasPermission(
  context: PermissionContext,
  requirement: PermissionRequirement,
): boolean {
  if (requirement.allowGuildOwner !== false && context.isGuildOwner) return true;

  const granted = new Set<PermissionKey>([
    ...context.guildPermissions,
    ...context.staffPermissions,
    ...context.departmentPermissions,
    ...context.rankPermissions,
    ...context.dashboardPermissions,
  ]);

  const hasAll = (requirement.allOf ?? []).every((permission) => granted.has(permission));
  const hasAny =
    requirement.anyOf === undefined ||
    requirement.anyOf.length === 0 ||
    requirement.anyOf.some((permission) => granted.has(permission));
  const hasDiscord =
    context.discordPermissions.includes("Administrator") ||
    (requirement.discordAllOf ?? []).every((permission) =>
      context.discordPermissions.includes(permission),
    );

  return hasAll && hasAny && hasDiscord;
}

export function createEmptyPermissionContext(guildId: string): PermissionContext {
  return {
    guildId,
    discordPermissions: [],
    guildPermissions: [],
    staffPermissions: [],
    departmentPermissions: [],
    rankPermissions: [],
    dashboardPermissions: [],
  };
}

export class PermissionDeniedError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "PermissionDeniedError";
  }
}

export function assertPermission(
  context: PermissionContext,
  requirement: PermissionRequirement,
): void {
  if (!hasPermission(context, requirement)) throw new PermissionDeniedError();
}
