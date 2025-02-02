import "./App.css";
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import CreateEvent from "./pages/CreateEvent";
import Event from "./pages/Event";


function App() {
  return (
    <div className="App">
      {/* Navigation Wrapper (if needed, place your navbar here) */}
      <div className="navbar-custom">
        {/* You can add a Navbar component here */}
        <Link to="/">Home</Link>
        <Link to="/create_event">Create Event</Link>
      </div>

      {/* Routes Configuration */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create_event" element={<CreateEvent />} />
        <Route path="/event/:id" element={<Event />} />
      </Routes>
    </div>
  );
}

export default App;
