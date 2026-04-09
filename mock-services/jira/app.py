from flask import Flask, jsonify, request

app = Flask(__name__)

# Fake database of Jira tickets
tickets = {
    "BUG-421": {
        "id": "BUG-421",
        "title": "Critical: Payment gateway timeout on checkout",
        "priority": "Critical",
        "status": "Open",
        "assignee": "unassigned",
        "description": "Users are experiencing 30s timeouts when completing purchases. Affects 40% of transactions.",
        "reporter": "john.doe@company.com"
    },
    "BUG-422": {
        "id": "BUG-422", 
        "title": "Login page crashes on mobile Safari",
        "priority": "High",
        "status": "Open",
        "assignee": "unassigned",
        "description": "iOS Safari users cannot log in. White screen after submitting credentials.",
        "reporter": "jane.smith@company.com"
    }
}

# GET a specific ticket
@app.route("/rest/api/2/issue/<ticket_id>", methods=["GET"])
def get_ticket(ticket_id):
    ticket = tickets.get(ticket_id)
    if ticket:
        return jsonify(ticket), 200
    return jsonify({"error": "Ticket not found"}), 404

# CREATE a new ticket
@app.route("/rest/api/2/issue", methods=["POST"])
def create_ticket():
    data = request.json
    ticket_id = f"BUG-{len(tickets) + 423}"
    new_ticket = {
        "id": ticket_id,
        "title": data.get("title", "New Bug"),
        "priority": data.get("priority", "Medium"),
        "status": "Open",
        "assignee": "unassigned",
        "description": data.get("description", ""),
        "reporter": data.get("reporter", "agent@system.com")
    }
    tickets[ticket_id] = new_ticket
    return jsonify(new_ticket), 201

# UPDATE ticket status
@app.route("/rest/api/2/issue/<ticket_id>/status", methods=["PUT"])
def update_status(ticket_id):
    data = request.json
    if ticket_id in tickets:
        tickets[ticket_id]["status"] = data.get("status", "In Progress")
        tickets[ticket_id]["assignee"] = data.get("assignee", "agent")
        return jsonify(tickets[ticket_id]), 200
    return jsonify({"error": "Ticket not found"}), 404

# LIST all tickets
@app.route("/rest/api/2/issues", methods=["GET"])
def list_tickets():
    return jsonify(list(tickets.values())), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8001, debug=True)