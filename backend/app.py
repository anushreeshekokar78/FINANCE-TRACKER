from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import joblib


app = Flask(__name__)
CORS(app)

# Connect DB
def get_db():
    return sqlite3.connect("database.db")

# Create tables once
def init_db():
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT,
        password TEXT
    )
    """)



    cursor.execute("""
    CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL,
        description TEXT,
        category TEXT,
        date TEXT
    )
    """)

    conn.commit()
    conn.close()

init_db()
model = joblib.load("model.pkl")
vectorizer = joblib.load("vectorizer.pkl")



@app.route("/predict-category", methods=["POST"])
def predict_category():
    text = request.json["text"].lower()

    # Keyword fallback (rule based)
    keywords = {
        "uber": "Transport",
        "ola": "Transport",
        "rapido": "Transport",
        "pizza": "Food",
        "burger": "Food",
        "amazon": "Shopping",
        "flipkart": "Shopping",
        "doctor": "Health",
        "medicine": "Health",
        "movie": "Entertainment",
        "netflix": "Entertainment",
        "electricity": "Utilities",
        "wifi": "Utilities"
    }

    for key in keywords:
        if key in text:
            return jsonify({"category": keywords[key]})

    # ML prediction
    X = vectorizer.transform([text])
    probs = model.predict_proba(X)[0]
    max_prob = max(probs)
    prediction = model.predict(X)[0]

    if max_prob < 0.25:
        prediction = "Others"

    return jsonify({"category": prediction})


def home():
    return "Finance Tracker Backend Running"

# Register user
@app.route("/register", methods=["POST"])
def register():
    data = request.json
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO users(email,password) VALUES (?,?)",
                   (data["email"], data["password"]))
    conn.commit()
    conn.close()
    return jsonify({"message": "User registered"})

# Add expense
@app.route("/add-expense", methods=["POST"])
def add_expense():
    data = request.json
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO expenses(amount,description,category,date)
    VALUES (?,?,?,?)
    """, (data["amount"], data["description"], data["category"], data["date"]))

    conn.commit()
    conn.close()

    return jsonify({"message": "Expense added"})

# Get expenses
@app.route("/expenses")
def get_expenses():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM expenses")
    rows = cursor.fetchall()
    conn.close()

    return jsonify(rows)
@app.route("/delete-expense/<int:id>", methods=["DELETE"])
def delete_expense(id):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM expenses WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Expense deleted"})


if __name__ == "__main__":
    app.run(debug=True)
