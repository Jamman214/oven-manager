from flask import Flask, request, jsonify
from validateRequest import validate_json_request
from time import sleep
from dotenv import load_dotenv
from requestSchemas import requestSchemas

app = Flask(__name__)
load_dotenv()
app.config.from_prefixed_env()

db_presets = {
    'atomic': 
        [
            {
                'id': 1,
                'name': "preset1",
                'temperature': {
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
                'temperature': {
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
        ],  

    'day': 
        [
            {
                'id': 1,
                'name': "schedule1",
                'preset': [1, 2, 1],
                'time': [{'hour': 12, 'minute': 24}, {'hour': 23, 'minute': 12}]
            },
            {
                'id': 2,
                'name': "schedule2",
                'preset': [2],
                'time': []
            }
        ]
}

@app.route("/get/presets/atomic", methods=["GET"])
def get_presets_atomic():
    presets = []
    for preset in db_presets['atomic']:
        presets.append({'id': preset['id'], 'name': preset['name']})
    return jsonify(presets)

@app.route("/get/presets/day", methods=["GET"])
def get_presets_day():
    presets = []
    for preset in db_presets['day']:
        presets.append({'id': preset['id'], 'name': preset['name']})
    return jsonify(presets)


@app.route("/get/preset/atomic", methods=["GET"])
def get_preset_atomic():
    id = request.args.get('id', type=int)
    if (not id) or (id < 1):
        return "Invalid id", 400

    for preset in db_presets['atomic']:
        if (preset['id'] == id):
            return jsonify(preset)
    return f'preset {id} does not exist', 404

@app.route("/get/preset/day", methods=["GET"])
def get_preset_day():
    id = request.args.get('id', type=int)
    if (not id) or (id < 1):
        return "Invalid id", 400

    for preset in db_presets['day']:
        if (preset['id'] == id):
            return jsonify(preset)
    return f'preset {id} does not exist', 404


@app.route("/create/preset/atomic", methods=["POST"])
def create_preset_atomic():
    preset, error_message = validate_json_request(requestSchemas.atomicPreset.create, request)
    if preset is None:
        return error_message, 400

    max_id = 0
    for existing_preset in db_presets['atomic']:
        max_id = max(max_id, existing_preset['id'])
    preset['id'] = max_id + 1
    db_presets['atomic'].append(preset)

    return "Success", 200

@app.route("/create/preset/day", methods=["POST"])
def create_preset_day():
    preset, error_message = validate_json_request(requestSchemas.dayPreset.create, request)
    if preset is None:
        return error_message, 400

    max_id = 0
    for existing_preset in db_presets['day']:
        max_id = max(max_id, existing_preset['id'])
    preset['id'] = max_id + 1
    db_presets['day'].append(preset)

    return "Success", 200

@app.route("/edit/preset/atomic", methods=["POST"])
def edit_preset_atomic():
    preset, error_message = validate_json_request(requestSchemas.atomicPreset.edit, request)
    if preset is None:
        return error_message, 400
    
    for i, existing_preset in enumerate(db_presets['atomic']):
        if (existing_preset['id'] == preset['id']):
            db_presets['atomic'][i] = preset # Need to ensure this doesnt contain additional fields
            return "Success", 200
    return f'preset {id} does not exist', 404

@app.route("/edit/preset/day", methods=["POST"])
def edit_preset_day():
    preset, error_message = validate_json_request(requestSchemas.dayPreset.edit, request)
    if preset is None:
        return error_message, 400
    
    for i, existing_preset in enumerate(db_presets['day']):
        if (existing_preset['id'] == preset['id']):
            db_presets['day'][i] = preset # Need to ensure this doesnt contain additional fields
            return "Success", 200
    return f'preset {id} does not exist', 404