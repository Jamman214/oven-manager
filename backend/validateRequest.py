from collections.abc import Iterable
from typing import Callable, TypeVar, Optional, TypeAlias, Type, overload, get_args, Protocol, Any
from types import UnionType
from flask import Request

JsonAtomic: TypeAlias = str | int | float | bool | None
JsonSchemaMember: TypeAlias = Type[JsonAtomic] | 'ListSchema' | 'DictSchema'
JsonSchemaMemberExtended: TypeAlias = JsonSchemaMember | 'ConstraintSchema'
JsonMember: TypeAlias = JsonAtomic | list | dict

A = TypeVar('A', bound=JsonAtomic)
J = TypeVar('J', bound=JsonMember)

class ConstraintSchema:
    @overload
    def __init__(self, schema: 'ListSchema', filter: Callable[[list], bool]) -> None:
        ...
    
    @overload
    def __init__(self, schema: 'DictSchema', filter: Callable[[dict], bool]) -> None:
        ...
        
    @overload
    def __init__(self, schema: Type[A], filter: Callable[[A], bool]) -> None:
        ...
    
    def __init__(self, schema: JsonSchemaMember, filter: Callable[[Any],bool]) -> None:
        self.schema = schema
        self.filter = filter
    
    def validate(self, json_member: JsonMember):        
        valid, error_message = compare_json_types(self.schema, json_member)
        if valid and not self.filter(json_member):
            return False, f"Got member: {json_member} which did not pass filter" 
        return valid, error_message


class ListSchema:
    def __init__(self, item_schema: JsonSchemaMemberExtended) -> None:
        self.item_schema = item_schema
        
    def validate(self, json_list: JsonMember) -> tuple[bool, Optional[str]]:
        # validate type of target
        if type(json_list) != list:
            return False, f"Received type: {type(json_list)}, expected type: list"
        
        # validate type of target
        for json_member in json_list:
            valid, error_message = compare_json_types(self.item_schema, json_member)
            if not valid:
                return False, error_message
        return True, None


class DictSchema:
    def __init__(self, items:dict[str,JsonSchemaMemberExtended]) -> None:
        self.items = items
    
    def validate(self, json_dict: JsonMember):
        # validate type of target
        if type(json_dict) != dict:
            return False, f"Received type: {type(json_dict)}, expected type: dict"
        
        # validate type of target
        for key, schema in self.items.items():
            json_member = json_dict.get(key)
            return compare_json_types(schema, json_member)
        return True, None


def compare_json_types(schema: JsonSchemaMemberExtended, json_member: JsonMember) -> tuple[bool, Optional[str]]:    
    if isinstance(schema, (ConstraintSchema, ListSchema, DictSchema)):
        return schema.validate(json_member)
    
    elif schema == type(json_member):
        return True, None
    
    return False, f"Expected type {schema}, got type {type(json_member)}"


def validate_json_request(request: Request, schema: JsonSchemaMember):
    if not request.is_json:
        return False, "Expected JSON"
    return compare_json_types(schema, request.get_json())


my_schema = ConstraintSchema(
    ListSchema(
        ConstraintSchema(int, lambda x: x>5)
    ),
    lambda x: len(x) >= 3
)



valid, output = compare_json_types(my_schema, [6,7,10])
print(f"{valid = }, {output = }")




# AnyType: TypeAlias = UnionType | Type

# def decompose(union: UnionType) -> tuple[AnyType]:
#     return get_args(union)

# def member_types(type_: AnyType) -> set[AnyType]:
#     if isinstance(type_, type):
#         return {type_}
#     subtypes = set()
#     for subtype in decompose(type_):
#         subtypes |= member_types(subtype)
#     return subtypes

# def is_member_of(type_, union_type):
#     return type_ in member_types(union_type)