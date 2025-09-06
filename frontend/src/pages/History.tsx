import {z} from "zod";

const toTime = (time: string) => time.split(":").map(Number)

function History() {

    // const schema = z.array(
    //     z.string()
    //     .regex(/^\d{2}:\d{2}$/, "Must enter a time")
    //     .transform(
    //         (data, ctx) => {
    //             const [hour, minute] = toTime(data)
    //             if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    //                 ctx.addIssue({
    //                     code: z.ZodIssueCode.custom,
    //                     message: "Invalid Time",
    //                     path: [],
    //                 });
    //                 return z.NEVER;
    //             }
    //             return {hour, minute}
    //         }
    //     )
    // ).superRefine(
    //     (data, ctx) => {
    //         for (let time of data) {
    //             console.log(time === z.NEVER)
    //         }
    //         console.log(data);
    //     }
    // )

    // const schema = z.object({
    //     a: z.string()
    //     .regex(/^\d{2}:\d{2}$/, "Must enter a time")
    //     .transform(
    //         (data, ctx) => {
    //             const [hour, minute] = toTime(data)
    //             if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    //                 ctx.addIssue({
    //                     code: z.ZodIssueCode.custom,
    //                     message: "Invalid Time",
    //                     path: [],
    //                 });
    //                 return z.NEVER;
    //             }
    //             return {hour, minute}
    //         }
    //     ),
    //     b: z.number().min(1000)
    // }).superRefine(
    //     (data, ctx) => {
    //         console.log(data.a === z.NEVER)
    //         console.log(data.a.hour)
    //         console.log(data);
    //     }
    // )

    // const timeSchema = z.object({
    //     hour: z.number().int().min(0).max(23),
    //     minute: z.number().int().min(0).max(59)
    // }).refine(
    //     data => data.hour !== 0 || data.minute !== 0,
    //     { message: "Time cannot be 00:00" }
    // );

    // const processResult = <I, O>(
    //     result: z.SafeParseReturnType<I, O>,
    //     ctx: z.RefinementCtx,
    //     path: (string | number)[] = []
    // ) => {
    //     if (!result.success) {
    //         // Add the issues to the overall context
    //         for (const issue of result.error.issues) {
    //             ctx.addIssue({
    //                 ...issue,
    //                 path: [...path, ...(issue.path ?? [])],
    //             });
    //         }
    //         return z.NEVER;
    //     }
    //     return result.data;
    // }

    // const arraySchema = z.array(z.any()).transform((arr, ctx) => {
    //     const parsed = arr.map((item, index) => {
    //         const result = timeSchema.safeParse(item);
    //         return processResult(result, ctx);
    //     });
    //     return parsed;
    // }).superRefine((data, ctx) => {
    //     console.log("test")
    //     console.log(data);
    // });

    // type A = z.infer<typeof arraySchema>
    // type B = z.input<typeof arraySchema>

    // const x = arraySchema.safeParse([{hour: -1, minute: 46}, {hour: 4, minute: 46}])
    // const x = schema.safeParse({a: "12:99", b: 123})

    const schema = z.object({a: z.number().min(2), b: z.string()}).superRefine(data => console.log(data))

    const x = schema.safeParse({a: 1, b: 3})
    console.log("history")
    console.log(x)
    return <p>History</p>;
}

export default History;

