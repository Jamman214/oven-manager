import {useSafeFetch} from "./useSafeFetch.tsx"
import {type DependencyList} from "react"
import {z} from "zod"

function useGetJson<T,U>(
    route: string, 
    schema: z.ZodType<T>, 
    options: {
        requirements?: () => boolean,
        dependencies?: DependencyList
    } = {
        dependencies: []
    },
    params?: Record<string, string>
) {
    if (params) {
        const urlParams = new URLSearchParams(params)
        route = `${route}?${urlParams.toString()}`
    }
    return useSafeFetch<T>(
        route,
        {
            init: {
                method: "GET",
            },
            okResponseHandler: async (response) => {
                const unknownJson = await response.json()
                const knownJson = schema.parse(unknownJson)
                return knownJson
            },
            ...options
        }
    );
}

type GetJsonOutput<T> = ReturnType<typeof useGetJson<T,unknown>>

export {useGetJson, type GetJsonOutput}