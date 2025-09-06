import { useState, Fragment } from "react";
import { 
    useFormContext, 
} from "react-hook-form";
import { z } from "zod"

import { useGetJson } from "../../hooks/useGetJSON.tsx";

import { Dropdown, type Item } from "../../components/Dropdown.tsx";
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
    type Day
} from "../../../validation/preset/weekPreset.tsx"

import "../../scss/pages/preset/DayPreset.scss"
import CreateOrEdit from "./CreateOrEdit.tsx";

interface PresetProps {
    index: number;
    options: Item[];
}

function Preset ({index, options}: PresetProps) {
    const {
        register,
        formState: { errors, touchedFields, isSubmitted },
        trigger
    } = useFormContext<FormInput>();

    const path = `preset.${index}` as const

    const showError = touchedFields.preset?.[index] || isSubmitted;

    return <>
        <Dropdown
            options={options}
            initial="Select a Preset"
            disableInitial={false}
            {...register(path)}
        />
        <ErrorAlert 
            error={
                showError && errors.preset?.[index]?.message
            }
        />
    </>
}

function FormFields() {
    const [data, isLoading, error] = useGetJson<{id: number, name: string}[]>(
        "/api/get/presets/day",
        z.array(z.object({
            id: z.number().min(0),
            name: z.string().min(1)
        }))
    )
    const options = data || [];

    return (
        <fieldset>
            <legend className="group-label">Daily Presets</legend>
                    
            {days.map((field, index) => 
                <Fragment key={field}>
                    <Preset index={index} options={options}/>
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
