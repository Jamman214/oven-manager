import { z } from "zod";

const minTemp = 0
const maxTemp = 500

type ValidationMode = "unsubmitted" | "submitted";

const sectors = ["core", "oven"] as const;
type Sector = (typeof sectors)[number];

const limits = ["high", "low"] as const;
type Limit = (typeof limits)[number];

const nameSchema = (mode: ValidationMode) => {
    const schema = z
        .string({
            invalid_type_error: "Must enter a name",
        })
        .min(1, "Must enter a name");

    switch (mode) {
        case "submitted":
            return schema;
        case "unsubmitted":
            return schema.nullable();
    }
}

const limitSchema = (mode: ValidationMode) => {
    const schema = z
        .number({
            invalid_type_error: "Must enter a number",
        })
        .min(minTemp, "Temperature must be ≥ " + minTemp)
        .max(maxTemp, "Temperature must be ≤ " + maxTemp)
        .refine((val) => {console.log(val); return true},"")
        .refine(
            (val) => Number.isInteger(val),
            {message: "Must enter an integer"}
        )
    switch (mode) {
        case "submitted":
            console.log("not nullable");
            return schema;
        case "unsubmitted":
            return schema.nullable();
    }
}


const sectorSchema = (mode: ValidationMode) => {
    return z.object({
        high: limitSchema(mode),
        low: limitSchema(mode),
    }).pipe(
        z.object({
            high: z.number().nullable(),
            low: z.number().nullable()
        }).superRefine((data, ctx) => {
            if (
                data.high != null 
                && data.low != null 
                && data.high < data.low
            ) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "High cannot be colder than low",
                    path: [],
                });
            }
        })
    )
}
    
const temperatureSchema = (mode: ValidationMode) => {
    return z.object({
        core: sectorSchema(mode),
        oven: sectorSchema(mode)
    }).pipe(
        z.object({
            core: z.object({high: z.number().nullable(), low: z.number().nullable()}),
            oven: z.object({high: z.number().nullable(), low: z.number().nullable()})
        }).superRefine((data, ctx) => {
            if (
                data.oven.high != null 
                && data.core.low != null 
                && data.oven.high > data.core.low

            ) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Core must be hotter than oven",
                    path: [],
                });
            }
        })
    )
}

const formSchema = (mode: ValidationMode) => z.object({name: nameSchema(mode), temperatures: temperatureSchema(mode)});

// Input to schema (null where user hasnt touched a field)
type FormInput = z.input<ReturnType<typeof formSchema>>;

// Output from schema (null where user hasnt touched a field)
type FormOutput = z.infer<ReturnType<typeof formSchema>>;

// Same as FormOutput but without nulls
type SubmittableForm = {
    name: string;
    temperatures: {
        core: {
            high: number;
            low: number;
        }
        oven: {
            high: number;
            low: number;
        }
    }
}

const isFormSubmittable = (data: FormOutput): data is SubmittableForm => {
    for (let sector of sectors) {
        for (let limit of limits) {
            if (data.temperatures[sector][limit] === null) return false;
        }
    }
    return true;
}


export {
    formSchema, 
    isFormSubmittable, 
    type FormInput, 
    type FormOutput, 
    type SubmittableForm, 
    type ValidationMode,
    sectors, 
    type Sector, 
    limits, 
    type Limit
};