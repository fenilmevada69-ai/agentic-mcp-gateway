from flask import Flask, jsonify, request
from datetime import datetime

app = Flask(__name__)

# Fake spreadsheet storage
spreadsheets = {
    "incident-log": {
        "id": "incident-log",
        "title": "Incident Log",
        "rows": [
            ["Ticket ID", "Branch", "Status", "Notified", "Timestamp"]
        ]
    }
}

# GET spreadsheet
@app.route("/v4/spreadsheets/<sheet_id>", methods=["GET"])
def get_spreadsheet(sheet_id):
    sheet = spreadsheets.get(sheet_id)
    if sheet:
        return jsonify(sheet), 200
    return jsonify({"error": "Spreadsheet not found"}), 404

# APPEND a row
@app.route("/v4/spreadsheets/<sheet_id>/values/append", methods=["POST"])
def append_row(sheet_id):
    data = request.json
    if sheet_id not in spreadsheets:
        spreadsheets[sheet_id] = {
            "id": sheet_id,
            "title": "New Sheet",
            "rows": [["Column1", "Column2", "Column3", "Timestamp"]]
        }
    new_row = data.get("values", [])
    new_row.append(datetime.now().isoformat())
    spreadsheets[sheet_id]["rows"].append(new_row)
    print(f"[SHEETS] Row appended to {sheet_id}: {new_row}")
    return jsonify({
        "spreadsheetId": sheet_id,
        "updatedRows": 1,
        "row": new_row
    }), 200

# GET all rows
@app.route("/v4/spreadsheets/<sheet_id>/values", methods=["GET"])
def get_rows(sheet_id):
    sheet = spreadsheets.get(sheet_id)
    if sheet:
        return jsonify({"values": sheet["rows"]}), 200
    return jsonify({"error": "Not found"}), 404

# CREATE new spreadsheet
@app.route("/v4/spreadsheets", methods=["POST"])
def create_spreadsheet():
    data = request.json
    sheet_id = f"sheet-{len(spreadsheets) + 1}"
    spreadsheets[sheet_id] = {
        "id": sheet_id,
        "title": data.get("title", "New Sheet"),
        "rows": []
    }
    return jsonify(spreadsheets[sheet_id]), 201

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8004, debug=True)