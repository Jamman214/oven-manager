import { z } from "zod";

const sectors = ["core", "oven"] as const;
type Sector = (typeof sectors)[number];

const limits = ["high", "low"] as const;
type Limit = (typeof limits)[number];

import { requiredFormFields, requiredApiFields } from "./createOrEdit"

const tempRange = {min: 0, max: 500}

const apiLimitSchema = z
    .number({message: "Must enter a number"})
    .int("Must enter a whole number")
    .min(tempRange.min, `Temperature must be ≥ ${tempRange.min}`)
    .max(tempRange.max, `Temperature must be ≤ ${tempRange.max}`)

const formLimitSchema = z
    .string()
    .regex(/^[+-]?\d+$/, "Must enter a whole number")
    .transform(data => parseInt(data, 10))
    .pipe(
        apiLimitSchema
    )

const sectorSchema = <T,> (limitSchema: z.ZodType<number, T>) => z
    .object({
        high: limitSchema,
        low: limitSchema,
    }).superRefine((data, ctx) => {
        if (data.low >= data.high) {
            ctx.addIssue({
                code: "custom",
                message: "Low must be colder than high",
                path: ["low"],
            });
        }
    })

const formSectorSchema = sectorSchema(formLimitSchema)
const apiSectorSchema = sectorSchema(apiLimitSchema)

const temperatureSchema = <T,> (sectorSchema: z.ZodType<{high: number, low: number}, T>) => z
    .object({
        core: sectorSchema,
        oven: sectorSchema
    }).superRefine((data, ctx) => {
        if (data.oven.high >= data.core.low) {
            ctx.addIssue({
                code: "custom",
                message: "Oven must be colder than core",
                path: ["oven", "high"],
            });
        }
    })

const formTemperatureSchema = temperatureSchema(formSectorSchema)
const apiTemperatureSchema = temperatureSchema(apiSectorSchema)

const formSchema = z.object({
    ...requiredFormFields.shape,
    temperature: formTemperatureSchema
})

const apiSchema = z.object({
    ...requiredApiFields.shape,
    temperature: apiTemperatureSchema
})

type FormInput = z.input<typeof formSchema>
type FormOutput = z.infer<typeof formSchema>

type ApiInput = z.input<typeof apiSchema>
type ApiOutput = z.infer<typeof apiSchema>

const toApi = (data: FormOutput): ApiInput => {
    const id = (data.id === "") ? undefined : parseInt(data.id)
    return {...data, id}
}

const fromApi = (data: ApiOutput): FormInput => {
    const sectorToString = (sector: {high: number, low: number}) => ({
        high: sector.high.toString(),
        low: sector.low.toString()
    })
    const temperature = {
        core: sectorToString(data.temperature.core),
        oven: sectorToString(data.temperature.oven)
    }
    const id = (data.id ?? "").toString()
    return {...data, id, temperature}
}

const initialFormValues: FormInput = {
    id: "",
    name: "",
    temperature: {
        core: {
            high: "",
            low: ""
        },
        oven: {
            high: "",
            low: ""
        }
    }
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

    limits,
    sectors,
    type Sector,
    type Limit
};