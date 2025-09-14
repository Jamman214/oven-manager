from flask import Flask, request, jsonify
from validateRequest import validate_json_request
from time import sleep
from dotenv import load_dotenv
from requestSchemas import requestSchemas
import math
import random

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
                'id': 3,
                'name': "schedule1",
                'preset': [1, 2, 1],
                'time': [{'hour': 12, 'minute': 24}, {'hour': 23, 'minute': 12}]
            },
            {
                'id': 4,
                'name': "schedule2",
                'preset': [2],
                'time': []
            }
        ],
    
    'week' : []
}

db_current_preset = {'id': 0}

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

@app.route("/get/presets/week", methods=["GET"])
def get_presets_week():
    presets = []
    for preset in db_presets['week']:
        presets.append({'id': preset['id'], 'name': preset['name']})
    return jsonify(presets)

@app.route("/get/presets/all", methods=["GET"])
def get_presets_all():
    presets = {'atomic': [], 'day': [], 'week': []}
    for presetType in ['day', 'atomic', 'week']:
        for preset in db_presets[presetType]:
            presets[presetType].append({'id': preset['id'], 'name': preset['name']})
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

@app.route("/get/preset/week", methods=["GET"])
def get_preset_week():
    id = request.args.get('id', type=int)
    if (not id) or (id < 1):
        return "Invalid id", 400

    for preset in db_presets['week']:
        if (preset['id'] == id):
            return jsonify(preset)
    return f'preset {id} does not exist', 404

@app.route("/get/config", methods=["GET"])
def get_config():

    print("get", db_current_preset['id'])
    return jsonify({'id': db_current_preset['id']})

@app.route("/set/config", methods=["POST"])
def set_config():
    preset, error_message = validate_json_request(requestSchemas.currentPreset.set_, request)
    if preset is None:
        return error_message, 400
    print("set", preset['id'])
    db_current_preset['id'] = preset['id']
    return '', 204


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

@app.route("/create/preset/week", methods=["POST"])
def create_preset_week():
    preset, error_message = validate_json_request(requestSchemas.weekPreset.create, request)
    if preset is None:
        return error_message, 400

    max_id = 0
    for existing_preset in db_presets['week']:
        max_id = max(max_id, existing_preset['id'])
    preset['id'] = max_id + 1
    db_presets['week'].append(preset)

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

@app.route("/edit/preset/week", methods=["POST"])
def edit_preset_week():
    preset, error_message = validate_json_request(requestSchemas.weekPreset.edit, request)
    if preset is None:
        return error_message, 400
    
    for i, existing_preset in enumerate(db_presets['week']):
        if (existing_preset['id'] == preset['id']):
            db_presets['week'][i] = preset # Need to ensure this doesnt contain additional fields
            return "Success", 200
    return f'preset {id} does not exist', 404

@app.route("/get/history", methods=["GET"])
def get_history_day():
    durationMap = {
        'hour': 60,
        'day': 24 * 60,
        'week': 7 * 24 * 60
    }

    duration = request.args.get('duration', type=str)
    if duration not in durationMap:
        return "Invalid duration", 400
    
    duration = durationMap[duration]

    def genNew(num):
        newNum = 0
        if (num > 400):
            newNum = num + math.floor(random.random() * 40 - 25)
        elif (num > 100):
            newNum = num + math.floor(random.random() * 40 - 20)
        else:
            newNum = num + math.floor(random.random() * 40 - 15)
        
        return max(0, min(500, newNum))
    
    temperatures = []
    core = []
    oven = []
    curCoreTemp = 200
    curOvenTemp = 200
    prevCoreTime = 1757354360
    prevOvenTime = 1757354360

    tempChangeChance = 0.001

    for i in range(0, duration):
        curCoreTemp = genNew(curCoreTemp)
        curOvenTemp = genNew(curOvenTemp)
        temperatures.append({
            'core': curCoreTemp,
            'oven': curOvenTemp,
            'time': 1757354360 + i * 60,
        })
        if (random.random() <= tempChangeChance):
            core.append({'max': curCoreTemp + 10, 'min': curCoreTemp - 10, 'start': prevCoreTime, 'end': 1757354360 + i * 60})
            prevCoreTime = 1757354360 + i * 60
        
        if (random.random() <= tempChangeChance):
            oven.append({'max': curOvenTemp + 10, 'min': curOvenTemp - 10, 'start': prevOvenTime, 'end': 1757354360 + i * 60})
            prevOvenTime = 1757354360 + i * 60
    

    lastTime = 1757354360 + (duration-1) * 60
    if (len(core) == 0 or core[-1]['end'] != lastTime):
            core.append({'max': curCoreTemp + 10, 'min': curCoreTemp - 10, 'start': prevCoreTime, 'end': lastTime})
        
    if (len(oven) == 0 or oven[-1]['end'] != lastTime):
        oven.append({'max': curOvenTemp + 10, 'min': curOvenTemp - 10, 'start': prevOvenTime, 'end': lastTime})
    
    return jsonify({'temperature': temperatures, 'limit': {'core': core, 'oven': oven}})