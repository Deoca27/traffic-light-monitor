import { useEffect, useState, useRef } from "react";
import mqtt from "mqtt";

function App() {
  const [lampStatus, setLampStatus] = useState("Mati"); // status lampu
  const [connectionStatus, setConnectionStatus] = useState("Disconnected"); // status koneksi
  const clientRef = useRef(null);

  useEffect(() => {
    const mqttClient = mqtt.connect("wss://test.mosquitto.org:8081");

    mqttClient.on("connect", () => {
      console.log("Terhubung ke MQTT broker");
      setConnectionStatus("Connected");
      mqttClient.subscribe("trafficlight/status", (err) => {
        if (!err) console.log("Subscribed ke trafficlight/status");
      });
    });

    mqttClient.on("reconnect", () => {
      console.log("Mencoba reconnect...");
      setConnectionStatus("Reconnecting");
    });

    mqttClient.on("close", () => {
      console.log("Disconnected dari broker");
      setConnectionStatus("Disconnected");
    });

    mqttClient.on("message", (topic, message) => {
      if (topic === "trafficlight/status") {
        setLampStatus(message.toString());
      }
    });

    mqttClient.on("error", (err) => {
      console.error("MQTT error:", err);
      setConnectionStatus("Error");
    });

    clientRef.current = mqttClient;

    return () => mqttClient.end();
  }, []);

  const handleOn = () => clientRef.current?.publish("trafficlight/control", "ON");
  const handleOff = () => clientRef.current?.publish("trafficlight/control", "OFF");

  const getLampColor = (lamp) => {
    if (lampStatus === "Mati") return "bg-gray-300";

    switch (lamp) {
      case "Merah":
        return lampStatus.includes("Merah") ? "bg-red-500 shadow-red-400" : "bg-gray-300";
      case "Kuning":
        return lampStatus.includes("Kuning") ? "bg-yellow-400 shadow-yellow-300" : "bg-gray-300";
      case "Hijau":
        return lampStatus.includes("Hijau") ? "bg-green-500 shadow-green-400" : "bg-gray-300";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-6">
      <h1 className="text-3xl font-extrabold mb-4 text-gray-800 drop-shadow-md">
        Traffic Light Control
      </h1>

      {/* Status koneksi */}
      <div
        className={`px-4 py-1 mb-6 rounded-lg font-semibold text-white ${connectionStatus === "Connected"
            ? "bg-green-500"
            : connectionStatus === "Disconnected"
              ? "bg-gray-500"
              : connectionStatus === "Error"
                ? "bg-red-500"
                : "bg-yellow-400"
          }`}
      >
        {connectionStatus}
      </div>

      {/* Traffic Light Box */}
      <div className="w-24 p-4 bg-gray-800 rounded-3xl flex flex-col items-center gap-4 shadow-lg">
        <div className={`w-16 h-16 rounded-full ${getLampColor("Merah")} transition-all duration-500`}></div>
        <div className={`w-16 h-16 rounded-full ${getLampColor("Kuning")} transition-all duration-500`}></div>
        <div className={`w-16 h-16 rounded-full ${getLampColor("Hijau")} transition-all duration-500`}></div>
      </div>

      {/* Status Lampu */}
      <span className="mt-4 text-lg font-semibold text-gray-700">{lampStatus}</span>

      {/* Tombol kontrol */}
      <div className="flex gap-6 mt-6">
        <button
          onClick={(e) => {
            handleOn();
            // reset animasi biar bisa diputar tiap klik
            e.currentTarget.classList.remove("animate-click");
            void e.currentTarget.offsetWidth;
            e.currentTarget.classList.add("animate-click");
          }}
          disabled={connectionStatus !== "Connected"}
          className="px-6 py-3 bg-green-500 text-white font-bold rounded-xl shadow-lg 
               hover:bg-green-600 transition duration-200 
               disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ON
        </button>

        <button
          onClick={(e) => {
            handleOff();
            e.currentTarget.classList.remove("animate-click");
            void e.currentTarget.offsetWidth;
            e.currentTarget.classList.add("animate-click");
          }}
          disabled={connectionStatus !== "Connected"}
          className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl shadow-lg 
               hover:bg-red-600 transition duration-200 
                disabled:opacity-50 disabled:cursor-not-allowed"
        >
          OFF
        </button>
      </div>

    </div>
  );
}

export default App;
