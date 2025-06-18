// src/App.tsx

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap'; // Import GSAP
import './App.css'; // Your Tailwind CSS styles

function App() {
  // --- Game State Variables ---
  const [money, setMoney] = useState(0);
  const [clickPower, setClickPower] = useState(1); // How much money each click gives
  const [stadiumCapacity, setStadiumCapacity] = useState(100); // Affects passive income
  const [passiveIncomePerSecond, setPassiveIncomePerSecond] = useState(0);

  // --- Refs for GSAP Animations (optional, but good for direct element access) ---
  const moneyDisplayRef = useRef<HTMLSpanElement>(null);

  // --- Core Game Logic Functions ---

  const handleTicketSaleClick = () => {
    setMoney((prevMoney) => prevMoney + clickPower);
    // Optional: A quick pop animation on the money display when clicked
    if (moneyDisplayRef.current) {
      gsap.fromTo(moneyDisplayRef.current, { scale: 1.1 }, { scale: 1, duration: 0.1 });
    }
  };

  const buyClickPowerUpgrade = () => {
    const cost = 10 * (clickPower); // Simple cost calculation
    if (money >= cost) {
      setMoney((prevMoney) => prevMoney - cost);
      setClickPower((prevPower) => prevPower + 1);
    } else {
      // Simple alert for "not enough money" - you can make this prettier later
      alert("Not enough money to boost ticket sales!");
    }
  };

  const buyStadiumUpgrade = () => {
    const cost = 50 * (stadiumCapacity / 100); // Cost increases with current capacity
    if (money >= cost) {
      setMoney((prevMoney) => prevMoney - cost);
      const newCapacity = stadiumCapacity + 100; // Increase capacity by 100
      setStadiumCapacity(newCapacity);
      // Update passive income immediately after capacity changes
      setPassiveIncomePerSecond(newCapacity / 100);
    } else {
      alert("Not enough money to expand stadium!");
    }
  };

  // --- Game Effects (useEffect hooks) ---

  // 1. Passive Income Loop (runs every second)
  useEffect(() => {
    const intervalId = setInterval(() => {
      setMoney((prevMoney) => prevMoney + passiveIncomePerSecond);
    }, 1000); // Add income every 1000 milliseconds (1 second)

    // Cleanup function: important to clear the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [passiveIncomePerSecond]); // Re-run this effect if passiveIncomePerSecond changes

  // 2. Animate Money Display Smoothly with GSAP (Optional but nice visual)
  useEffect(() => {
    if (moneyDisplayRef.current) {
      gsap.to(moneyDisplayRef.current, {
        duration: 0.5,
        innerHTML: Math.floor(money), // Animate the number itself
        ease: "power1.out",
        snap: "innerHTML", // Ensure it snaps to whole numbers
      });
    }
  }, [money]); // Run this effect whenever 'money' changes

  // 3. Save Game State to Local Storage
  useEffect(() => {
    const gameState = {
      money,
      clickPower,
      stadiumCapacity,
      passiveIncomePerSecond,
    };
    localStorage.setItem('quickKickMogulSave', JSON.stringify(gameState));
  }, [money, clickPower, stadiumCapacity, passiveIncomePerSecond]); // Save whenever these critical state variables change

  // 4. Load Game State from Local Storage on initial component mount
  useEffect(() => {
    const savedGame = localStorage.getItem('quickKickMogulSave');
    if (savedGame) {
      const parsedState = JSON.parse(savedGame);
      // Safely set state, providing default fallbacks in case properties are missing
      setMoney(parsedState.money || 0);
      setClickPower(parsedState.clickPower || 1);
      setStadiumCapacity(parsedState.stadiumCapacity || 100);
      setPassiveIncomePerSecond(parsedState.passiveIncomePerSecond || 0);
    } else {
      // If no save exists, ensure passive income is calculated for initial capacity
      setPassiveIncomePerSecond(stadiumCapacity / 100);
    }
  }, []); // Empty dependency array means this runs ONLY once on initial mount

  // --- Render UI ---
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 font-sans">
      <h1 className="text-5xl font-extrabold mb-8 text-green-400 drop-shadow-lg">
        Quick Kick Mogul
      </h1>

      {/* Money Display Section */}
      <div className="mb-8 text-center bg-gray-800 p-6 rounded-lg shadow-xl border-b-4 border-green-500">
        <p className="text-3xl font-bold">
          Money: $<span ref={moneyDisplayRef}>{Math.floor(money)}</span>
        </p>
        <p className="text-xl text-gray-400 mt-2">
          (+${passiveIncomePerSecond.toFixed(1)}/sec)
        </p>
      </div>

      {/* Main Click Button */}
      <button
        onClick={handleTicketSaleClick}
        className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-6 px-12 rounded-xl text-2xl shadow-lg transform transition-all duration-150 ease-in-out hover:scale-105 active:scale-95 border-b-4 border-blue-800 mb-12"
      >
        Sell Match Tickets (+${clickPower})
      </button>

      {/* Upgrades Section */}
      <div className="w-full max-w-lg bg-gray-800 rounded-lg p-6 shadow-xl border-t-4 border-yellow-500">
        <h2 className="text-3xl font-bold mb-6 text-center text-yellow-400">
          Club Upgrades
        </h2>

        {/* Upgrade 1: Click Power */}
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-center bg-gray-700 p-4 rounded-md shadow-inner">
          <div className="mb-2 sm:mb-0 sm:mr-4 text-center sm:text-left">
            <p className="text-xl font-semibold">Boost Ticket Sales</p>
            <p className="text-gray-400">Current: +${clickPower} per click</p>
          </div>
          <button
            onClick={buyClickPowerUpgrade}
            className={`py-3 px-6 rounded-lg font-bold transition-colors duration-200 ${
              money >= (10 * clickPower)
                ? 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                : 'bg-gray-500 cursor-not-allowed'
            }`}
            disabled={money < (10 * clickPower)}
          >
            Buy (Cost: ${10 * clickPower})
          </button>
        </div>

        {/* Upgrade 2: Stadium Capacity (Passive Income) */}
        <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-700 p-4 rounded-md shadow-inner">
          <div className="mb-2 sm:mb-0 sm:mr-4 text-center sm:text-left">
            <p className="text-xl font-semibold">Expand Stadium</p>
            <p className="text-gray-400">Capacity: {stadiumCapacity} seats</p>
            <p className="text-gray-400">Passive Income: +${(stadiumCapacity / 100).toFixed(1)}/sec</p>
          </div>
          <button
            onClick={buyStadiumUpgrade}
            className={`py-3 px-6 rounded-lg font-bold transition-colors duration-200 ${
              money >= (50 * (stadiumCapacity / 100))
                ? 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                : 'bg-gray-500 cursor-not-allowed'
            }`}
            disabled={money < (50 * (stadiumCapacity / 100))}
          >
            Buy (Cost: ${50 * (stadiumCapacity / 100)})
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;