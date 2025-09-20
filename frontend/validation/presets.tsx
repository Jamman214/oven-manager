import { z } from "zod"

const presetSchema = z.object({
    id: z.number().min(1),
    name: z.string().min(1)
})

const upToAtomicPresetsSchema = z.object({
    "atomic": z.array(presetSchema)
})

const upToDayPresetsSchema = z.object({
    "atomic": z.array(presetSchema),
    "day": z.array(presetSchema)
})

const upToWeekPresetsSchema = z.object({
    "atomic": z.array(presetSchema),
    "day": z.array(presetSchema),
    "week": z.array(presetSchema)
})

export { upToAtomicPresetsSchema, upToDayPresetsSchema, upToWeekPresetsSchema }