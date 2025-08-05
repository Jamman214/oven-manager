from typing import overload, Any, Callable, Optional, Type, TypeAlias, TypeVar, Union
from flask import Request
from abc import abstractmethod, ABC


JsonAtomic = TypeVar('JsonAtomic', str, float, int, bool, None)
JsonCompound = TypeVar('JsonCompound', bound = Union['ListSchema','DictSchema'])

Json: TypeAlias = Type[JsonAtomic] | JsonCompound

ConstrainedJson: TypeAlias = Type[str] | Type[float] | Type[int] | Type[bool] | Type[None] | 'ListSchema' | 'DictSchema' | 'ConstraintSchema'
CJson = TypeVar('CJson', Type[str], Type[float], Type[int], Type[bool], Type[None], 'ListSchema', 'DictSchema', 'ConstraintSchema')

T = TypeVar('T')
Predicate: TypeAlias = Callable[[T],bool]
def tautology(x: Any) -> bool:
    return True

ValidationResult : TypeAlias = tuple[bool, str]


class JsonSchema(ABC):
    @abstractmethod
    def validate(self, json_node: Any) -> ValidationResult:
        pass
        

class ConstraintSchema(JsonSchema):
    # Used to introduce constraints on the child
    # Should not place constraints on the children of the child
    @overload
    def __init__(self, child: 'DictSchema', optional: bool = False, filter_fn: Predicate[dict] = tautology, error_message: str | None = None) -> None:
        ...
    
    @overload
    def __init__(self, child: 'ListSchema', optional: bool = False, filter_fn: Predicate[list] = tautology, error_message: str | None = None) -> None:
        ...
    
    @overload
    def __init__(self, child: Type[JsonAtomic], optional: bool = False, filter_fn: Predicate[JsonAtomic] = tautology, error_message: str | None = None) -> None:
        ...
    
    def __init__(self, child: Json = None, optional: bool = False, filter_fn: Predicate[Any] = tautology, error_message: str | None = None) -> None:
        self.child = child
        self.optional = optional
        self.filter_fn = filter_fn
        self.error_message = error_message

    def validate(self, json: Any) -> ValidationResult:
        if self.optional and json is None:
            return True, ""

        valid, error_message = compare_json_types(self.child, json)
        if valid and not self.filter_fn(json):
            if (self.error_message == None):
                return False, f"Got value: {json} which did not pass filter_fn" 
            context = {'json': json}
            return False, self.error_message.format(**context)
        return valid, error_message


class ListSchema(JsonSchema):
    # Used to represent a JSON array
    def __init__(self, child: CJson):
        self.child: ConstrainedJson = child
        
    def validate(self, json: Any) -> ValidationResult:
        if type(json) != list:
            print(json, type(json))
            return False, f"Received type: {type(json)}, expected type: list"
        return self.validate_list_elements(json)

    def validate_list_elements(self, json_list: list) -> ValidationResult:
        for json in json_list:
            valid, error_message = compare_json_types(self.child, json)
            if not valid:
                return False, error_message
        return True, ""


class DictSchema(JsonSchema):
    # Used to represent a JSON object
    def __init__(self, schema: dict[str, ConstrainedJson]):
        self.schema = schema
    
    def validate(self, json: Any) -> ValidationResult:
        if type(json) != dict:
            return False, f"Received type: {type(json)} {json}, expected type: dict"
        return self.validate_key_value_pairs(json)
    
    def validate_key_value_pairs(self, json_dict: dict) -> ValidationResult:
        for key, schema in self.schema.items():
            json = json_dict.get(key)
            valid, error = compare_json_types(schema, json)
            if (not valid) and (json == None):
                return False, f"Received: {json_dict}, expected key: {key}"
            if not valid:
                return False, error
        return True, ""


def compare_json_types(schema: ConstrainedJson, json: Any) -> ValidationResult:    
    if isinstance(schema, JsonSchema):
        return schema.validate(json)
    elif type(json) == schema:
        return True, ""
    return False, f"Expected type {schema}, got type {type(json)}"


def validate_json_request(schema: ConstrainedJson, 
                          request: Request) -> ValidationResult:
    if not request.is_json:
        return False, "Expected JSON"
    return compare_json_types(schema, request.get_json())

# Common restraints


def expected_keys(schema: 'DictSchema') -> None:
    # Check for keys in the input which don't appear in the schema
    # Missing keys will be caught later
    def check_keys_expected(json_dict: dict):
        json_keys = json_dict.keys()
        schema_keys = schema.schema.keys()
        for key in json_keys:
            if key not in schema_keys:
                return False
        return True
    
    return ConstraintSchema(
        schema,
        filter_fn = check_keys_expected,
        error_message = "Got value: {json} which contained unexpected keys"
    )