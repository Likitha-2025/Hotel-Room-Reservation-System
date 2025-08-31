// App.jsx
import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  Container,
  Header,
  Badge,
  ControlButton,
  FloorRowContainer,
  RoomsGrid,
  RoomButton
} from "./styles";


/***********************\
 * Helpers & Data Model *
\***********************/

function buildHotelInventory() {
  const rooms = [];
  for (let f = 1; f <= 9; f++) {
    for (let i = 1; i <= 10; i++) {
      const roomNumber = f * 100 + i;
      rooms.push({ id: String(roomNumber), floor: f, index: i, number: roomNumber });
    }
  }
  for (let i = 1; i <= 7; i++) {
    const roomNumber = 1000 + i;
    rooms.push({ id: String(roomNumber), floor: 10, index: i, number: roomNumber });
  }
  return rooms;
}

const HOTEL_ROOMS = buildHotelInventory();

function travelTimeBetween(a, b) {
  if (!a || !b) return 0;
  const df = Math.abs(a.floor - b.floor);
  if (a.floor === b.floor) return Math.abs(a.index - b.index);
  return (a.index - 1) + 2 * df + (b.index - 1);
}

function sortByFloorIndex(list) {
  return [...list].sort((r1, r2) => (r1.floor - r2.floor) || (r1.index - r2.index));
}

function kCombinations(arr, k) {
  const results = [];
  function backtrack(start, combo) {
    if (combo.length === k) {
      results.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      backtrack(i + 1, combo);
      combo.pop();
    }
  }
  backtrack(0, []);
  return results;
}

function evaluateCombination(combo) {
  const sorted = sortByFloorIndex(combo);
  const time = travelTimeBetween(sorted[0], sorted[sorted.length - 1]);
  return { rooms: sorted, time, first: sorted[0], last: sorted[sorted.length - 1] };
}

function pickBestCombination(combos) {
  let best = null;
  for (const combo of combos) {
    const evald = evaluateCombination(combo);
    if (!best ||
        evald.time < best.time ||
        (evald.time === best.time && (evald.first.floor < best.first.floor ||
         (evald.first.floor === best.first.floor && evald.first.index < best.first.index)))) {
      best = evald;
    }
  }
  return best;
}

/*******************\
 * UI Components    *
\*******************/

function Legend() {
  return (
    <div style={{ display: "flex", gap: "1rem", fontSize: "0.875rem" }}>
      <Badge bg="#10b981">Available</Badge>
      <Badge bg="#dc2626">Occupied</Badge>
      <Badge bg="#4f46e5">Booked</Badge>
    </div>
  );
}

function FloorRow({ floor, rooms, occupancy, bookedSet, onToggleManualBlock }) {
  return (
    <FloorRowContainer>
      <div style={{ width: "3rem", textAlign: "right", fontWeight: 600 }}>F{floor}</div>
      <RoomsGrid>
        {rooms.map((r) => {
          const isBooked = bookedSet.has(r.id);
          const isOccupied = occupancy[r.id] === "occupied";
          const status = isBooked ? "booked" : isOccupied ? "occupied" : "available";

          return (
            <RoomButton
              key={r.id}
              status={status}
              title={`Room ${r.number}${isBooked ? " (booked)" : isOccupied ? " (occupied)" : " (available)"}`}
              onClick={() => onToggleManualBlock(r, isBooked)}
            >
              {r.number}
            </RoomButton>
          );
        })}
      </RoomsGrid>
    </FloorRowContainer>
  );
}

/*******************\
 * Main App         *
\*******************/

export default function App() {
  const [requested, setRequested] = useState(4);
  const [occupancy, setOccupancy] = useState(() => {
    const init = {};
    HOTEL_ROOMS.forEach((r) => (init[r.id] = "available"));
    return init;
  });
  const [bookedRooms, setBookedRooms] = useState([]);
  const [lastStrategy, setLastStrategy] = useState(null);

  const groupedByFloor = useMemo(() => {
    const map = new Map();
    HOTEL_ROOMS.forEach((r) => {
      if (!map.has(r.floor)) map.set(r.floor, []);
      map.get(r.floor).push(r);
    });
    for (const [f, arr] of map) arr.sort((a, b) => a.index - b.index);
    return map;
  }, []);

  const bookedSet = useMemo(() => new Set(bookedRooms.map((r) => r.id)), [bookedRooms]);

  const totalTravelTime = useMemo(() => {
    if (bookedRooms.length <= 1) return 0;
    const sorted = sortByFloorIndex(bookedRooms);
    return travelTimeBetween(sorted[0], sorted[sorted.length - 1]);
  }, [bookedRooms]);

  function tryBook(k) {
    if (k < 1 || k > 5) {
      alert("You can book between 1 and 5 rooms.");
      return;
    }
    const avail = HOTEL_ROOMS.filter((r) => occupancy[r.id] !== "occupied");
    if (avail.length < k) {
      alert("Not enough available rooms to fulfill the request.");
      return;
    }

    let bestSame = null;
    for (const [floor, allOnFloor] of groupedByFloor) {
      const availOnFloor = allOnFloor.filter((r) => occupancy[r.id] !== "occupied");
      if (availOnFloor.length >= k) {
        const combos = kCombinations(availOnFloor, k);
        const best = pickBestCombination(combos);
        if (best && (!bestSame || best.time < bestSame.time)) bestSame = best;
      }
    }

    if (bestSame) {
      setBookedRooms(bestSame.rooms);
      setLastStrategy("same-floor");
      return;
    }

    const combos = kCombinations(avail, k);
    const best = pickBestCombination(combos);
    if (best) {
      setBookedRooms(best.rooms);
      setLastStrategy("cross-floor");
    } else {
      alert("Unable to find a valid booking.");
    }
  }

  function handleRandomize() {
    const next = { ...occupancy };
    HOTEL_ROOMS.forEach((r) => {
      if (bookedSet.has(r.id)) return;
      next[r.id] = Math.random() < 0.35 ? "occupied" : "available";
    });
    setOccupancy(next);
    setBookedRooms([]);
    setLastStrategy(null);
  }

  function handleResetAll() {
    const next = {};
    HOTEL_ROOMS.forEach((r) => (next[r.id] = "available"));
    setOccupancy(next);
    setBookedRooms([]);
    setLastStrategy(null);
  }

  function handleToggleManualBlock(r, isBooked) {
    if (isBooked) return;
    setOccupancy((prev) => ({
      ...prev,
      [r.id]: prev[r.id] === "occupied" ? "available" : "occupied"
    }));
  }

  return (
    <Container>
      <Header>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: "800" }}>Hotel Room Reservation System</h1>
          <p style={{ fontSize: "0.875rem", color: "#555", marginTop: "0.25rem" }}>
            Floors 1–9: 10 rooms each; Floor 10: 7 rooms (1001–1007). Stairs/lift on the left.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Badge bg="#fff" color="#111" ring="#ddd">Horizontal = 1 min/room</Badge>
          <Badge bg="#fff" color="#111" ring="#ddd">Vertical = 2 min/floor</Badge>
        </div>
      </Header>

      <section style={{ background: "#fff", borderRadius: "1rem", padding: "1rem", marginTop: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label>Rooms to book</label>
            <input
              type="number"
              min={1}
              max={5}
              value={requested}
              onChange={(e) => setRequested(Math.max(1, Math.min(5, Number(e.target.value))))}
              style={{ width: "3rem", padding: "0.25rem 0.5rem", borderRadius: "0.5rem", border: "1px solid #ddd" }}
            />
          </div>
          <ControlButton onClick={() => tryBook(requested)}>Book Optimally</ControlButton>
          <ControlButton onClick={handleRandomize}>Random Occupancy</ControlButton>
          <ControlButton onClick={handleResetAll}>Reset All</ControlButton>
        </div>

        <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" }}>
          <Legend />
          {bookedRooms.length > 0 && (
            <div style={{ marginLeft: "auto", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <Badge bg="#e0e7ff" color="#4f46e5">Selected: {bookedRooms.map(r => r.number).join(", ")}</Badge>
              <Badge bg="#d1fae5" color="#10b981">Time: {totalTravelTime} min</Badge>
              {lastStrategy && <Badge bg="#fef3c7" color="#b45309">Strategy: {lastStrategy === "same-floor" ? "Same floor" : "Cross-floor"}</Badge>}
            </div>
          )}
        </div>
      </section>

      <section style={{ background: "#fff", borderRadius: "1rem", padding: "1rem", marginTop: "1rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        {[...groupedByFloor.keys()].sort((a, b) => b - a).map((floor) => {
          const rooms = groupedByFloor.get(floor);
          return (
            <FloorRow
              key={floor}
              floor={floor}
              rooms={rooms}
              occupancy={occupancy}
              bookedSet={bookedSet}
              onToggleManualBlock={handleToggleManualBlock}
            />
          );
        })}
      </section>
    </Container>
  );
}

/***********************\
 * Render React App     *
\***********************/
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);