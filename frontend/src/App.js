import "./App.css";

import { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

function App() {

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [budget, setBudget] = useState(3000);

  useEffect(() => {
    fetch("http://127.0.0.1:5000/expenses")
      .then(res => res.json())
      .then(data => setExpenses(data));
  }, []);

  const addExpense = () => {
    fetch("http://127.0.0.1:5000/add-expense", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        description,
        category,
        date
      })
    }).then(() => window.location.reload());
  };

  const totalExpense = expenses.reduce((sum, e) => sum + Number(e[1]), 0);
  const savings = budget - totalExpense;


  const categories = {};
  expenses.forEach(e => {
    categories[e[3]] = (categories[e[3]] || 0) + Number(e[1]);
  });

  const pieData = {
  labels: Object.keys(categories),
  datasets: [{
    data: Object.values(categories),
    backgroundColor: [
      "#4f46e5",   // blue
      "#22c55e",   // green
      "#f97316",   // orange
      "#ef4444",   // red
      "#14b8a6",   // teal
      "#a855f7",   // purple
      "#facc15"    // yellow
    ],
    borderWidth: 1
  }]
};


  return (
   
  <div className="container">

    <h2>Smart Finance Tracker</h2>
    <h3>Dashboard</h3>

    <div className="grid">

  <div className="card">
    <h3>Total Expense</h3>
    <h2>₹{totalExpense}</h2>
  </div>

  <div className="card">
    <h3>Savings</h3>
    <h2>₹{savings}</h2>
  </div>

  <div className="card">
    <h3>Monthly Budget</h3>
    <input value={budget} onChange={e => setBudget(e.target.value)} />
    {totalExpense > budget && <p style={{color:"red"}}>⚠ Budget Exceeded</p>}
  </div>

</div>


    <div className="card">
      <h3>Add Expense</h3>

      <input placeholder="Amount" onChange={e => setAmount(e.target.value)} />
      <input placeholder="Description" onChange={e => {
        setDescription(e.target.value);

        fetch("http://127.0.0.1:5000/predict-category", {
          method: "POST",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ text: e.target.value })
        })
        .then(res => res.json())
        .then(data => setCategory(data.category));
      }} />

      <input value={category} placeholder="Category" />

      <input type="date" onChange={e => setDate(e.target.value)} />

      <button onClick={addExpense}>Add Expense</button>
    </div>

    <div className="card">
      <Pie data={pieData} />
    </div>

    <div className="card">
      <h3>Expenses History</h3>

     {expenses.map(e => (
  <div className="expense" key={e[0]}>

    ₹{e[1]} — {e[2]} — {e[3]}

    <button
      style={{float:"right", background:"#ef4444", width:"60px"}}
      onClick={() => {
        fetch(`http://127.0.0.1:5000/delete-expense/${e[0]}`, {
          method: "DELETE"
        }).then(() => window.location.reload());
      }}
    >
      X
    </button>

  </div>
))}


    </div>

  </div>
);

}

export default App;
