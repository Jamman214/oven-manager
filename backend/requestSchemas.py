from validateRequest import ConstraintSchema, DictSchema, ListSchema, expected_keys

class PresetSchemas():
    _min_temp = 0
    _max_temp = 500

    _limit = ConstraintSchema(
        int, 
        filter_fn = lambda x: 
            (x >= PresetSchemas._min_temp) 
            and (x <= PresetSchemas._max_temp)
    )
    
    _sector = ConstraintSchema(
        expected_keys(DictSchema({
            'high': _limit,
            'low': _limit
        })),
        filter_fn = lambda x: x['high'] > x['low']
    )

    _temperatures = ConstraintSchema(
        expected_keys(DictSchema({
            'core': _sector,
            'oven': _sector
        })),
        filter_fn = lambda x: x['core']['low'] >= x['oven']['high']
    )

    _name = ConstraintSchema(
        str,
        filter_fn = lambda x: len(x) > 0
    )

    _id = ConstraintSchema(
        int,
        filter_fn = lambda x: x >= 1
    )

    create = expected_keys(DictSchema({
        'name': _name,
        'temperatures': _temperatures
    }))

    edit = expected_keys(DictSchema({
        'id': _id,
        'name': _name,
        'temperatures': _temperatures
    }))

class ScheduleSchemas():
    _max_preset_id = 10 # Is this necessary? Could be implemented with triggers later
    
    _preset = ConstraintSchema(
        int, 
        filter_fn = lambda x: 
            (x >= 0) 
            and (x <= ScheduleSchemas.max_preset_id)
    )

    _hour = ConstraintSchema(int, filter_fn=lambda x : (x >= 0) and (x <= 24))
    _minute = ConstraintSchema(int, filter_fn=lambda x : (x >= 0) and (x <= 60))

    _time = expected_keys(DictSchema({
        "hour": _hour,
        "minute": _minute
    }))

    _additional_preset = expected_keys(DictSchema({
        "preset": _preset,
        "time": _time
    }))
   
    create = expected_keys(DictSchema({
        "firstPreset": _preset,
        "followingPresets": ListSchema(_additional_preset)
    }))

class requestSchemas():
    preset = PresetSchemas
    schedule = ScheduleSchemas
    