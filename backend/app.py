from flask import Flask, request, jsonify
from validateRequest import validate_json_request
from dotenv import load_dotenv
from requestSchemas import RequestSchemas
from databaseManager import DatabaseManager, PresetManager
import sqlite3
import time

app = Flask(__name__)
load_dotenv()
app.config.from_prefixed_env()
app.cli.add_command(DatabaseManager.init_db)
app.cli.add_command(DatabaseManager.populate_db)

@app.teardown_appcontext
def teardown_db(e=None):
    DatabaseManager.close_db()

@app.route("/get/presets/atomic", methods=["GET"])
def get_presets_atomic():
    presets = PresetManager.get_atomic_presets()
    return jsonify(presets)

@app.route("/get/presets/day", methods=["GET"])
def get_presets_day():
    presets = PresetManager.get_day_presets()
    return jsonify(presets)

@app.route("/get/presets/week", methods=["GET"])
def get_presets_week():
    presets = PresetManager.get_week_presets()
    return jsonify(presets)

@app.route("/get/presets/combination", methods=["GET"])
def get_presets_combination():
    combination = request.args.get('combination', type=int)
    if (not combination) or (combination < 1 or combination > 7):
        return "Invalid id", 400

    presets = {}

    if combination >= 4:
        presets['week'] = PresetManager.get_week_presets()
        combination -= 4
    if combination >= 2:
        presets['day'] = PresetManager.get_day_presets()
        combination -= 2
    if combination >= 1:
        presets['atomic'] = PresetManager.get_atomic_presets()
        combination -= 1

    return jsonify(presets)






@app.route("/get/preset/atomic", methods=["GET"])
def get_preset_atomic():
    id = request.args.get('id', type=int)
    if (not id) or (id < 1):
        return "Invalid id", 400

    try:
        preset = PresetManager.get_atomic_preset(id)
        return jsonify(preset)
    except Exception as e:
        return f"Encountered error {e}"

@app.route("/get/preset/day", methods=["GET"])
def get_preset_day():
    id = request.args.get('id', type=int)
    if (not id) or (id < 1):
        return "Invalid id", 400

    try:
        preset = PresetManager.get_day_preset(id)
        return jsonify(preset)
    except Exception as e:
        return f"Encountered error {e}"

@app.route("/get/preset/week", methods=["GET"])
def get_preset_week():
    id = request.args.get('id', type=int)
    if (not id) or (id < 1):
        return "Invalid id", 400

    try:
        preset = PresetManager.get_week_preset(id)
        return jsonify(preset)
    except Exception as e:
        return f"Encountered error {e}"






@app.route("/get/config", methods=["GET"])
def get_config():
    presets = PresetManager.get_active()
    return jsonify(presets)

@app.route("/set/config", methods=["POST"])
def set_config():
    api_id, error_message = validate_json_request(RequestSchemas.currentPreset.set_, request)
    if api_id is None:
        return error_message, 400

    try:
        PresetManager.set_active(api_id['id'])
        return "Success", 201
    except sqlite3.Error as e:
        return f"Transaction Failed {e}", 500





def handle_preset_data(api_schema, format_func, db_func):
    api_preset, error_message = validate_json_request(api_schema, request)
    if api_preset is None:
        return error_message, 400
    
    preset_id, db_preset = format_func(api_preset)
    try:
        if preset_id is None:
            db_func(db_preset)
        else:
            db_func(preset_id, db_preset)
        return "Success", 201
    except sqlite3.Error as e:
        return f"Transaction Failed {e}", 500

@app.route("/create/preset/atomic", methods=["POST"])
def create_preset_atomic():
    return handle_preset_data(
        api_schema = RequestSchemas.atomicPreset.create, 
        format_func = PresetManager.format_from_api_atomic_preset, 
        db_func = PresetManager.create_atomic_preset
    )

@app.route("/create/preset/day", methods=["POST"])
def create_preset_day():
    return handle_preset_data(
        api_schema = RequestSchemas.dayPreset.create,
        format_func = PresetManager.format_from_api_day_preset, 
        db_func = PresetManager.create_day_preset
    )

@app.route("/create/preset/week", methods=["POST"])
def create_preset_week():
    return handle_preset_data(
        api_schema = RequestSchemas.weekPreset.create,
        format_func = PresetManager.format_from_api_week_preset, 
        db_func = PresetManager.create_week_preset
    )

@app.route("/edit/preset/atomic", methods=["POST"])
def edit_preset_atomic():
    return handle_preset_data(
        api_schema = RequestSchemas.atomicPreset.edit, 
        format_func = PresetManager.format_from_api_atomic_preset, 
        db_func = PresetManager.update_atomic_preset
    )

@app.route("/edit/preset/day", methods=["POST"])
def edit_preset_day():
    return handle_preset_data(
        api_schema = RequestSchemas.dayPreset.edit,
        format_func = PresetManager.format_from_api_day_preset, 
        db_func = PresetManager.update_day_preset
    )

@app.route("/edit/preset/week", methods=["POST"])
def edit_preset_week():
    return handle_preset_data(
        api_schema = RequestSchemas.weekPreset.edit,
        format_func = PresetManager.format_from_api_week_preset, 
        db_func = PresetManager.update_week_preset
    )





@app.route("/get/history", methods=["GET"])
def get_history_day():
    durationMap = {
        'hour': 60 * 60,
        'day': 24 * 60 * 60,
        'week': 7 * 24 * 60 * 60
    }

    duration = request.args.get('duration', type=str)
    if duration not in durationMap:
        return "Invalid duration", 400
    
    duration = durationMap[duration]
    now = int(time.time())

    history = PresetManager.get_history(now-duration, now)
    return jsonify(history)