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
max_posts = 20
max_display_posts = 5

class Post:
    def __init__(self, user, time, text, channel):
        self.user = user
        self.time = time
        self.text = text
        self.channel = channel

    def store_post(self):

        popPosts = False

        # create space in arrray if needed
        if len(channel_content[self.channel]['posts']) >= max_posts:
            popPosts = True
            postToPop = channel_content[self.channel]['posts'].pop(0)
            channel_content[self.channel]['ids'].remove(postToPop['id'])

        # generate a random id that isn't already taken by a post (i.e. if duplicates)
        id = random.randrange(0, max_posts, 1)
        while id in channel_content[self.channel]['ids']:
            id = random.randrange(0, max_posts, 1)

        self.id = id

        channel_content[self.channel]['ids'].append(id)

        # create temp storage object for post data
        post_to_store = {}
        post_to_store['user'] = self.user
        post_to_store['time'] = self.time
        post_to_store['text'] = self.text
        post_to_store['id'] = self.id

        channel_content[self.channel]['posts'].append(post_to_store)

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

    channel = request.args.get('channel')
    try:
        count_channel_users(channel)
        return jsonify(channel_content[channel])
    except KeyError:
        return jsonify("Channel does not exist")

@app.route('/loadMorePosts', methods=["GET"])
def loadMorePosts():

    # start and end are reversed here because we are counting backwards into the post list. Adding 1 to end so I can include final post

    channel = request.args.get('channel')
    end = int(request.args.get('start'))
    start = end + max_display_posts

    if len(channel_content[channel]['posts']) > start:
        return jsonify({'posts': [post for post in reversed(channel_content[channel]['posts'][-start:-end])], 'displayButton': True})
    else:
        return jsonify({'posts': [post for post in reversed(channel_content[channel]['posts'][:-end])], 'displayButton': False})

# sockets functions --------------------------------------------------------------------------------------------------------------

@socketio.on("load channel list")
def loadChannelList():
    channelList = json.dumps(list(channel_content.keys()))
    emit("confirm channel list load", {'channelList': channelList}, broadcast=True)

@socketio.on("create channel")
def create_channel(data):

    # check to see if channel name already taken
    if data['newChannelName'] in channel_content.keys():
        emit("confirm channel creation", {'message': f"{data['newChannelName']} already taken"}, broadcast=True)
    else:
        new_channel_name = data['newChannelName']
        channel_created_time = data['channelCreated']
        channel_content.update({new_channel_name: {'channelCreated': channel_created_time, 'posts': [], 'users': 0, 'ids': []}})
        emit("confirm channel creation", {'newChannelName': new_channel_name, 'message': f"{new_channel_name} succesfully created!"}, broadcast=True)

@socketio.on("save post")
def save_post(data):
    post = Post(data['user'], data['time'], data['text'], data['channel'])
    removePosts = post.store_post()
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

@socketio.on('delete post')
def delete_post(data):

    idToRemove = int(data['id'])

    for post in channel_content[data['channel']]['posts']:
        if post['id'] == idToRemove:
            channel_content[data['channel']]['posts'].remove(post)
            channel_content[data['channel']]['ids'].remove(idToRemove)
            break

    users = count_channel_users(data['channel'])

    emit('confirm post deletion', {'id': data['id'], 'message': 'post deleted!', 'users': users}, broadcast=True)
