from flask import Flask, request, jsonify
from validateRequest import validate_json_request, ConstraintSchema, DictSchema, ListSchema
from time import sleep

app = Flask(__name__)
app.config.from_prefixed_env()

@app.route("/get-presets/single", methods=["GET"])
def get_presets_single():
    return jsonify([{"id":0, "name":"Off"}, {"id":1, "name":"preset 0"}, {"id":2, "name":"preset 1"}])






@app.route("/set-preset/multiple", methods=["POST"])
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