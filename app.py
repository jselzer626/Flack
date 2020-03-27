import os

from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["TEMPLATES_AUTO_RELOAD"] = True
socketio = SocketIO(app)

channel_content = {}

@app.route("/")
def index():
    return render_template("index.html")

@socketio.on("create channel")
def create_channel(data):
    new_channel_name = data['newChannelName']
    channel_content.update({new_channel_name: []})
    print(channel_content)
    emit("confirm channel creation", {'newChannelName': new_channel_name, 'message': f"{new_channel_name} succesfully created!"}, broadcast=True)
