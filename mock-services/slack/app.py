from flask import Flask, jsonify, request
from datetime import datetime

app = Flask(__name__)

# Fake message storage
messages = []
channels = {
    "oncall": {"id": "C001", "name": "oncall", "members": ["engineer1", "engineer2"]},
    "general": {"id": "C002", "name": "general", "members": ["all"]},
    "incidents": {"id": "C003", "name": "incidents", "members": ["devops", "engineering"]}
}

# SEND a message
@app.route("/api/chat.postMessage", methods=["POST"])
def post_message():
    data = request.json
    message = {
        "id": len(messages) + 1,
        "channel": data.get("channel", "general"),
        "text": data.get("text", ""),
        "username": data.get("username", "MCP Agent"),
        "timestamp": datetime.now().isoformat(),
        "ok": True
    }
    messages.append(message)
    print(f"[SLACK] Message sent to #{message['channel']}: {message['text']}")
    return jsonify({"ok": True, "message": message}), 200

# GET messages from a channel
@app.route("/api/conversations.history", methods=["GET"])
def get_messages():
    channel = request.args.get("channel", "general")
    channel_messages = [m for m in messages if m["channel"] == channel]
    return jsonify({"ok": True, "messages": channel_messages}), 200

# LIST channels
@app.route("/api/conversations.list", methods=["GET"])
def list_channels():
    return jsonify({"ok": True, "channels": list(channels.values())}), 200

# GET channel info
@app.route("/api/conversations.info", methods=["GET"])
def channel_info():
    channel_name = request.args.get("channel", "general")
    channel = channels.get(channel_name)
    if channel:
        return jsonify({"ok": True, "channel": channel}), 200
    return jsonify({"ok": False, "error": "channel_not_found"}), 404

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8003, debug=True)