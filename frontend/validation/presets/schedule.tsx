import { z } from "zod";

const presetSchema = z
    .union([
        z.coerce.number().refine((val) => val >= 0, { message: "Select a preset"}),
        z.literal("")
    ]);

const presetsSchema = z.array(z.object({value: presetSchema}))

const timeSchema = z
    .string()
    .transform((time) => {
        const match = time.match(/^(\d{2}):(\d{2})$/);
        if (match === null) {
            return null;
        }
        return {
            hour: parseInt(match[1], 10),
            minute: parseInt(match[2], 10),
        };
    }).pipe(
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
        }).refine(
            (data) => !(data.hour === 0 && data.minute === 0),
            "Time cannot be midnight"
        ).nullable()
    ).nullable()

const timesSchema = z
.array(z.object({value: timeSchema}))
.pipe(
    z.array(
        z.object({
            value: z.object({
                hour: z.number(),
                minute: z.number()
            }).nullable()
        })
    ).superRefine(
        (data, ctx) => {
            console.log("test")
            let prevTime = 0;
            for (const [i, time] of data.entries()) {
                console.log(`${i}) ${JSON.stringify(time)}`)
                if (time.value === null) continue;
                const newTime = time.value.hour * 60 + time.value.minute;
                
                console.log(`new: ${newTime}, old: ${prevTime}`)

                const issueDetected = newTime <= prevTime;
                prevTime = newTime;

                if (!issueDetected) continue;

                console.log("issue detected")

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
)

const formSchema = z.object({
    preset: presetsSchema,
    time: timesSchema
});

type FormInput = z.input<typeof formSchema>;

type FormOutput = z.infer<typeof formSchema>;

export {formSchema, type FormInput, type FormOutput}

