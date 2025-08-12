import { useSafeFetch } from "./useSafeFetch.tsx"
import { type DependencyList } from "react"

function usePostJson<T>(
    route: string, 
    data: T, 
    options: {
        requirements?: () => boolean,
        dependencies?: DependencyList
    } = {
        dependencies: []
    }
) {
    return useSafeFetch(
        route,
        {
            init: {
                method: "POST",
                body: JSON.stringify(data),
                headers: {
                    "Content-type": "application/json; charset=UTF-8",
                }
            },
            okResponseHandler: () => true,
            ...options
        }
    );
}

export {usePostJson}