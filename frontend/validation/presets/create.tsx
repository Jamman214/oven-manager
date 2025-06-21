import { z } from "zod";

const minTemp = 0
const maxTemp = 500

const sectors = ["core", "oven"] as const;
type Sector = (typeof sectors)[number];

const limits = ["high", "low"] as const;
type Limit = (typeof limits)[number];

const limitSchema = z
    .number({
        invalid_type_error: "Must enter a number",
    })
    .min(minTemp, "Temperature must be ≥ " + minTemp)
    .max(maxTemp, "Temperature must be ≤ " + maxTemp)
    .refine((val) => {console.log(val); return true},"")
    .refine(
        (val) => Number.isInteger(val),
        {message: "Must enter an integer"}
    ).nullable()


const sectorSchema = z.object({
        high: limitSchema,
        low: limitSchema,
    }).pipe(
        z.object({
            high: z.number().nullable(),
            low: z.number().nullable()
        }).superRefine((data, ctx) => {
            if (data.high !== null && data.low !== null && data.high < data.low) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "High cannot be colder than low",
                    path: [],
                });
            }
        })
    )
    
const schema = z.object({
        core: sectorSchema,
        oven: sectorSchema
    }).superRefine((data, ctx) => {
        if (
            data.oven.high !== null
            && data.core.low !== null
            && data.oven.high > data.core.low
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Core must be hotter than oven",
                path: [],
            });
        }
    });

const formSchema = z.object({form: schema});

// Input to schema (null where user hasnt touched a field)
type FormInput = z.input<typeof formSchema>;

// Output from schema (null where user hasnt touched a field)
type FormOutput = z.infer<typeof formSchema>;

// Extracts data from form field of schema
//      (form field used only to display form-wide errors)
type FormData<T> = T extends {form: infer U} ? U : never;

// Same as FormOutput but without nulls
type SubmittableForm = {
    form: {
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
            if (data.form[sector][limit] === null) return false;
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
    type FormData,
    sectors, 
    type Sector, 
    limits, 
    type Limit
};