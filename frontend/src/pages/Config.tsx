import {
    formSchema, apiSchema, toApi, fromApi, initialFormValues, allPresetsSchema, type FormInput, type FormOutput, type ApiInput
} from "../../validation/config.tsx"
import { zodResolver } from "@hookform/resolvers/zod";
import { 
    useForm, 
    FormProvider
} from "react-hook-form";
import { useGetJson } from "../hooks/useGetJSON.tsx";
import { usePostJson } from "../hooks/usePostJSON.tsx";

import { useMemo, useEffect, useState } from "react";

import { SubmitButton } from "../components/SubmitButton.tsx";

interface Preset {
    id: number;
    name: string;
}
interface PresetGroupProps {
    label: string;
    presets: Preset[];
}
function PresetGroup ({label, presets}: PresetGroupProps) {
    if (!presets.length) return null;
    return <optgroup label={label}>
        {
            presets.map(
                (preset) => (
                    <option 
                        key={preset.id} 
                        value={preset.id.toString()}
                    >
                        {preset.name}
                    </option>  
                )
            )
        }
    </optgroup>
}

function Config() {
    const [rawPresets, _presetsLoading, _presetsError] = useGetJson(
        "/api/get/presets/all",
        allPresetsSchema
    )

    const presets = useMemo(
        () => rawPresets ?? {atomic: [], day: [], week: []},
        [rawPresets]
    )

    const [rawCurrentPreset, _currentPresetLoading, _currentPresetError] = useGetJson(
        "/api/get/config",
        apiSchema
    )

    const currentPreset = useMemo(
        () => rawCurrentPreset ? fromApi(rawCurrentPreset) : initialFormValues,
        [rawCurrentPreset]
    )

    const [formStateLoaded, setFormStateLoaded] = useState(false)

    useEffect(
        () => {
            reset(currentPreset)
            rawPresets && rawCurrentPreset && setFormStateLoaded(true);
        }, [rawPresets, rawCurrentPreset]
    )

    const methods = useForm<FormInput, unknown, FormOutput>({
        resolver: zodResolver(formSchema),
        values: currentPreset,
        mode: "onBlur",
    })

    const { handleSubmit, reset, register} = methods;

    const [submitData, setSubmitData] = useState<ApiInput | null>(null)
    const submitFunc = (formOutput: FormOutput) => setSubmitData(toApi(formOutput))

    const [data, isLoading, error] = usePostJson(
        "/api/set/config",
        submitData,
        {
            requirements: () => (submitData !== null),
            dependencies: [submitData]
        }
    )

    const submitAction =  (
        isLoading ? "SUBMIT"
        : data ? "SUCCEED"
        : error ? "FAIL"
        : "RESET"
    )

    return <FormProvider {...methods}>
            <form onSubmit={handleSubmit(submitFunc)} noValidate>
                <fieldset {...{disabled: submitAction === "SUBMIT"}} className="allFields">
                    <fieldset>
                        <legend className="group-label">Active Preset</legend>
                        <select {...register("id")}>
                            {
                                formStateLoaded && <>
                                <option value="0">Off</option> 
                                <PresetGroup label="Atomic" presets={presets?.atomic}/>
                                <PresetGroup label="Day" presets={presets?.day}/>
                                <PresetGroup label="Week" presets={presets?.week}/>
                                </>
                            }
                        </select>
                    </fieldset>
                    <div className="formButtons">
                        <SubmitButton action={submitAction} text={{ resetText: "Save Preset" }} />
                    </div>
                </fieldset>
            </form>
        </FormProvider>
}

export default Config;
