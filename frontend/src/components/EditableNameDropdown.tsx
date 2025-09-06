import { useGetJson } from "../hooks/useGetJSON";
import { useMemo } from "react"
import { ErrorAlert } from "../components/ErrorAlert.tsx";
import { FloatingInput} from "../components/FloatingInput.tsx";
import { EditableDropdown, type ClickHandler } from "../components/EditableDropdown.tsx";
import { useFormContext } from "react-hook-form";

import { z } from "zod";


// Fetches the list of names + ids whenever a preset is saved/edited
function usePresets(route: string, modifiedCount: number) {
    const [presets, isPresetsLoading, presetsError] = useGetJson(
        route,
        z.array(z.object({
            "id": z.number(),
            "name": z.string()
        })),
        {dependencies:[route, modifiedCount]}
    )
    return useMemo(
        () => presets || [],
        [presets]
    )
}

interface Props {
    namesRoute: string;
    refreshOnChange: number;
    selectHandler: ClickHandler;
}

function EditableNameDropdown({ refreshOnChange, namesRoute, selectHandler }: Props) {
    const {
        reset,
        formState: { errors, touchedFields, isSubmitted },
        register,
        setValue
    } = useFormContext<{id: number, name: string}>();

    // list of available presets
    const presets = usePresets(namesRoute, refreshOnChange);

    const showError = touchedFields.name || isSubmitted;

    return (
        <>
            <FloatingInput
                text="Name"
                htmlFor="name"
            >
                <EditableDropdown 
                    inputProps={{id:"name", placeholder:" ", ...register("name")}}
                    valueProps={{}}
                    itemProps={{onClick: selectHandler}}
                    defaultItem={{value:"", text:"new", editText:""}}
                    items={
                        (presets).map((preset) => ({
                            value: "" + preset.id, 
                            text: preset.name, 
                            editText: preset.name
                        }))
                    }
                />
            </FloatingInput>
            <ErrorAlert 
                error={showError && errors?.name?.message}
            />
        </>
    );
}

export {EditableNameDropdown, type ClickHandler}