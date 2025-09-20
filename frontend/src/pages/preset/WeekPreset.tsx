import { useState, Fragment, useMemo } from "react";
import { 
    useFormContext, 
} from "react-hook-form";
import { z } from "zod"

import { useGetJson } from "../../hooks/useGetJSON.tsx";

import { ErrorAlert } from "../../components/ErrorAlert.tsx";
import { SubmitButton} from "../../components/SubmitButton.tsx";

import { type SubmitAction } from "../../components/SubmitButton.tsx";

import {
    formSchema,
    apiSchema,
    initialFormValues,
    toApi,
    fromApi,
    type FormInput,

    days,
} from "../../../validation/preset/weekPreset.tsx"

import CreateOrEdit from "./CreateOrEdit.tsx";
import { upToDayPresetsSchema } from "../../../validation/presets.tsx";
import { PresetOptions  } from "../../components/PresetOptions.tsx";

interface PresetProps {
    index: number;
    presets: z.infer<typeof upToDayPresetsSchema>;
}

function Preset ({index, presets}: PresetProps) {
    const {
        register,
        formState: { errors, touchedFields, isSubmitted },
    } = useFormContext<FormInput>();

    const path = `preset.${index}` as const

    const showError = touchedFields.preset?.[index] || isSubmitted;

    return <>
        <select {...register(path)}>
            <option value="">Select a Preset</option>
            <PresetOptions presets={presets}/>
        </select>
        <ErrorAlert 
            error={
                showError && errors.preset?.[index]?.message
            }
        />
    </>
}

function FormFields() {
    const [data, _isLoading, _error] = useGetJson(
        "/api/get/presets/combination",
        upToDayPresetsSchema,
        {},
        {combination: "3"}
    )
    const presets = useMemo(
        () => data || {"atomic": [], "day": []},
        [data]
    )

    return (
        <fieldset>
            <legend className="group-label">Daily Presets</legend>
                    
            {days.map((field, index) => 
                <Fragment key={field}>
                    <Preset index={index} presets={presets}/>
                </Fragment>
            )}
        </fieldset>
    );
}

interface FormProps {
    submitAction: SubmitAction;
}

function WeekPresetForm({submitAction}: FormProps) {
    return <>
        <FormFields/>        
        <div className="formButtons">
            <SubmitButton action={submitAction} text={{ resetText: "Save Preset" }} />
        </div>
    </>
}

function WeekPreset() {
    const [submitAction, setSubmitAction] = useState<SubmitAction>("SUBMIT");

    return (
        <CreateOrEdit
            legendText="Week Preset"
            formSchema={formSchema}
            apiSchema={apiSchema}
            initialFormValues={initialFormValues}
            namesRoute="/api/get/presets/week"
            dataRoute="/api/get/preset/week"
            editRoute="/api/edit/preset/week"
            createRoute="/api/create/preset/week"
            toApi={toApi}
            fromApi={fromApi}
            setSubmitAction={setSubmitAction}
        >
            <WeekPresetForm submitAction={submitAction}/>
        </CreateOrEdit>
    );
}

export default WeekPreset;
