import Button from "react-bootstrap/Button";
import Card from "react-bootstrap/Card";
import React, { useState, useEffect } from "react";

function Presets() {
    const [text, setText] = useState("Waiting");
    const [shouldFetch, setShouldFetch] = useState(false);

    useEffect(() => {
        if (shouldFetch) {
            fetch("/api/test", {
                method: "POST",
                body: JSON.stringify({
                    title: "foo",
                    body: "bar",
                    userId: 1,
                }),
                headers: {
                    "Content-type": "application/json; charset=UTF-8",
                },
            })
                .then((res) => res.text())
                .then((data) => {
                    setText(data);
                });
        }
    }, [shouldFetch]);

    const handleClick = () => {
        setShouldFetch(true);
    };

    return (
        <Card style={{ width: "18rem" }}>
            <Card.Body>
                <Card.Title>{text}</Card.Title>
                <Card.Text>
                    Some quick example text to build on the card title and make
                    up the bulk of the card's content.
                </Card.Text>
                <Button variant="primary" onClick={handleClick}>
                    Go somewhere
                </Button>
            </Card.Body>
        </Card>
    );
}

export default Presets;
