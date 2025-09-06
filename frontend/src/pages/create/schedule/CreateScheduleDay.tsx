import { useState, Fragment } from "react";
import { 
    useFieldArray, 
    useFormContext, 
} from "react-hook-form";
import { z } from "zod"

import { useGetJson } from "../../../hooks/useGetJSON.tsx";

import { Dropdown, type Item } from "../../../components/Dropdown.tsx";
import { ErrorAlert } from "../../../components/ErrorAlert.tsx";
import { SubmitButton} from "../../../components/SubmitButton.tsx";

import { type SubmitAction } from "../../../components/SubmitButton.tsx";

import {
    formSchema,
    apiSchema,
    initialFormValues,
    toApi,
    fromApi,
    type FormInput,
} from "../../../../validation/create/schedule/day.tsx"

import "../../../scss/pages/create/schedule/CreateScheduleDay.scss"
import CreateOrEdit from "../CreateOrEdit.tsx";

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
    options: Item[];
}

function Preset ({index, options}: PresetProps) {
    const {
        register,
        formState: { errors, touchedFields, isSubmitted },
        trigger
    } = useFormContext<FormInput>();

    const path = `preset.${index}.value` as const

    const {onChange, ...otherRegister} = register(path)

    const showError = touchedFields.preset?.[index]?.value || isSubmitted;

    return <>
        <Dropdown
            options={options}
            initial="Select a Preset"
            disableInitial={false}
            onChange={(e) => {onChange(e); trigger(path)}}
            {...otherRegister}
        />
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
    const [data, isLoading, error] = useGetJson<{id: number, name: string}[]>(
        "/api/get/presets",
        z.array(z.object({
            id: z.number().min(0),
            name: z.string().min(1)
        }))
    )
    const options = data || [];

    return (
        <fieldset>
            <legend className="group-label">Presets and Times</legend>
                    
            {presetFields.map((field, index) => 
                <Fragment key={field.id}>
                    {
                        index > 0 && 
                        <Time index={index-1}/>
                    }
                    <Preset index={index} options={options}/>
                </Fragment>
            )}
        </fieldset>
    );
}

interface FormProps {
    submitAction: SubmitAction;
}

function ScheduleDayForm({submitAction}: FormProps) {
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
            <SubmitButton action={submitAction} text={{ resetText: "Save Schedule" }} />
            <button className="formButton" type="button" onClick={append}>+</button>
        </div>
    </>
}

function CreateScheduleDay() {
    const [submitAction, setSubmitAction] = useState<SubmitAction>("SUBMIT");

    return (
        <CreateOrEdit
            legendText="Schedule"
            formSchema={formSchema}
            apiSchema={apiSchema}
            initialFormValues={initialFormValues}
            namesRoute="/api/get/schedules"
            dataRoute="/api/get/schedule"
            editRoute="/api/edit/schedule"
            createRoute="/api/create/schedule"
            toApi={toApi}
            fromApi={fromApi}
            setSubmitAction={setSubmitAction}
        >
            <ScheduleDayForm submitAction={submitAction}/>
        </CreateOrEdit>
    );
}

export default CreateScheduleDay;
