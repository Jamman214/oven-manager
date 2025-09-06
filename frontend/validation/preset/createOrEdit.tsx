import { z } from "zod"

const requiredFormFields = z.object({
    id: 
        z.union([
            z.literal(""), 
            z.string().regex(/^\d+$/)
        ]),
    name: z.string().min(1, "Must enter a name")
})

const requiredApiFields = z.object({
    id: z.number().min(1).optional(),
    name: z.string().min(1)
})

export {requiredFormFields, requiredApiFields}