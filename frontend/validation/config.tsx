import { z } from "zod";

const formSchema = z.object({
    id: z.string().regex(/^\d+$/),
})

type FormInput = z.input<typeof formSchema>
type FormOutput = z.infer<typeof formSchema>

const apiSchema = z.object({
    id: z.number().int().min(0),
})

type ApiInput = z.input<typeof apiSchema>
type ApiOutput = z.infer<typeof apiSchema>

const toApi = (data: FormOutput): ApiInput => {
    return {
        id: parseInt(data.id),
    }
}

const fromApi = (data: ApiOutput): FormInput => {
    return {
        id: data.id.toString(),
    }
}

const initialFormValues = {
    id: "0",
} as const

const presetSchema = z.object({
    id: z.number().min(1),
    name: z.string().min(1)
})

const allPresetsSchema = z.object({
    "atomic": z.array(presetSchema),
    "day": z.array(presetSchema),
    "week": z.array(presetSchema)
})

export {formSchema, apiSchema, toApi, fromApi, initialFormValues, allPresetsSchema, type FormInput, type FormOutput, type ApiInput, type ApiOutput};
