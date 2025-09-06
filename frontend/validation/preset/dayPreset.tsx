import { z } from "zod"
import { requiredFormFields, requiredApiFields } from "./createOrEdit"

const formSchema = z.object({
    ...requiredFormFields.shape,
    preset: 
        z.array(
            z.object({
                value: z.string().regex(/^\d+$/, "Must select a preset")
            })
        ),
    time: 
        z.array(
            z.object({
                value: 
                    z.iso.time({precision: -1, message: "Must enter a time in 'HH:MM' format"})
                    .refine(data => data !== "00:00", "Time cannot be midnight")
            })
        ).superRefine(
            (data, ctx) => {
                for (let i=1; i<data.length; i++) {
                    if (data[i-1].value >= data[i].value) {
                        ctx.addIssue({
                            code: "custom",
                            message: "Must come after the previous time",
                            path: [i, "value"],
                        })
                    }
                }
            }
        )
})

type FormInput = z.input<typeof formSchema>
type FormOutput = z.infer<typeof formSchema>

const apiSchema = z.object({
    ...requiredApiFields.shape,
    preset: 
        z.array(
            z.number().min(1)
        ),
    time: 
        z.array(
            z.object({
                hour: z.number().int().min(0).max(23),
                minute: z.number().int().min(0).max(59)
            }).refine(
                data => !(data.hour === 0 && data.minute === 0),
                "Time cannot be midnight"
            )
        ).superRefine(
            (data, ctx) => {
                type TimeObject = {hour: number, minute: number}
                const toMinute = (t: TimeObject) => t.hour * 60 + t.minute;
                for (let i=1; i<data.length; i++) {
                    if (toMinute(data[i-1]) >= toMinute(data[i])) {
                        ctx.addIssue({
                            code: "custom",
                            message: "Must come after the previous time",
                            path: [i],
                        })
                    }
                }
            }
        )
})

type ApiInput = z.input<typeof apiSchema>
type ApiOutput = z.infer<typeof apiSchema>

const toApi = (data: FormOutput): ApiInput => {
    const time = data.time.map(
        timeObject => {
            const [hour, minute] = timeObject.value.split(":").map(Number);
            return {hour, minute}
        }
    )
    const preset = data.preset.map(
        presetObject => parseInt(presetObject.value)
    )
    const id = (data.id === "") ? undefined : parseInt(data.id)
    return {...data, id, time, preset}
}

const fromApi = (data: ApiOutput): FormInput => {
    const time = data.time.map(
        timeValue => {
            const hour = timeValue.hour.toString().padStart(2, "0");
            const minute = timeValue.minute.toString().padStart(2, "0");
            return {value: `${hour}:${minute}`};
        }
    )
    const preset = data.preset.map(x => ({ value: x.toString() }))
    const id = (data.id ?? "").toString()
    return {...data, id, time, preset}
}

const initialFormValues: FormInput = {
    id: "",
    name: "",
    preset: [{value: ""}],
    time: []
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
    type ApiOutput
};