from flask import Flask, jsonify, request
from datetime import datetime

app = Flask(__name__)

# Fake database
branches = {}
pull_requests = {}

# CREATE a branch
@app.route("/repos/<owner>/<repo>/git/refs", methods=["POST"])
def create_branch(owner, repo):
    data = request.json
    branch_name = data.get("ref", "").replace("refs/heads/", "")
    branches[branch_name] = {
        "name": branch_name,
        "repo": f"{owner}/{repo}",
        "created_at": datetime.now().isoformat(),
        "sha": "abc123def456",
        "url": f"https://github.com/{owner}/{repo}/tree/{branch_name}"
    }
    return jsonify(branches[branch_name]), 201

# LIST branches
@app.route("/repos/<owner>/<repo>/branches", methods=["GET"])
def list_branches(owner, repo):
    return jsonify(list(branches.values())), 200

# GET a branch
@app.route("/repos/<owner>/<repo>/branches/<branch_name>", methods=["GET"])
def get_branch(owner, repo, branch_name):
    branch = branches.get(branch_name)
    if branch:
        return jsonify(branch), 200
    return jsonify({"error": "Branch not found"}), 404

# CREATE pull request
@app.route("/repos/<owner>/<repo>/pulls", methods=["POST"])
def create_pr(owner, repo):
    data = request.json
    pr_id = len(pull_requests) + 1
    pr = {
        "id": pr_id,
        "title": data.get("title", "New PR"),
        "body": data.get("body", ""),
        "head": data.get("head", ""),
        "base": data.get("base", "main"),
        "status": "open",
        "url": f"https://github.com/{owner}/{repo}/pull/{pr_id}",
        "created_at": datetime.now().isoformat()
    }
    pull_requests[pr_id] = pr
    return jsonify(pr), 201

# LIST pull requests
@app.route("/repos/<owner>/<repo>/pulls", methods=["GET"])
def list_prs(owner, repo):
    return jsonify(list(pull_requests.values())), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8002, debug=True)