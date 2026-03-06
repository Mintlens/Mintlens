import { eq, and } from 'drizzle-orm'
import { db } from '../../../shared/infrastructure/db.js'
import { budgets, projects } from '#schema'
import { NotFoundError } from '../../../shared/errors/app-errors.js'
import type { CreateBudgetInput } from '../domain/budgets.types.js'

export async function createBudgetUseCase(
  organisationId: string,
  input: CreateBudgetInput,
): Promise<typeof budgets.$inferSelect> {
  // Verify the project belongs to this organisation
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, input.projectId), eq(projects.organisationId, organisationId)))
    .limit(1)

  if (!project) throw new NotFoundError('Project', input.projectId)

  const [created] = await db
    .insert(budgets)
    .values({
      projectId:         input.projectId,
      name:              input.name,
      scope:             input.scope,
      limitMicro:        input.limitMicro,
      period:            input.period,
      killSwitchEnabled: input.killSwitchEnabled ?? false,
      alertThresholds:   input.alertThresholds ?? [80, 100],
      tenantId:          input.tenantId ?? null,
      featureId:         input.featureId ?? null,
      isActive:          true,
    })
    .returning()

  return created!
}
