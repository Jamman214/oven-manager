import {z} from "zod";
import {useGetJson} from "../hooks/useGetJSON";
import {useState, useMemo, useEffect} from "react"
import ErrorAlert from "../components/ErrorAlert.tsx";
import {FloatingInput} from "../components/FloatingInput.tsx";
import {EditableDropdown, type ClickHandler} from "../components/EditableDropdown.tsx";
import {
    useFormContext,
    type FieldValues,
    type Path
} from "react-hook-form";


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
        formState: { errors },
        register,
        setValue
    } = useFormContext<{id: number, name: string}>();

    // list of available presets
    const presets = usePresets(namesRoute, refreshOnChange);

    return (
        <>
            <FloatingInput
                text="Name"
                htmlFor="name"
            >
                <EditableDropdown 
                    inputProps={{id:"name", placeholder:" ", ...register("name")}}
                    valueProps={{
                        // ...register(
                        //     "id", 
                        //     {setValueAs: (value) => (value==="") ? null : parseInt(value)}
                        // )
                        // Doesnt trigger react-hook-form so no point

                    }}
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
                error={errors?.name?.message}
            />
        </>
    );
}

export {EditableNameDropdown, type ClickHandler}