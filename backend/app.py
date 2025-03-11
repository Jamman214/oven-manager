from flask import Flask

app = Flask(__name__)
app.config.from_prefixed_env()

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"
