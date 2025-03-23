import { useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import { SetStateAction } from "react";
import { UseFormRegister, FieldValues } from "react-hook-form";

type RegisterData = {
    value: number | string;
    onChange: (value: string) => void;
    onBlur: () => void;
};

interface Item {
    id: number;
    name: string;
}

interface fetchData {
    route: string;
    returnFinished?: React.Dispatch<SetStateAction<boolean>>;
    returnData?: React.Dispatch<SetStateAction<Item[]>>;
    required?: boolean;
    registerData?: RegisterData;
}

interface fetchedData {
    data: Item[];
    required?: boolean;
    registerData?: RegisterData;
}

type Params = fetchData | fetchedData;

function FetchDropdown({
    route,
    returnFinished = () => {},
    returnData = () => {},
    required = false,
    registerData = {
        value: -1,
        onChange: () => {},
        onBlur: () => {},
    },
}: fetchData) {
    const [data, setData] = useState<Item[]>([]);

    useEffect(() => {
        fetch(route, { method: "GET" })
            .then((response) => response.json())
            .then((data) => {
                setData(data);
                returnFinished(true);
                returnData(data);
            });
    }, [route]);

    return (
        <Form.Select
            aria-label="Dropdown"
            required={required}
            value={registerData.value}
            onChange={(e) => registerData.onChange(e.target.value)}
            onBlur={registerData.onBlur}
        >
            <option value={-1}>Select a preset</option>
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

function FetchedDropdown({
    data,
    required = false,
    registerData = {
        value: -1,
        onChange: () => {},
        onBlur: () => {},
    },
}: fetchedData) {
    return (
        <Form.Select
            aria-label="Dropdown"
            required={required}
            value={registerData.value}
            onChange={(e) => registerData.onChange(e.target.value)}
            onBlur={registerData.onBlur}
        >
            <option value={-1}>Select a preset</option>
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

function Dropdown(params: Params) {
    if ("data" in params) {
        return FetchedDropdown(params);
    }
    return FetchDropdown(params);
}

export default Dropdown;
