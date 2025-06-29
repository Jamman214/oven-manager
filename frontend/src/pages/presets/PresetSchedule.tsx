import { useEffect, useState, Fragment } from "react";
import { z } from "zod"

import {
    useForm,
    FormProvider,
    useFieldArray,
    useFormContext,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

import {Dropdown, type Item} from "../../components/Dropdown.tsx";
import ErrorAlert from "../../components/ErrorAlert.tsx";
import {type SubmitAction, SubmitButton} from "../../components/SubmitButton.tsx";
import {usePostJson} from "../../hooks/usePostJSON.tsx";
import {useGetJson} from "../../hooks/useGetJSON.tsx";

import { formSchema, type FormInput, type FormOutput}  from "../../../validation/presets/schedule.tsx"

interface TimeProps {
    index: number
}

function Time ({index}: TimeProps) {
    const {
        trigger,
        register,
        formState: { errors },
    } = useFormContext<FormInput, unknown, FormOutput>();

    const onBlur = async () => {await trigger()};

    return (
        <Col
            className="mb-3"
            xs={12}
            md={{ span: 6, offset: 3 }}
        >
            <FloatingLabel
                controlId={`floatingInput-time-${index}`}
                label="End Time"
            >
                <Form.Control
                    type="time"
                    placeholder="HH:MM"
                    {...register(
                        `time.${index}.value`,
                        {onBlur}
                    )}
                    isInvalid={Boolean(errors.time?.[index]?.value)}
                />
                <ErrorAlert 
                    error={errors.time?.[index]?.value?.message}
                />
            </FloatingLabel>
        </Col>
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
    } = useFormContext<FormInput, unknown, FormOutput>();

    return (
        <Col
            className="mb-3"
            xs={12}
            md={{ span: 6, offset: 3 }}
        >
            <Dropdown
                options={options}
                initial="Select a Preset"
                {...register(
                    `preset.${index}.value`,
                )}
                isInvalid={Boolean(errors.preset?.[index]?.message)}
            />
        </Col>
    )
}

interface FormFieldsProps {
    timeFields: Record<"id", string>[];
    presetFields: Record<"id", string>[];
}

function FormFields({timeFields, presetFields} : FormFieldsProps) {
    const {
        formState: { errors },
    } = useFormContext<FormInput, unknown, FormOutput>();

    const [data, isLoading, error] = useGetJson<Item[]>(
        "/api/get-presets/single",
        z.array(z.object({
            id: z.number().min(0),
            name: z.string().min(1)
        }))
    )
    const options = data || [];

    return (
        <>
            {presetFields.map((field, index) => 
                <Row key={field.id}>
                    {
                        index > 0 && 
                        <Time index={index-1}/>
                    }
                    <Preset index={index} options={options}/>
                </Row>
            )}
        </>
    );
}

function PresetSchedule() {
    
    // Status of submission
    const [isSubmitting, setSubmitting] = useState<boolean>(false);
    const [submitEvent, setSubmitEvent] =
        useState<React.FormEvent<HTMLFormElement>>();
    
    // Define TypeScript types based on the schema
    type FormValues = z.infer<typeof formSchema>;

    const {...methods} = useForm<FormInput, unknown, FormOutput>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            preset: [{value: ""}],
            time: [],
        },
        mode: "onBlur",
    });

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = methods;

    // Setup field array for dynamic times and presets added to form
    const { fields: presetFields, append: appendPreset, remove: removePreset } = useFieldArray({
        control,
        name: "preset",
    });

    const { fields: timeFields, append: appendTime, remove: removeTime } = useFieldArray({
        control,
        name: "time",
    });

    const append = () => {
        appendPreset({ value: "" }, {shouldFocus: false});
        appendTime({value: null}, {shouldFocus: false})
    }

    const remove = () => {
        const l = timeFields.length;
        if (l === 0) return;
        removePreset(l);
        removeTime(l-1)
    }

    // Stores form data
    const [dataToSend, sendData] = useState<FormValues | null>(null);

    const [data, isLoading, error] = usePostJson(
        "/api/set-preset/multiple",
        dataToSend,
        {
            requirements: () => dataToSend !== null,
            dependencies: [dataToSend]
        }
    )

    const submitAction: SubmitAction = (
        isLoading ? "SUBMIT"
        : data ? "SUCCEED"
        : error ? "FAIL"
        : "RESET"
    )

    // On successful validation set submit button text and send data
    const onSubmit = (data: FormValues) => {
        sendData(data);
    };

    // Handle the submit event (Seperate to allow isSubmitting to update)
    useEffect(() => {
        if (!submitEvent) return;
    }, [submitEvent]);

    // Cancel default behaviour then set submitting and submitEvent
    const handleSubmitWrapper = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitEvent(e);
    };

    // Actual form
    return (
        <Container>
            <FormProvider {...methods}>
                <Form onSubmit={handleSubmitWrapper} noValidate>
                    <Form.Group className="mb-3 mt-3">
                        <FormFields {...{timeFields, presetFields}}/>
                    </Form.Group>
                    <Row>
                        <Col xs={3} md={4} className="d-flex justify-content-end">
                            <Button
                                type="button"
                                onClick={remove}
                            >
                                -
                            </Button>
                        </Col>
                        <Col xs={6} md={4} className="d-flex justify-content-center">
                            <SubmitButton action={submitAction} text={{ resetText: "Save Schedule" }} />
                        </Col>
                        <Col xs={3} md={4} className="d-flex justify-content-start">
                            <Button
                                type="button"
                                onClick={append}
                            >
                                +
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </FormProvider>
        </Container>
    );
}

export default PresetSchedule;
