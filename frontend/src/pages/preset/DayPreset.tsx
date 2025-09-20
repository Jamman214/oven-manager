import { useState, Fragment, useMemo } from "react";
import { 
    useFieldArray, 
    useFormContext, 
} from "react-hook-form";

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
} from "../../../validation/preset/dayPreset.tsx"

import CreateOrEdit from "./CreateOrEdit.tsx";
import { upToAtomicPresetsSchema } from "../../../validation/presets.tsx";
import { PresetOptions } from "../../components/PresetOptions.tsx";
import { z } from "zod";

interface TimeProps {
    index: number
}

function Time ({index}: TimeProps) {
    const {
        trigger,
        register,
        formState: { errors, touchedFields, isSubmitted },
    } = useFormContext<FormInput>();


    const onBlur = async () => {await trigger("time")};

    const showError = touchedFields.time?.[index]?.value || isSubmitted;

    return (
        <>            
            <input
                type="time"
                placeholder="HH:MM"
                {...register(
                    `time.${index}.value`,
                    {onBlur}
                )}
            />
            <ErrorAlert 
                error={
                    showError && errors.time?.[index]?.value?.message
                }
            />
        </>
    )
}

interface PresetProps {
    index: number;
    presets: z.infer<typeof upToAtomicPresetsSchema>;
}

function Preset ({index, presets}: PresetProps) {
    const {
        register,
        formState: { errors, touchedFields, isSubmitted },
        trigger
    } = useFormContext<FormInput>();

    const path = `preset.${index}.value` as const
    const onChange = () => trigger(path);

    const showError = touchedFields.preset?.[index]?.value || isSubmitted;


    return <>
        <select {...register(path, {onChange})}>
            <option value="">Select a Preset</option>
            <PresetOptions presets={presets}/>
        </select>
        <ErrorAlert 
            error={
                showError && errors.preset?.[index]?.value?.message
            }
        />
    </>
}

interface FormFieldsProps {
    presetFields: Record<"id", string>[];
}

function FormFields({presetFields} : FormFieldsProps) {
    const [data, _isLoading, _error] = useGetJson(
        "/api/get/presets/combination",
        upToAtomicPresetsSchema,
        {},
        { combination: "1" } // 1 represents just atomic presets
    )
    const presets = useMemo(
        () => data || {"atomic": []},
        [data]
    )

    return (
        <fieldset>
            <legend className="group-label">Atomic Presets and Times</legend>
                    
            {presetFields.map((field, index) => 
                <Fragment key={field.id}>
                    {
                        index > 0 && 
                        <Time index={index-1}/>
                    }
                    <Preset index={index} presets={presets}/>
                </Fragment>
            )}
        </fieldset>
    );
}

interface FormProps {
    submitAction: SubmitAction;
}

function DayPresetForm({submitAction}: FormProps) {
    const { control } = useFormContext<FormInput>()

    // ------------------------------------------------------------
    // Field arrays
    // ------------------------------------------------------------

    // Setup field array for dynamic times and presets added to form
    const { fields: presetFields, append: appendPreset, remove: removePreset } = useFieldArray({
        control,
        name: "preset"
    });

    const { fields: timeFields, append: appendTime, remove: removeTime } = useFieldArray({
        control,
        name: "time",
    });

    const append = () => {
        appendPreset({ value: "" }, {shouldFocus: false});
        appendTime({value: ""}, {shouldFocus: false})
    }

    const remove = () => {
        const l = timeFields.length;
        if (l === 0) return;
        removePreset(l);
        removeTime(l-1)
    }

    return <>
        <FormFields presetFields={presetFields}/>        

        <div className="formButtons">
            <button className="formButton" type="button" onClick={remove}>-</button>
            <SubmitButton action={submitAction} text={{ resetText: "Save Preset" }} />
            <button className="formButton" type="button" onClick={append}>+</button>
        </div>
    </>
}

function DayPreset() {
    const [submitAction, setSubmitAction] = useState<SubmitAction>("SUBMIT");

    return (
        <CreateOrEdit
            legendText="Day Preset"
            formSchema={formSchema}
            apiSchema={apiSchema}
            initialFormValues={initialFormValues}
            namesRoute="/api/get/presets/day"
            dataRoute="/api/get/preset/day"
            editRoute="/api/edit/preset/day"
            createRoute="/api/create/preset/day"
            toApi={toApi}
            fromApi={fromApi}
            setSubmitAction={setSubmitAction}
        >
            <DayPresetForm submitAction={submitAction}/>
        </CreateOrEdit>
    );
}

export default DayPreset;
