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

const buildLimitSchemas = () => {
    const minTemp = 0
    const maxTemp = 500
    const strictSchema = z
        .number({
            invalid_type_error: "Must enter a number",
        })
        .min(minTemp, "Temperature must be ≥ " + minTemp)
        .max(maxTemp, "Temperature must be ≤ " + maxTemp)
        .refine((val) => {return true},"")
        .refine(
            (val) => Number.isInteger(val),
            {message: "Must enter an integer"}
        );
    const relaxedSchema = strictSchema.nullable();
    return {
        submitted: strictSchema,
        unsubmitted: relaxedSchema,
        received: strictSchema
    }
}
const limitSchemas = buildLimitSchemas()

// ------------------------------------------------------------
// Schema for sector
// ------------------------------------------------------------

const buildSectorSchemas = () => {
    const buildSchema = <S extends z.ZodType,>(limitSchema: S) => z
        .object({
            high: limitSchema,
            low: limitSchema,
        }).pipe(
            z.any().superRefine((data, ctx) => {
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
        );

    return {
        submitted: buildSchema(limitSchemas.submitted),
        unsubmitted: buildSchema(limitSchemas.unsubmitted),
        received: buildSchema(limitSchemas.received)
    }
}

const sectorSchemas = buildSectorSchemas()

// ------------------------------------------------------------
// Schema for temperature
// ------------------------------------------------------------

const buildTemperatureSchema = () => {
    const buildSchema = <S extends z.ZodType,>(sectorSchema: S) => z
        .object({
            core: sectorSchema,
            oven: sectorSchema
        }).pipe(
            z.any().superRefine((data, ctx) => {
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
        );
    return {
        submitted: buildSchema(sectorSchemas.submitted),
        unsubmitted: buildSchema(sectorSchemas.unsubmitted),
        received: buildSchema(sectorSchemas.received)
    }
}

const temperatureSchemas = buildTemperatureSchema();

// ------------------------------------------------------------
// Schema for form
// ------------------------------------------------------------

const buildFormSchemas = () => {
    const buildSchema = <
        ID extends z.ZodType,
        N extends z.ZodType,
        T extends z.ZodType,
    >(
        idSchema: ID, 
        nameSchema: N, 
        temperatureSchema: T
    ) => z
        .object({
            id: idSchema,
            name: nameSchema, 
            temperature: temperatureSchema
        });

    return {
        submitted: buildSchema(
            idSchemas.submitted, 
            nameSchemas.submitted, 
            temperatureSchemas.submitted
        ),
        unsubmitted: buildSchema(
            idSchemas.unsubmitted, 
            nameSchemas.unsubmitted, 
            temperatureSchemas.unsubmitted
        ),
        received: buildSchema(
            idSchemas.received, 
            nameSchemas.received, 
            temperatureSchemas.received
        )
    }
}

const formSchemas = buildFormSchemas();

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
}

type FormSchemaInput = z.input<typeof formSchemas.submitted | typeof formSchemas.unsubmitted>;
type FormSchemaOutput = z.infer<typeof formSchemas.submitted | typeof formSchemas.unsubmitted>
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