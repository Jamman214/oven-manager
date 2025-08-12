import { useEffect, useState, Fragment } from "react";
import { z } from "zod"

import {
    useForm,
    FormProvider,
    useFieldArray,
    useFormContext,
    type Path
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {Dropdown, type Item} from "../../../components/Dropdown.tsx";
import ErrorAlert from "../../../components/ErrorAlert.tsx";
import {type SubmitAction, SubmitButton} from "../../../components/SubmitButton.tsx";
import {usePostJson} from "../../../hooks/usePostJSON.tsx";
import {useGetJson} from "../../../hooks/useGetJSON.tsx";
import {useUpdateWhenEqual} from "../../../hooks/useUpdateWhenEqual.tsx"
import {EditableNameDropdown, type ClickHandler} from "../../../components/EditableNameDropdown.tsx";


import {
    formSchemas, 
    initialFormValues,
    type FormSchemaInput, 
    type FormSchemaOutput, 
    type SubmittableFormData
} from "../../../../validation/create/schedule/day.tsx"

import "../../../scss/pages/create/schedule/CreateScheduleDay.scss"

interface TimeProps {
    index: number
}

function Time ({index}: TimeProps) {
    const {
        trigger,
        register,
        formState: { errors },
    } = useFormContext<FormSchemaInput, unknown, FormSchemaOutput>();

    const onBlur = async () => {await trigger("time")};

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
                error={errors.time?.[index]?.value?.message}
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
        formState: { errors },
        getValues,
        trigger
    } = useFormContext<FormSchemaInput, unknown, FormSchemaOutput>();

    const path = `preset.${index}.value` as const

    const {onChange, ...otherRegister} = register(
            path,
            {
                setValueAs: (value) => value === "" ? 0 : parseInt(value),
            }
        )

    return <>
        <Dropdown
            options={options}
            initial="Select a Preset"
            disableInitial={false}
            onChange={(e) => {onChange(e); trigger(path)}}
            {...otherRegister}
        />
        <ErrorAlert 
            error={errors.preset?.[index]?.value?.message}
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
        <>
            {presetFields.map((field, index) => 
                <Fragment key={field.id}>
                    {
                        index > 0 && 
                        <Time index={index-1}/>
                    }
                    <Preset index={index} options={options}/>
                </Fragment>
            )}
        </>
    );
}


// ------------------------------------------------------------
// Rest of the form
// ------------------------------------------------------------

function useScheduleData (scheduleID: number | null, modifiedCount: number) {
    const urlScheduleID = scheduleID === null ? "" : "" + scheduleID
    const [_scheduleData, isScheduleDataLoading, scheduleDataError] = useGetJson(
        "/api/get/schedule",
        formSchemas.received,
        {
            requirements: () => scheduleID !== null,
            dependencies: [scheduleID, modifiedCount]
        },
        {id: urlScheduleID}
    )

    const [scheduleData, setScheduleData] = useState<
        z.infer<typeof formSchemas.received>
        | typeof initialFormValues
    >(initialFormValues)

    useEffect(() => {
        if (isScheduleDataLoading || scheduleDataError) return;
        setScheduleData(scheduleID === null ? initialFormValues : _scheduleData || initialFormValues)
    }, [_scheduleData, scheduleID])

    return scheduleData;
}

function useSubmitData (submitData: SubmittableFormData | null) {
    const submitRoute = submitData
        ? ( 
            (submitData.id === null)
            ? "/api/create/schedule"
            : "/api/edit/schedule"
        ) : ""

    const [data, isLoading, error] = usePostJson(
        submitRoute,
        submitData && (
            submitData.id !== null 
                ? submitData 
                : {
                    name: submitData.name,
                    preset: submitData.preset,
                    time: submitData.time
                }
        ),
        {
            requirements: () => (submitData !== null),
            dependencies: [submitData]
        }
    )

    return (
        isLoading ? "SUBMIT"
        : data ? "SUCCEED"
        : error ? "FAIL"
        : "RESET"
    )
}

function CreateScheduleDay() {
    const [validationMode, setValidationMode] = useState<"submitted" | "unsubmitted">("unsubmitted");
    const [submitData, setSubmitData] = useState<SubmittableFormData | null>(null)
    
    const {...methods} = useForm<FormSchemaInput, unknown, FormSchemaOutput>({
        resolver: zodResolver(formSchemas[validationMode]),
        defaultValues: initialFormValues,
        mode: "onBlur",
    });

    const {
        control,
        setValue,
        getValues,
        setError,
        reset,
        watch
    } = methods;

    console.log(methods.formState.errors.time)

    const submitAction = useSubmitData(submitData)
    const editedOrSavedCount = useUpdateWhenEqual(submitAction, "SUCCEED")

    // ID of current preset
    const presetID = watch("id");

    const scheduleData = useScheduleData(presetID, editedOrSavedCount);

    // Reset form values when a preset is selected
    const scheduleSelectHandler = (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>, 
        {value}: {value: string}
    ) => {
        const newPresetID = value === "" ? null : parseInt(value)
        setValidationMode("unsubmitted");
        if (newPresetID === presetID) {
            reset(scheduleData);
        } else {
            setValue("id", newPresetID);
        }
    }

    useEffect(() => {
        // Resets form once loaded
        console.log("reset")
        console.log(scheduleData)
        reset(scheduleData);
    }, [scheduleData])

    useEffect(() => {
        // Blurs selected input and resets form when submitting new schema
        if (submitData && submitData.id === null) {
            const activeElement = document.activeElement
            if (activeElement instanceof HTMLInputElement) {
                activeElement.blur()
            }
            setValidationMode("unsubmitted");
            reset(initialFormValues)
        }
    }, [editedOrSavedCount])

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
        appendPreset({ value: null }, {shouldFocus: false});
        appendTime({value: null}, {shouldFocus: false})
    }

    const remove = () => {
        const l = timeFields.length;
        if (l === 0) return;
        removePreset(l);
        removeTime(l-1)
    }

    // ------------------------------------------------------------
    // Form submission
    // ------------------------------------------------------------
    
    const submitFunc = (
        e?: React.BaseSyntheticEvent
    ) => {
        e?.preventDefault();

        const data = getValues();
        const result = formSchemas.submitted.safeParse(data);
        if (result.success) {
            setSubmitData(result.data);
        } else {
            for (const issue of result.error.issues) {
                const path = issue.path.join(".") as Path<FormSchemaInput>;
                setError(path, {
                    type: "manual",
                    message: issue.message,
                });
            }
        }
        setValidationMode("submitted")
    }

    // ------------------------------------------------------------
    // JSX
    // ------------------------------------------------------------

    return (
        <FormProvider {...methods}>
            <form onSubmit={submitFunc} noValidate>
                <fieldset>
                    <legend className="group-label">Schedule</legend>
                    <EditableNameDropdown 
                        namesRoute="/api/get/schedules"
                        refreshOnChange={editedOrSavedCount}
                        selectHandler={scheduleSelectHandler}
                    />
                </fieldset>

                <fieldset>
                    <legend className="group-label">Presets and Times</legend>
                    <FormFields presetFields={presetFields}/>
                </fieldset>
                

                <div className="formButtons">
                    <button className="formButton" type="button" onClick={remove}>-</button>
                    <SubmitButton action={submitAction} text={{ resetText: "Save Schedule" }} />
                    <button className="formButton" type="button" onClick={append}>+</button>
                </div>
            </form>
        </FormProvider>
    );
}

export default CreateScheduleDay;
