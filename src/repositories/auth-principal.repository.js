import sql from "../config/database.js";

export const findActiveAssignment = async (issuer, subject) => {
  const result = await sql`
    select
      actor_type,
      installation_id,
      jurisdiction_level,
      jurisdiction_id,
      can_write_weather,
      permissions
    from public.auth_principal_assignments
    where issuer = ${issuer}
      and subject = ${subject}
      and is_active = true
    limit 1
  `;

  const assignment = result[0];
  if (!assignment) return null;

  return {
    actorType: assignment.actor_type,
    installationId: assignment.installation_id,
    jurisdiction: assignment.jurisdiction_level
      ? {
          level: assignment.jurisdiction_level,
          ...(assignment.jurisdiction_id
            ? { id: assignment.jurisdiction_id }
            : {})
        }
      : undefined,
    scopes: [...(assignment.permissions || []), ...(assignment.can_write_weather ? ["weather:write"] : [])]
  };
};
