import { z } from "zod"
import { requiredFormFields, requiredApiFields } from "./createOrEdit"

const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
type Day = typeof days[number];

const formIdSchema = z.string().regex(/^\d+$/, "Must select a preset");

const formSchema = z.object({
    ...requiredFormFields.shape,
    preset: z.array(formIdSchema).refine(data => data.length === 7)
})

type FormInput = z.input<typeof formSchema>
type FormOutput = z.infer<typeof formSchema>

const apiIdSchema = z.number().int().min(1)

const apiSchema = z.object({
    ...requiredApiFields.shape,
    preset: z.array(apiIdSchema).refine(data => data.length === 7)
})

type ApiInput = z.input<typeof apiSchema>
type ApiOutput = z.infer<typeof apiSchema>

const toApi = (data: FormOutput): ApiInput => {
    const id = (data.id === "") ? undefined : parseInt(data.id);
    console.log(data.preset)
    const preset = data.preset.map(data => parseInt(data, 10))
    console.log(preset)
    
    return {...data, id, preset}
}

const fromApi = (data: ApiOutput): FormInput => {
    const id = (data.id ?? "").toString()
    const preset = data.preset.map(data => data.toString())
    return {...data, id, preset}
}

const initialFormValues: FormInput = {
    id: "",
    name: "",
    preset: ["", "", "", "", "", "", ""]
}
export {
    formSchema,
    apiSchema,
    initialFormValues,
    toApi,
    fromApi,
    type FormInput,
    type FormOutput,
    type ApiInput,
    type ApiOutput,

    days,
    type Day
};