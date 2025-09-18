import { z } from "zod"

const boxSchema = z.array(
    z.object({
        max: z.number().min(0),
        min: z.number().min(0),
        start: z.number().min(0).transform(t => t*1000),
        end: z.number().min(0).transform(t => t*1000)
    }).refine(
        data => data.min < data.max && data.start < data.end
    )
);

const historyDataSchema = z.object({
    data: 
        z.array(z.object({
            time: z.number().min(0).transform(t => t*1000),
            core: z.number(),
            oven: z.number(),
            coreOn: z.boolean(),
            ovenOn: z.boolean()

        })),
    limit: z.object({
        core: boxSchema,
        oven: boxSchema
    }),
    start: z.number().min(0).transform(t => t*1000),
    end: z.number().min(0).transform(t => t*1000)
}).refine(data => data.start < data.end)

export {historyDataSchema}