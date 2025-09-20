from validateRequest import ConstraintSchema, DictSchema, ListSchema, expected_keys

class AtomicPresetSchemas():
    _min_temp = 0
    _max_temp = 500

    _limit = ConstraintSchema(
        int, 
        filter_fn = lambda x: 
            (x >= AtomicPresetSchemas._min_temp) 
            and (x <= AtomicPresetSchemas._max_temp)
    )
    
    _sector = ConstraintSchema(
        expected_keys(DictSchema({
            'high': _limit,
            'low': _limit
        })),
        filter_fn = lambda x: x['high'] > x['low']
    )

    _temperature = ConstraintSchema(
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
        'temperature': _temperature
    }))

    edit = expected_keys(DictSchema({
        'id': _id,
        'name': _name,
        'temperature': _temperature
    }))

class DayPresetSchemas():    
    _preset = ConstraintSchema(
        int, 
        filter_fn = lambda x: 
            (x >= 0) 
    )

    _hour = ConstraintSchema(int, filter_fn=lambda x : (x >= 0) and (x <= 24))
    _minute = ConstraintSchema(int, filter_fn=lambda x : (x >= 0) and (x <= 60))

    _time = expected_keys(DictSchema({
        "hour": _hour,
        "minute": _minute
    }))

    _name = ConstraintSchema(
        str,
        filter_fn = lambda x: len(x) > 0
    )

    _id = ConstraintSchema(
        int,
        filter_fn = lambda x: x >= 1
    )

    def is_ordered(times):
        for i in range(len(times)-1):
            if (
                times[i]['hour'] > times[i+1]['hour']
                or (
                    times[i]['hour'] == times[i+1]['hour']
                    and times[i]['minute'] >= times[i+1]['minute']
                )
            ):
                return False
        return True

    _time_list = ConstraintSchema(ListSchema(_time), filter_fn=is_ordered)
   
    create = ConstraintSchema(
        expected_keys(DictSchema({
            "name": _name,
            "preset": ListSchema(_preset),
            "time": _time_list
        })),
        filter_fn = lambda x: len(x['preset']) == len(x['time']) + 1
    )
    
    edit = ConstraintSchema(
        expected_keys(DictSchema({
            "id": _id,
            "name": _name,
            "preset": ListSchema(_preset),
            "time": _time_list
        })),
        filter_fn = lambda x: len(x['preset']) == len(x['time']) + 1
    )

class WeekPresetSchemas():   
    _preset = ConstraintSchema(
        int, 
        filter_fn = lambda x: 
            (x >= 0) 
    )

    _presets = ConstraintSchema(
        ListSchema(_preset), 
        filter_fn = lambda x: len(x) == 7
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
            "name": _name,
            "preset": _presets
        }))
    
    edit = expected_keys(DictSchema({
            "id": _id,
            "name": _name,
            "preset": _presets
        }))

class CurrentPreset():
    set_ = expected_keys(DictSchema({
        'id': ConstraintSchema(
            int,
            filter_fn = lambda x: x >= 0
        )
    }))

class RequestSchemas():
    atomicPreset = AtomicPresetSchemas
    dayPreset = DayPresetSchemas
    weekPreset = WeekPresetSchemas
    currentPreset = CurrentPreset
    