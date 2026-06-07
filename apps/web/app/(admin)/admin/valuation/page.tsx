import { revalidatePath } from 'next/cache'

import {
  CreateConditionMultiplierSchema,
  CreateValuationProfileSchema,
  CreateValuationRuleSchema,
} from '@ballatlas/validators'

import { createAdminClient, createClient } from '@/lib/supabase/server'

export default async function ValuationPage() {
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('valuation_profiles')
    .select(`*, condition_multipliers(*), valuation_rules(*)`)
    .order('segment')

  async function createProfile(formData: FormData) {
    'use server'
    const raw = {
      segment: formData.get('segment'),
      description: formData.get('description') || null,
      is_active: formData.get('is_active') === 'true',
    }
    const parsed = CreateValuationProfileSchema.safeParse(raw)
    if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join(', '))
    const admin = await createAdminClient()
    const { error } = await admin.from('valuation_profiles').insert(parsed.data)
    if (error) throw new Error(error.message)
    revalidatePath('/admin/valuation')
  }

  async function addConditionMultiplier(formData: FormData) {
    'use server'
    const raw = {
      profile_id: formData.get('profile_id'),
      condition: formData.get('condition'),
      multiplier: Number(formData.get('multiplier')),
    }
    const parsed = CreateConditionMultiplierSchema.safeParse(raw)
    if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join(', '))
    const admin = await createAdminClient()
    const { error } = await admin.from('condition_multipliers').insert(parsed.data)
    if (error) throw new Error(error.message)
    revalidatePath('/admin/valuation')
  }

  async function upsertValuationRule(formData: FormData) {
    'use server'
    const raw = {
      profile_id: formData.get('profile_id'),
      age_adjustment: Number(formData.get('age_adjustment') ?? 1),
      demand_adjustment: Number(formData.get('demand_adjustment') ?? 1),
      availability_adjustment: Number(formData.get('availability_adjustment') ?? 1),
      notes: formData.get('notes') || null,
    }
    const parsed = CreateValuationRuleSchema.safeParse(raw)
    if (!parsed.success) throw new Error(parsed.error.issues.map((i) => i.message).join(', '))
    const admin = await createAdminClient()
    const { error } = await admin
      .from('valuation_rules')
      .upsert(parsed.data, { onConflict: 'profile_id' })
    if (error) throw new Error(error.message)
    revalidatePath('/admin/valuation')
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Valuation</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Manage valuation profiles, condition multipliers, and adjustment rules.
        </p>
      </div>

      {/* Create profile */}
      <details className="mb-8 rounded-lg border border-neutral-800 p-4">
        <summary className="cursor-pointer text-sm font-medium text-neutral-300">
          + New Valuation Profile
        </summary>
        <form action={createProfile} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-neutral-400">Segment *</label>
              <input
                name="segment"
                required
                placeholder="tour-premium"
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-neutral-400">Active</label>
              <select
                name="is_active"
                defaultValue="true"
                className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-neutral-500 focus:outline-none"
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-400">Description</label>
            <input
              name="description"
              placeholder="Used for tour-level premium balls in mint condition"
              className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
          >
            Create Profile
          </button>
        </form>
      </details>

      {/* Profiles list */}
      {profiles && profiles.length > 0 ? (
        <div className="space-y-6">
          {profiles.map((profile) => {
            const multipliers = (profile.condition_multipliers ?? []) as Array<{
              id: string
              condition: string
              multiplier: number
            }>
            const rule = (profile.valuation_rules ?? [])[0] as
              | {
                  age_adjustment: number
                  demand_adjustment: number
                  availability_adjustment: number
                  notes: string | null
                }
              | undefined

            return (
              <div key={profile.id} className="rounded-lg border border-neutral-800 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold">{profile.segment}</h2>
                    {profile.description && (
                      <p className="mt-0.5 text-sm text-neutral-400">{profile.description}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs ${profile.is_active ? 'text-green-400' : 'text-neutral-500'}`}
                  >
                    {profile.is_active ? 'active' : 'inactive'}
                  </span>
                </div>

                {/* Condition multipliers */}
                <div className="mb-4">
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Condition Multipliers
                  </h3>
                  {multipliers.length > 0 ? (
                    <div className="mb-3 space-y-1">
                      {multipliers.map((m) => (
                        <div key={m.id} className="flex items-center justify-between text-sm">
                          <span className="text-neutral-300">{m.condition}</span>
                          <span className="font-mono text-neutral-400">×{m.multiplier}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mb-3 text-xs text-neutral-600">No multipliers yet.</p>
                  )}
                  <details>
                    <summary className="cursor-pointer text-xs text-neutral-500 hover:text-neutral-300">
                      + Add multiplier
                    </summary>
                    <form action={addConditionMultiplier} className="mt-2 flex gap-2">
                      <input type="hidden" name="profile_id" value={profile.id} />
                      <input
                        name="condition"
                        placeholder="mint"
                        required
                        className="flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
                      />
                      <input
                        name="multiplier"
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder="1.000"
                        required
                        className="w-24 rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="rounded-md bg-neutral-800 px-3 py-1.5 text-xs text-neutral-200 hover:bg-neutral-700"
                      >
                        Add
                      </button>
                    </form>
                  </details>
                </div>

                {/* Adjustment rule */}
                <div>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Adjustment Rule
                  </h3>
                  <form action={upsertValuationRule} className="space-y-2">
                    <input type="hidden" name="profile_id" value={profile.id} />
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          name: 'age_adjustment',
                          label: 'Age',
                          defaultValue: rule?.age_adjustment ?? 1,
                        },
                        {
                          name: 'demand_adjustment',
                          label: 'Demand',
                          defaultValue: rule?.demand_adjustment ?? 1,
                        },
                        {
                          name: 'availability_adjustment',
                          label: 'Availability',
                          defaultValue: rule?.availability_adjustment ?? 1,
                        },
                      ].map((f) => (
                        <div key={f.name}>
                          <label className="mb-1 block text-xs text-neutral-500">{f.label}</label>
                          <input
                            name={f.name}
                            type="number"
                            step="0.001"
                            min="0"
                            defaultValue={f.defaultValue}
                            className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-xs text-neutral-100 focus:border-neutral-500 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-neutral-500">Notes</label>
                      <input
                        name="notes"
                        defaultValue={rule?.notes ?? ''}
                        placeholder="Optional notes"
                        className="w-full rounded-md border border-neutral-700 bg-neutral-900 px-2 py-1.5 text-xs text-neutral-100 placeholder-neutral-500 focus:border-neutral-500 focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="rounded-md bg-neutral-800 px-3 py-1.5 text-xs text-neutral-200 hover:bg-neutral-700"
                    >
                      {rule ? 'Update Rule' : 'Create Rule'}
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-neutral-500">
          No valuation profiles yet. Create one above to get started.
        </p>
      )}
    </div>
  )
}
