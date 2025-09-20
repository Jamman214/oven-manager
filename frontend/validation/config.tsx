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

export {formSchema, apiSchema, toApi, fromApi, initialFormValues, type FormInput, type FormOutput, type ApiInput, type ApiOutput};
