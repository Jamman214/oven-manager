import { useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import { SetStateAction } from "react";

interface Item {
    id: string;
    name: string;
}

interface fetchData {
    route: string;
    setFinished?: React.Dispatch<SetStateAction<boolean>>;
    setData?: React.Dispatch<SetStateAction<Item[]>>;
    required?: boolean;
}

interface fetchedData {
    data: Item[];
    required?: boolean;
}

type Params = fetchData | fetchedData;

function FetchDropdown(params: fetchData) {
    const [data, setData] = useState<Item[]>([]);

    useEffect(() => {
        fetch(params.route)
            .then((response) => response.json())
            .then((data) => {
                setData(data);
                if (params.setFinished) {
                    params.setFinished(true);
                }
                if (params.setData) {
                    params.setData(data);
                }
            });
    }, []);

    return (
        <Form.Select
            aria-label="Default select example"
            {...("required" in params && { required: params.required })}
        >
            <option value="">Select a preset</option>
            {data.map((item) => {
                return (
                    <option key={item.id} value={item.id}>
                        {item.name}
                    </option>
                );
            })}
        </Form.Select>
    );
}

function FetchedDropdown(params: fetchedData) {
    return (
        <Form.Select
            aria-label="Default select example"
            {...("required" in params && { required: params.required })}
        >
            <option value="">Select a preset</option>
            {params.data.map((item) => {
                return (
                    <option key={item.id} value={item.id}>
                        {item.name}
                    </option>
                );
            })}
        </Form.Select>
    );
}

function Dropdown(params: Params) {
    if ("data" in params) {
        return FetchedDropdown(params);
    }
    return FetchDropdown(params);
}

export default Dropdown;
