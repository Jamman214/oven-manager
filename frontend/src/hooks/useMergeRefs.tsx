import React, { useCallback, type Ref } from 'react';

function useMergeRefs<T>(...refs: (Ref<T> | undefined)[]): React.RefCallback<T> {
    return useCallback(
        (node: T | null) => {
            for (const ref of refs) {
                if (!ref) {
                    continue;
                }

                if (typeof ref === 'function') {
                    ref(node); // callback ref
                } else {
                    ref.current = node; // ref object
                }
            }
        },
        [...refs]
    );
}

export {useMergeRefs}