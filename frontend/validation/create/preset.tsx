import { z } from "zod";
import {idSchemas, nameSchemas} from "./name.tsx"
// ------------------------------------------------------------
// Important constants
// ------------------------------------------------------------

const sectors = ["core", "oven"] as const;
type Sector = (typeof sectors)[number];

const limits = ["high", "low"] as const;
type Limit = (typeof limits)[number];

const validationModes = ["submitted", "unsubmitted", "received"] as const;
type ValidationMode = (typeof validationModes)[number];

// ------------------------------------------------------------
// Schema for limit
// ------------------------------------------------------------

const CreateLimitSchemaSet = () => {
    const tempRange = {min: 0, max: 500}
    const strictSchema = z
        .number({invalid_type_error: "Must enter a number"})
        .min(tempRange.min, `Temperature must be ≥ ${tempRange.min}`)
        .max(tempRange.max, `Temperature must be ≤ ${tempRange.max}`)
        .refine(
            (val) => Number.isInteger(val),
            {message: "Must enter an integer"}
        );
    return {
        submitted: strictSchema,
        unsubmitted: strictSchema.nullable(),
        received: strictSchema
    } as const
}
const limitSchemas = CreateLimitSchemaSet()

// ------------------------------------------------------------
// Schema for sector
// ------------------------------------------------------------

const createSectorSchema = <K extends ValidationMode>(key: K) => {
    const baseSchema = z
        .object({
            high: limitSchemas[key],
            low: limitSchemas[key],
        })

    return baseSchema.pipe(
        baseSchema.superRefine((data, ctx) => {
            if (
                typeof data.high === "number"
                && typeof data.low === "number"
                && data.high < data.low
            ) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "High cannot be colder than low",
                    path: [],
                });
            }
        })
    );
}

const sectorSchemas = {
    submitted: createSectorSchema("submitted"),
    unsubmitted: createSectorSchema("unsubmitted"),
    received: createSectorSchema("received"),
} as const;

// ------------------------------------------------------------
// Schema for temperature
// ------------------------------------------------------------

const createTemperatureSchema = <K extends ValidationMode>(key: K) => {
    const baseSchema = z.object({
        core: sectorSchemas[key],
        oven: sectorSchemas[key]
    })
    
    return baseSchema.pipe(
        baseSchema.superRefine((data, ctx) => {
        if (
            typeof data.core?.low === "number"
            && typeof data.oven?.high === "number"
            && data.oven.high > data.core.low

        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Core must be hotter than oven",
                path: [],
            });
            }
        })
    );
}

const temperatureSchemas = {
    submitted: createTemperatureSchema("submitted"),
    unsubmitted: createTemperatureSchema("unsubmitted"),
    received: createTemperatureSchema("received"),
} as const;


// ------------------------------------------------------------
// Schema for form
// ------------------------------------------------------------

const createFormSchema = <K extends ValidationMode>(key: K) => {
    return z.object({
        id: idSchemas[key],
        name: nameSchemas[key], 
        temperature: temperatureSchemas[key]
    });
}

const formSchemas = {
    submitted: createFormSchema("submitted"),
    unsubmitted: createFormSchema("unsubmitted"),
    received: createFormSchema("received"),
} as const;

// ------------------------------------------------------------
// Values and types
// ------------------------------------------------------------

const initialFormValues = {
    id: null,
    name: null,
    temperature: {
        core: {
            high: null,
            low: null
        },
        oven: {
            high: null,
            low: null
        }
    }
} as const

type FormSchemaInput = z.input<typeof formSchemas.submitted> | z.input<typeof formSchemas.unsubmitted>;
type FormSchemaOutput = z.infer<typeof formSchemas.submitted> | z.infer<typeof formSchemas.unsubmitted>
type SubmittableFormData = z.infer<typeof formSchemas.submitted>;

export {
    formSchemas, 
    initialFormValues,
    sectors, 
    limits, 
    
    type FormSchemaInput, 
    type FormSchemaOutput, 
    type SubmittableFormData,
    type ValidationMode,
    type Sector, 
    type Limit    
};