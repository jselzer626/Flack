import os
import json

from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config['DEBUG'] = True
socketio = SocketIO(app)

channel_content = {}

class Post:
    def __init__(self, user, time, text, channel):
        self.user = user
        self.time = time
        self.text = text
        self.channel = channel

    def store_post(self):
        # create temp storage object for post data
        post_to_store = {}
        post_to_store['user'] = self.user
        post_to_store['time'] = self.time
        post_to_store['text'] = self.text

        # verify that channel does not have more than 100 posts saved
        if channel_content[self.channel]:
            while len(channel_content[self.channel]) > 100:
                channel_content[self.channel].pop(0)

        # store saved post at end of channel post list
        channel_content[self.channel].append(post_to_store)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/loadChannel", methods=["GET"])
def loadChannel():

    channel = request.args.get('q')
    return jsonify(channel_content[channel])

# sockets functions --------------------------------------------------------------------------------------------------------------

@socketio.on("load channel list")
def loadChannelList():
    channelList = json.dumps(list(channel_content.keys()))
    emit("confirm channel list load", {'channelList': channelList})


@socketio.on("create channel")
def create_channel(data):
    new_channel_name = data['newChannelName']
    channel_content.update({new_channel_name: []})

    emit("confirm channel creation", {'newChannelName': new_channel_name, 'message': f"{new_channel_name} succesfully created!"}, broadcast=True)

@socketio.on("save post")
def save_post(data):
    post = Post(data['user'], data['time'], data['text'], data['channel'])
    post.store_post()
    post = json.dumps(post.__dict__)
    emit("add post to channel", {'post': post}, broadcast=True)

@socketio.on('channel view')
def channel_view(data):
    channel_to_lookup = data['channelName']

    try:
        posts = channel_content[channel_to_lookup]
    except KeyError:
        posts = []

    emit("view channel messages", {'channelName': channel_to_lookup, 'posts': posts}, broadcast=True)
