from flask import Flask, request, jsonify
from validateRequest import validate_json_request, ConstraintSchema, DictSchema, ListSchema

app = Flask(__name__)
app.config.from_prefixed_env()

@app.route("/get-presets/single", methods=["GET"])
def get_presets_single():
    return jsonify([{"id":0, "name":"Off"}, {"id":0, "name":"preset 0"}, {"id":1, "name":"preset 1"}])