from flask import Flask, request, jsonify
from validateRequest import validate_json_request, ConstraintSchema, DictSchema, ListSchema
from time import sleep
from dotenv import load_dotenv

app = Flask(__name__)
load_dotenv()
app.config.from_prefixed_env()

db_presets = [
    {
        'id': 1,
        'name': "preset1",
        'temperatures': {
            'core': {
                'high': 150,
                'low': 140
            },
            'oven': {
                'high': 90,
                'low': 80
            }
        }
    },
    {
        'id': 2,
        'name': "preset2",
        'temperatures': {
            'core': {
                'high': 310,
                'low': 270
            },
            'oven': {
                'high': 160,
                'low': 145
            }
        }
    }
]

@app.route("/get/presets", methods=["GET"])
def get_presets():
    presets = []
    for preset in db_presets:
        presets.append({'id': preset['id'], 'name': preset['name']})
    return jsonify(presets)


@app.route("/get/preset", methods=["GET"])
def get_preset():
    print(request.args)
    id = request.args.get('id')
    if not id:
        return "expected id", 400
    try:
        id = int(id)
        if id < 1:
            return f'id must be positive', 400
    except:
        return f'id must be int', 400

    for preset in db_presets:
        if (preset['id'] == id):
            return jsonify(preset)
    return f'preset {id} does not exist', 404


@app.route("/create/preset", methods=["POST"])
def create_preset():
    min_temp = 0
    max_temp = 500
   
    limit_schema = ConstraintSchema(int, filter=lambda x : (x >= min_temp) and (x <= max_temp))
    
    sector_schema = ConstraintSchema(
        DictSchema({
            'high': limit_schema,
            'low': limit_schema
        }),
        filter = lambda x: x['high'] > x['low']
    )

    temperture_schema = ConstraintSchema(
        DictSchema({
            'core': sector_schema,
            'oven': sector_schema
        }),
        filter = lambda x: x['core']['low'] >= x['oven']['high']
    )

    name_schema = ConstraintSchema(
        str,
        filter = lambda x: len(x) > 0
    )

    schema = DictSchema({
        'name': name_schema,
        'temperatures': temperture_schema
    })
    
    valid, error_message = validate_json_request(schema, request)
        
    if not valid:
        return error_message, 400
    return "Success", 200


@app.route("/edit/preset", methods=["POST"])
def edit_preset():
    min_temp = 0
    max_temp = 500
   
    limit_schema = ConstraintSchema(int, filter=lambda x : (x >= min_temp) and (x <= max_temp))
    
    sector_schema = ConstraintSchema(
        DictSchema({
            'high': limit_schema,
            'low': limit_schema
        }),
        filter = lambda x: x['high'] > x['low']
    )

    temperture_schema = ConstraintSchema(
        DictSchema({
            'core': sector_schema,
            'oven': sector_schema
        }),
        filter = lambda x: x['core']['low'] >= x['oven']['high']
    )

    name_schema = ConstraintSchema(
        str,
        filter = lambda x: len(x) > 0
    )

    id_schema = ConstraintSchema(
        int,
        filter = lambda x: x >= 1
    )

    schema = DictSchema({
        'id': id_schema,
        'name': name_schema,
        'temperatures': temperture_schema
    })
    
    valid, error_message = validate_json_request(schema, request)
        
    if not valid:
        return error_message, 400

    newPreset = request.get_json()
    
    for i, preset in enumerate(db_presets):
        if (preset['id'] == newPreset['id']):
            db_presets[i] = newPreset # Need to ensure this doesnt contain additional fields
            return "Success", 200
    return f'preset {id} does not exist', 404


@app.route("/create/schedule", methods=["POST"])
def create_schedule():
    max_preset_id = 10 # Temp value before db
    
    preset_constraint = ConstraintSchema(int, filter=lambda x : (x >= 0) and (x <= max_preset_id))
    hour_constraint = ConstraintSchema(int, filter=lambda x : (x >= 0) and (x <= 24))
    minute_constraint = ConstraintSchema(int, filter=lambda x : (x >= 0) and (x <= 60))
   
    schema = DictSchema({
        "firstPreset": preset_constraint,
        "followingPresets":ListSchema(
            DictSchema({
                "preset": preset_constraint,
                "time": DictSchema({
                    "hour": hour_constraint,
                    "minute": minute_constraint
                })
            })
        )
    })
    
    valid, error_message = validate_json_request(schema, request)
        
    if not valid:
        return error_message, 400
    return "Success", 200