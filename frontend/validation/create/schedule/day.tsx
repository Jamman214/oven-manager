import {z} from "zod"
import { 
    idSchemas, 
    simpleIdSchema, 
    nameSchemas, 
    simpleNameSchema, 
    type ValidationMode
} from "../name.tsx"

const wrapObject = <S extends z.ZodType>(schema: S) => 
    z.object({value: schema})

const wrapObjectAfter = <S extends z.ZodType>(schema: S) => 
    schema.transform(data => ({value: data}))

const unwrapObjectAfter = <S extends z.ZodType<{value?: any}, any, any>>(schema: S) => 
    schema.transform(data => data.value)

const treatInputAsObject = <S extends z.ZodType>(schema: S) =>
    unwrapObjectAfter(wrapObject(schema))

const createPresetSchemas = () => {
    const presetSchema = z.number({invalid_type_error: "Must Select a preset"}).min(1)

    return {
        submitted: z.array(treatInputAsObject(presetSchema)),
        unsubmitted: z.array(treatInputAsObject(presetSchema.nullable())),
        received: z.array(wrapObjectAfter(presetSchema)),
        simple: {
            submitted: z.array(z.number()),
            unsubmitted: z.array(z.number().nullable()),
            received: z.array(wrapObject(z.number()))
        }
    } as const
}

const presetSchemas = createPresetSchemas()

const createTimeSchemas = () => {
    const timeSchema = 
        z.object({
            hour: z
                .number()
                .min(0, "Invalid Time")
                .max(23, "Invalid Time")
            ,
            minute: z
                .number()
                .min(0, "Invalid Time")
                .max(59, "Invalid Time")
        }).transform(
            (data, ctx) => {
                if (data.hour === 0 && data.minute === 0) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: `Time cannot be midnight`,
                        path: [],
                    });
                    return; // Return void so wont affect ordering check
                }
                return data;
            },
        )
    
    const toTime = 
        z.string({invalid_type_error: "Must enter a time"})
        .transform((timeString, ctx) => {
            const match = timeString.match(/^(\d{2}):(\d{2})$/);
            if (match === null) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Must enter a time`,
                    path: [],
                });
                return;
            }
            return {
                hour: parseInt(match[1], 10),
                minute: parseInt(match[2], 10),
            };
        })
    
    const strictSimpleTime = 
        z.object({
            hour: z.number(),
            minute: z.number()
        })
    
    const fromTime = 
        strictSimpleTime.transform((time) => {
            const toTwoDigit = (x: number) => x.toString().padStart(2, "0");
            return `${toTwoDigit(time.hour)}:${toTwoDigit(time.minute)}`
        })

    const orderedArray = <
        S extends z.ZodType<
            {value?: {hour: number, minute: number} | null}, 
            any, 
            any
        >
    >(schema: S) => {
        const arraySchema = z.array(schema)
        return arraySchema.superRefine(
                (data, ctx) => {
                    let prevTime = 0;
                    for (const [i, time] of data.entries()) {
                        if (!time.value) continue;
                        console.log("Reached")
                        console.log(time)
                        const newTime = time.value.hour * 60 + time.value.minute;
                        
                        const issueDetected = newTime <= prevTime;
                        prevTime = newTime;

                        if (!issueDetected) continue;

                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: `Times must be in order`,
                            path: [i, "value"],
                        });

                        ctx.addIssue({
                            code: z.ZodIssueCode.custom,
                            message: `Times must be in order`,
                            path: [i-1, "value"],
                        });
                    }
                }
            )
    }

    return {
        submitted: orderedArray(wrapObject(toTime.pipe(timeSchema))),
        unsubmitted: orderedArray(wrapObject(toTime.pipe(timeSchema).nullable())),
        received: orderedArray(wrapObjectAfter(timeSchema)).pipe(z.array(
            wrapObject(fromTime)
        )),
        simple: {
            submitted: z.array(wrapObject(strictSimpleTime)),
            unsubmitted: z.array(wrapObject(strictSimpleTime.nullable())),
            received: z.array(wrapObject(z.string()))
        }
    } as const
}

const timeSchemas = createTimeSchemas();

const createFormSchema = <K extends ValidationMode>(key: K) => {
    const schema = z.object({
        id: idSchemas[key],
        name: nameSchemas[key],
        preset: presetSchemas[key],
        time: timeSchemas[key]
    })

    return schema.pipe(
        z.object({
            id: simpleIdSchema,
            name: simpleNameSchema,
            preset: presetSchemas.simple[key],
            time: timeSchemas.simple[key]
        }).superRefine((data, ctx) => {
            if (
                !Array.isArray(data.preset)
                || !Array.isArray(data.time)
            ) return data;

            if (data.preset.length !== data.time.length + 1) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Must be exactly one more preset than time",
                    path: ["preset"],
                });
            }
        })
    )
}

const formSchemas = {
    submitted: createFormSchema("submitted"),
    unsubmitted: createFormSchema("unsubmitted"),
    received: createFormSchema("received")
} as const


// ------------------------------------------------------------
// Values and types
// ------------------------------------------------------------

type FormSchemaInput = z.input<typeof formSchemas.unsubmitted>;
type FormSchemaOutput = z.infer<typeof formSchemas.unsubmitted>
type SubmittableFormData = z.infer<typeof formSchemas.submitted>;

const initialFormValues: FormSchemaInput = {
    id: null,
    name: null,
    preset: [{value: null}],
    time: []
}
export {
    formSchemas, 
    initialFormValues,
    type FormSchemaInput, 
    type FormSchemaOutput, 
    type SubmittableFormData,
    type ValidationMode
};