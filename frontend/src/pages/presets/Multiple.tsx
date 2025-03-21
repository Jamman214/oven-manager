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

import Dropdown from "../../components/Dropdown";

interface Item {
    id: string;
    name: string;
}

function PresetMultiple() {
    const [fetched, setFetched] = useState<boolean>(false);
    const [data, setData] = useState<Item[]>([]);
    const [count, setCount] = useState<number>(0);

    const decrementCount = () => {
        if (count > 0) {
            setCount(count - 1);
        }
    };

    return (
        <Form>
            <Form.Group className="mb-3">
                <Row>
                    <Col xs={12} md={{ span: 6, offset: 3 }}>
                        {Dropdown({
                            route: "/api/get-presets/single",
                            setFinished: setFetched,
                            setData: setData,
                            required: true,
                        })}
                    </Col>
                </Row>

                {Array.from({ length: count }, (_, i) => {
                    return (
                        <Row key={i}>
                            <Col xs={12} md={{ span: 6, offset: 3 }}>
                                <FloatingLabel
                                    controlId={"floatingInput-"}
                                    label="End Time"
                                    className="mb-3 text-center"
                                >
                                    <Form.Control
                                        type="time"
                                        placeholder="HH:MM"
                                        required
                                    />
                                </FloatingLabel>
                            </Col>
                            <Col xs={12} md={{ span: 6, offset: 3 }}>
                                {Dropdown({
                                    data: data,
                                    required: true,
                                })}
                            </Col>
                        </Row>
                    );
                })}
            </Form.Group>
            <Row>
                <Col xs={3} md={4} className="d-flex justify-content-end">
                    <Button type="button" onClick={decrementCount}>
                        -
                    </Button>
                </Col>
                <Col xs={6} md={4} className="d-flex justify-content-center">
                    <Button type="submit">Save Preset</Button>
                </Col>
                <Col xs={3} md={4} className="d-flex justify-content-start">
                    <Button
                        type="button"
                        onClick={() => {
                            setCount(count + 1);
                        }}
                    >
                        +
                    </Button>
                </Col>
            </Row>
        </Form>
    );
}

export default PresetMultiple;
