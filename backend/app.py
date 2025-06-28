from flask import Flask, request, jsonify
from validateRequest import validate_json_request, ConstraintSchema, DictSchema, ListSchema
from time import sleep
from dotenv import load_dotenv

app = Flask(__name__)
load_dotenv()
app.config.from_prefixed_env()

@app.route("/get/presets", methods=["GET"])
def get_presets_single():
    return jsonify([{"id":0, "name":"Hot"}, {"id":1, "name":"Medium"}, {"id":2, "name":"Cold"}])



@app.route("/create/preset", methods=["POST"])
def set_preset_single():
    min_temp = 0
    max_temp = 500
   
    temperature_schema = ConstraintSchema(int, filter=lambda x : (x >= min_temp) and (x <= max_temp))
    
    limit_schema = ConstraintSchema(
        DictSchema({
            'high': temperature_schema,
            'low':temperature_schema
        }),
        filter = lambda x: x['high'] > x['low']
    )

    schema = ConstraintSchema(
        DictSchema({
            'core': limit_schema,
            'oven': limit_schema
        }),
        filter = lambda x: x['core']['low'] >= x['oven']['high']
    )
    
    valid, error_message = validate_json_request(schema, request)
    
    sleep(2)
    
    if not valid:
        return error_message, 400
    return "Success", 200



@app.route("/create/schedule", methods=["POST"])
def set_preset_multiple():
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