from flask import Flask, request, jsonify
from validateRequest import validate_json_request, ConstraintSchema, DictSchema, ListSchema
from time import sleep
from dotenv import load_dotenv

app = Flask(__name__)
load_dotenv()
app.config.from_prefixed_env()

@app.route("/get/presets", methods=["GET"])
def get_presets():
    return jsonify([{"id":0, "name":"Hot"}, {"id":1, "name":"Medium"}, {"id":2, "name":"Cold"}])


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
    
    sleep(2)
    
    if not valid:
        return error_message, 400
    return "Success", 200


@app.route("/edit/preset", methods=["GET"])
def edit_preset():
    valid, error_message = validate_json_request(int, request)
    
    sleep(2)
    
    if not valid:
        return error_message, 400
    return "Success", 200


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
    
    sleep(2)
    
    if not valid:
        return error_message, 400
    return "Success", 200