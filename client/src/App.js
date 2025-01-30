import './App.css';
import axios from "axios";
import { useEffect, useState } from "react";

function App() {
  const [listOfEvents, setListOfEvents] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:3001/events").then((response) => {
      setListOfEvents(response.data);
    });
  }, []);

  return (
    <div className="App">
      {listOfEvents.map((value, index) => (
        <div key={index} className="post">
          <div className="title"> {value.title} </div>
          <div className="body">
            <p>{value.Description}</p> {/* Make sure the 'D' is uppercase */}
            <p><strong>Location:</strong> {value.Location}</p> {/* 'L' uppercase */}
            <p><strong>Date:</strong> {value.Date}</p> {/* 'D' uppercase */}
          </div>
          <div className="footer"> Posted by {value.Username} </div> {/* 'U' uppercase */}
        </div>
      ))}
    </div>
  );
}

export default App;
