from flask import Flask, request, jsonify
from validateRequest import validate_json_request
from time import sleep
from dotenv import load_dotenv
from requestSchemas import requestSchemas

app = Flask(__name__)
load_dotenv()
app.config.from_prefixed_env()

db_presets = [
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
    id = request.args.get('id', type=int)
    if (not id) or (id < 1):
        return "Invalid id", 400

    for preset in db_presets:
        if (preset['id'] == id):
            return jsonify(preset)
    return f'preset {id} does not exist', 404


@app.route("/create/preset", methods=["POST"])
def create_preset():
    preset, error_message = validate_json_request(requestSchemas.preset.create, request)
    if preset is None:
        return error_message, 400

    max_id = 0
    for existing_preset in db_presets:
        max_id = max(max_id, existing_preset['id'])
    preset['id'] = max_id + 1
    db_presets.append(preset)

    return "Success", 200


@app.route("/edit/preset", methods=["POST"])
def edit_preset():
    preset, error_message = validate_json_request(requestSchemas.preset.edit, request)
    if preset is None:
        return error_message, 400
    
    for i, existing_preset in enumerate(db_presets):
        if (existing_preset['id'] == preset['id']):
            db_presets[i] = preset # Need to ensure this doesnt contain additional fields
            return "Success", 200
    return f'preset {id} does not exist', 404


@app.route("/create/schedule", methods=["POST"])
def create_schedule():    
    schedule, error_message = validate_json_request(requestSchemas.schedule.create, request)
    if schedule is None:
        return error_message, 400
    return "Success", 200