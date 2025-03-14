from collections.abc import Iterable
from typing import Callable, TypeVar, Optional, TypeAlias, Type, overload, Any, get_args, Generic, Union
from types import NoneType
from flask import Request
from abc import ABC, abstractmethod


JsonSAN = TypeVar('JsonSAN', str, float, int, bool, None) # Json Schema Atomic Node
JsonSCN = TypeVar('JsonSCN', bound = Union['ListSchema','DictSchema']) # Json Schema Compound Node
JsonNode: TypeAlias = Type[JsonSAN] | JsonSCN
JsonNodeConstrained: TypeAlias = JsonNode | 'ConstraintSchema'      

T = TypeVar('T')
Predicate: TypeAlias = Callable[[T],bool]
def tautology(x: Any) -> bool:
    return True

ValidationResult : TypeAlias = tuple[bool, Optional[str]]


class JsonSchema(ABC):
    @abstractmethod
    def validate(self, json_node: Any) -> ValidationResult:
        pass
        

class ConstraintSchema(JsonSchema):
    # Used to introduce constraints on the child node
    # Should not place constraints on the children of the child node
    @overload
    def __init__(self, child_node: 'DictSchema', optional: bool = False, filter: Predicate[dict] = tautology) -> None:
        ...
    
    @overload
    def __init__(self, child_node: 'ListSchema', optional: bool = False, filter: Predicate[list] = tautology) -> None:
        ...
    
    @overload
    def __init__(self, child_node: Type[JsonSAN], optional: bool = False, filter: Predicate[JsonSAN] = tautology) -> None:
        ...
    
    def __init__(self, child_node: JsonNode = None, optional: bool = False, filter: Predicate[Any] = tautology) -> None:
        self.child_node = child_node
        self.optional = optional
        self.filter = filter

    def validate(self, json_node: Any) -> ValidationResult:
        if self.optional and json_node is None:
            return True, None

        valid, error_message = compare_json_types(self.child_node, json_node)

        if valid and not self.filter(json_node):
            return False, f"Got value: {json_node} which did not pass filter" 
        return valid, error_message


class ListSchema(JsonSchema):
    # Used to represent a JSON array
    def __init__(self, child_node: JsonNodeConstrained):
        self.child_node = child_node
        
    def validate(self, json_node: Any) -> ValidationResult:
        if type(json_node) != list:
            return False, f"Received type: {type(json_node)}, expected type: list"
        return self.validate_list_elements(json_node)

    def validate_list_elements(self, json_list: list):
        for json_node in json_list:
            valid, error_message = compare_json_types(self.child_node, json_node)
            if not valid:
                return False, error_message
        return True, None


class DictSchema(JsonSchema):
    # Used to represent a JSON object
    def __init__(self, schema: dict[str, JsonNodeConstrained]):
        self.schema = schema
    
    def validate(self, json_node: Any) -> ValidationResult:
        if type(json_node) != dict:
            return False, f"Received type: {type(json_node)}, expected type: dict"
        return self.validate_key_value_pairs(json_node)
    
    def validate_key_value_pairs(self, json_dict: dict) -> ValidationResult:
        for key, schema_node in self.schema.items():
            json_node = json_dict.get(key)
            return compare_json_types(schema_node, json_node)
        return True, None


def compare_json_types(schema_node: JsonNodeConstrained, json_node: Any) -> ValidationResult:    
    if isinstance(schema_node, JsonSchema):
        return schema_node.validate(json_node)
    elif type(json_node) == schema_node:
        return True, None
    
    return False, f"Expected type {schema_node}, got type {type(json_node)}"


def validate_json_request(schema_node: JsonNodeConstrained, request: Request) -> ValidationResult:
    if not request.is_json:
        return False, "Expected JSON"
    return compare_json_types(schema_node, request.get_json())