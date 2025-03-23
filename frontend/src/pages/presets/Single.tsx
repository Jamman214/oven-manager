import { useEffect, useState } from "react";
import { number, z } from "zod";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Alert from "react-bootstrap/Alert";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

function getSchema() {
    const minTemp = 0;
    const maxTemp = 500;

    const numSchema = z.preprocess(
        (val) => (Number.isNaN(val) ? undefined : Number(val)), // Convert empty string to undefined
        z.number().min(minTemp, "Too low").max(maxTemp, "Too high").optional()
    );

    return z
        .object({
            coreHigh: numSchema,
            coreLow: numSchema,
            ovenHigh: numSchema,
            ovenLow: numSchema,
        })
        .superRefine((data, ctx) => {
            if (data.coreLow && data.coreHigh && data.coreLow > data.coreHigh) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Core High Temp must be greater than Core Low Temp.`,
                    path: ["coreHigh"],
                });
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Core Low Temp must be lower than Core High Temp.`,
                    path: ["coreLow"],
                });
            }
        })
        .superRefine((data, ctx) => {
            if (data.ovenLow && data.ovenHigh && data.ovenLow > data.ovenHigh) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Oven High Temp must be greater than Oven Low Temp.`,
                    path: ["ovenHigh"],
                });
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Oven Low Temp must be lower than Oven High Temp.`,
                    path: ["ovenLow"],
                });
            }
        })
        .superRefine((data, ctx) => {
            if (data.ovenHigh && data.coreLow && data.ovenHigh > data.coreLow) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Core temperature must be greater than Oven temperature.`,
                    path: ["coreLow"],
                });
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Oven temperature must be lower than Core temperature.`,
                    path: ["ovenHigh"],
                });
            }
        });
}

function capitalise(word: string) {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

function PresetSingle() {
    const sectors = ["core", "oven"] as const;
    type Sector = (typeof sectors)[number];

    const limits = ["High", "Low"] as const;
    type Limit = (typeof limits)[number];

    type SectorLimit = `${Sector}${Limit}`;
    const sectorLimits = [
        "coreHigh",
        "coreLow",
        "ovenHigh",
        "ovenLow",
    ] as SectorLimit[];

    const combineSectorLimit = (sector: Sector, limit: Limit): SectorLimit => {
        return `${sector}${limit}`;
    };

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        trigger,
    } = useForm({
        resolver: zodResolver(getSchema()),
        mode: "onChange",
    });

    const coreHighValue = watch("coreHigh");
    useEffect(() => {
        trigger("coreLow");
        console.log(coreHighValue);
    }, [coreHighValue, trigger]);

    const coreLowValue = watch("coreLow");
    useEffect(() => {
        trigger("coreHigh");
        trigger("ovenHigh");
    }, [coreLowValue, trigger]);

    const ovenHighValue = watch("ovenHigh");
    useEffect(() => {
        trigger("ovenLow");
        trigger("coreLow");
    }, [ovenHighValue, trigger]);

    const ovenLowValue = watch("ovenLow");
    useEffect(() => {
        trigger("ovenHigh");
    }, [ovenLowValue, trigger]);

    const onSubmit = (data: {
        coreHigh?: number;
        coreLow?: number;
        ovenHigh?: number;
        ovenLow?: number;
    }) => {
        console.log("Submitted data:", data);
    };

    const handleSubmitWrapper = (e: React.FormEvent<HTMLFormElement>) => {
        handleSubmit(onSubmit)(e);
    };

    const temperatureInputs = (sector: Sector) => {
        return limits.map((limit: Limit, i) => {
            const field = combineSectorLimit(sector, limit); // Combine sector and limit into a single type
            const fieldError = errors[field];
            return (
                <Col md={i % 2 === 0 ? { span: 3, offset: 3 } : 3} key={i}>
                    <FloatingLabel
                        controlId={"floatingInput-" + field}
                        label={limit}
                        className="mb-3 text-center"
                    >
                        <Form.Control
                            type="number"
                            placeholder=" "
                            {...register(field, { valueAsNumber: true })}
                            isInvalid={!!fieldError}
                            required
                        />

                        {fieldError && (
                            <Alert variant="danger">{fieldError.message}</Alert>
                        )}
                    </FloatingLabel>
                </Col>
            );
        });
    };

    const coreAndOvenInputs = sectors.map((sector: Sector, i) => {
        return (
            <Form.Group className="mb-3" key={i}>
                <Row>
                    <Col md={{ span: 6, offset: 3 }}>
                        <Form.Label>
                            {capitalise(sector)} Temperature
                        </Form.Label>
                    </Col>
                </Row>
                <Row>{temperatureInputs(sector)}</Row>
            </Form.Group>
        );
    });

    return (
        <Form onSubmit={handleSubmitWrapper}>
            {coreAndOvenInputs}
            <Row className="d-flex justify-content-center">
                <Col xs={6} className="text-center">
                    <Button type="submit">Save Preset</Button>
                </Col>
            </Row>
        </Form>
    );
}

export default PresetSingle;
