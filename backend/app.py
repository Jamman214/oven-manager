from flask import Flask

app = Flask(__name__)
app.config.from_prefixed_env()

@app.route("/api/test")
def hello_world():
    return "API Test"
