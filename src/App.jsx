import "./App.css";
import { Home } from "./pages/home/Home";
import { SimulationProvider } from "./context/SimulationContext";

function App() {
  return (
    <SimulationProvider>
      <Home />
    </SimulationProvider>
  );
}

export default App;
