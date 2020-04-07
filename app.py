import os
import json
import random

from flask import Flask, render_template, jsonify, request
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.config['DEBUG'] = True
socketio = SocketIO(app)

channel_content = {}
max_posts = 5

class Post:
    def __init__(self, user, time, text, channel):
        self.user = user
        self.time = time
        self.text = text
        self.channel = channel

        # generate a random id that isn't already taken by a post (i.e. if duplicates)
        id = random.randrange(0, max_posts, 1)
        while id in channel_content[channel]['ids']:
            id = random.randrange(0, max_posts, 1)

        self.id = id

        channel_content[channel]['ids'].append(id)

    def store_post(self):
        # create temp storage object for post data
        post_to_store = {}
        post_to_store['user'] = self.user
        post_to_store['time'] = self.time
        post_to_store['text'] = self.text

        channel_content[self.channel]['posts'].append(post_to_store)


    def popPost(self):

        popPosts = False

        if channel_content[self.channel]['posts']:
            while len(channel_content[self.channel]['posts']) > max_posts:
                popPosts = True
                channel_content[self.channel]['posts'].pop(0)

        #will let the broswer to know if older posts need to be removed from DOM
        return popPosts

# count active users for a given channel
def count_channel_users(channel):
        active_channel_users = set((map(lambda post: post['user'], channel_content[channel]['posts'])))
        channel_content[channel]['users'] = len(active_channel_users)
        return len(active_channel_users)


@app.route("/")
def index():
    return render_template("index.html")

@app.route("/loadChannel", methods=["GET"])
def loadChannel():

    channel = request.args.get('q')
    try:
        count_channel_users(channel)
        print(channel_content[channel])
        return jsonify(channel_content[channel])
    except KeyError:
        return jsonify("Channel does not exist")

# sockets functions --------------------------------------------------------------------------------------------------------------

@socketio.on("load channel list")
def loadChannelList():
    channelList = json.dumps(list(channel_content.keys()))
    emit("confirm channel list load", {'channelList': channelList}, broadcast=True)

@socketio.on("create channel")
def create_channel(data):
    new_channel_name = data['newChannelName']
    channel_created_time = data['channelCreated']
    channel_content.update({new_channel_name: {'channelCreated': channel_created_time, 'posts': [], 'users': 0, 'ids': []}})

    emit("confirm channel creation", {'newChannelName': new_channel_name, 'message': f"{new_channel_name} succesfully created!"}, broadcast=True)

@socketio.on("save post")
def save_post(data):
    post = Post(data['user'], data['time'], data['text'], data['channel'])
    post.store_post()
    removePosts = post.popPost()
    currentActiveUsers = count_channel_users(post.channel)
    post = json.dumps(post.__dict__)
    emit("add post to channel", {'post': post, 'currentActiveUsers': currentActiveUsers, 'removePosts': removePosts}, broadcast=True)

@socketio.on('channel view')
def channel_view(data):
    channel_to_lookup = data['channelName']

    try:
        posts = channel_content[channel_to_lookup]
    except KeyError:
        posts = []

    emit("view channel messages", {'channelName': channel_to_lookup, 'posts': posts}, broadcast=True)
