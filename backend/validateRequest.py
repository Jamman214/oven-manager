from collections.abc import Iterable
from typing import Callable, TypeVar, Optional, TypeAlias, Type, overload, Any
from flask import Request

# Received JSON types
AtomicJsonNode: TypeAlias = str | int | float | bool | None 
AJNode = TypeVar('AJNode', bound=AtomicJsonNode)
JsonNode: TypeAlias = AtomicJsonNode | list | dict

# Expected JSON types
JsonSchemaNode: TypeAlias = Type[AtomicJsonNode] | 'ListSchema' | 'DictSchema'
JsonSchemaNodeExtended: TypeAlias = JsonSchemaNode | 'ConstraintSchema'

T = TypeVar('T')
Predicate: TypeAlias = Callable[[T],bool]

# If valid: True, None
# Otherwise: False, error_message
ValidationResult : TypeAlias = tuple[bool, Optional[str]]


class ConstraintSchema:
    # Used to introduce constraints on the child node
    # Should not place constraints on the children of the child node
    
    @overload
    def __init__(self, schema_node: 'ListSchema', filter: Predicate[list]) -> None:
        ...
    
    @overload
    def __init__(self, schema_node: 'DictSchema', filter: Predicate[dict]) -> None:
        ...
        
    @overload
    def __init__(self, schema_node: Type[AJNode], filter: Predicate[AJNode]) -> None:
        ...
    
    def __init__(self, schema_node: JsonSchemaNode, filter: Predicate[Any]) -> None:
        self.schema_node = schema_node
        self.filter = filter
    
    def validate(self, json_node: JsonNode) -> ValidationResult:
        # Validate type of node  
        valid, error_message = compare_json_types(self.schema_node, json_node)
        # Validate value of node
        if valid and not self.filter(json_node):
            return False, f"Got member: {json_node} which did not pass filter" 
        return valid, error_message


class ListSchema:
    # Used to represent a JSON array
    
    def __init__(self, schema_node: JsonSchemaNodeExtended) -> None:
        self.schema_node = schema_node
        
    def validate(self, json_list: JsonNode) -> ValidationResult:
        # validate type of node
        if type(json_list) != list:
            return False, f"Received type: {type(json_list)}, expected type: list"
        
        # validate contents of node
        for json_node in json_list:
            valid, error_message = compare_json_types(self.schema_node, json_node)
            if not valid:
                return False, error_message
        return True, None


class DictSchema:
    # Used to represent a JSON object
    
    def __init__(self, schema_nodes: dict[str,JsonSchemaNodeExtended]) -> None:
        self.schema_nodes = schema_nodes
    
    def validate(self, json_dict: JsonNode) -> ValidationResult:
        # validate type of node
        if type(json_dict) != dict:
            return False, f"Received type: {type(json_dict)}, expected type: dict"
        
        # validate contents of node
        for key, schema_node in self.schema_nodes.items():
            json_node = json_dict.get(key)
            return compare_json_types(schema_node, json_node)
        return True, None


def compare_json_types(schema_node: JsonSchemaNodeExtended, json_node: JsonNode) -> ValidationResult:    
    if isinstance(schema_node, (ConstraintSchema, ListSchema, DictSchema)):
        return schema_node.validate(json_node)

    elif schema_node == type(json_node):
        return True, None
    
    return False, f"Expected type {schema_node}, got type {type(json_node)}"


def validate_json_request(request: Request, schema_node: JsonSchemaNode) -> ValidationResult:
    if not request.is_json:
        return False, "Expected JSON"
    return compare_json_types(schema_node, request.get_json())