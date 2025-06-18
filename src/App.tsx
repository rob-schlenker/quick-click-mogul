// src/App.tsx

import React, { useState, useEffect, useRef } from "react";
import { gsap } from "gsap"; // Import GSAP
import "./App.css"; // Your Tailwind CSS styles

// ----------------------------------------------------
// <<-- FIX: MOVED ALL PLAYER GENERATION LOGIC OUTSIDE THE APP COMPONENT -->>
// ----------------------------------------------------

interface Player {
	id: string; // Unique identifier for the player
	name: string;
	overall: number; // A general skill rating (e.g., 1-100)
	value: number; // Market value for buying/selling (cost to recruit this player)
	position: "FWD" | "MID" | "DEF" | "GK"; // Forward, Midfielder, Defender, Goalkeeper
}

// Helper function to generate a random player
const generateRandomPlayer = (
	minOverall: number,
	maxOverall: number,
	position: Player["position"]
): Player => {
	const names = [
		"Liam", "Noah", "Oliver", "Elijah", "William", "James", "Benjamin", "Lucas",
		"Henry", "Alexander", "Mateo", "Daniel", "Michael", "Ethan", "Jacob",
		"Logan", "Jackson", "Sebastian", "David", "Joseph",
	];
	const randomName = names[Math.floor(Math.random() * names.length)];
	const randomOverall =
		Math.floor(Math.random() * (maxOverall - minOverall + 1)) + minOverall;
	const value = randomOverall * 100; // Cost to recruit this player

	return {
		id: Date.now().toString() + Math.random().toString().substring(2, 8),
		name: randomName + " " + String.fromCharCode(65 + Math.floor(Math.random() * 26)), // Add a random initial
		overall: randomOverall,
		value: value,
		position: position,
	};
};

// Helper function to generate the default lineup for a new game
const generateInitialLineup = (): Player[] => [
	generateRandomPlayer(50, 60, "GK"), // Goalkeeper
	generateRandomPlayer(45, 55, "DEF"), // Defender 1
	generateRandomPlayer(45, 55, "DEF"), // Defender 2
	generateRandomPlayer(55, 65, "MID"), // Midfielder 1
	generateRandomPlayer(55, 65, "MID"), // Midfielder 2
	generateRandomPlayer(60, 70, "FWD"), // Forward 1
	generateRandomPlayer(60, 70, "FWD"), // Forward 2
];

// ----------------------------------------------------
// <<-- END FIX BLOCK -->>
// ----------------------------------------------------


function App() {
	// --- Game State Variables ---
	const [money, setMoney] = useState(0);
	const [clickPower, setClickPower] = useState(1);
	const [stadiumCapacity, setStadiumCapacity] = useState(100);
	const [passiveIncomePerSecond, setPassiveIncomePerSecond] = useState(0);

	const [players, setPlayers] = useState<Player[]>(() => {
		const savedGame = localStorage.getItem("quickKickMogulSave");
		if (savedGame) {
			const parsedState = JSON.parse(savedGame);
			// Make sure to return an array, even if parsedState.players is null/undefined
			return parsedState.players || generateInitialLineup();
		}
		return generateInitialLineup(); // This will now correctly call the outside function
	});

	// --- Refs for GSAP Animations ---
	const moneyDisplayRef = useRef<HTMLSpanElement>(null);

	// --- Core Game Logic Functions ---

	const handleTicketSaleClick = () => {
		setMoney((prevMoney) => prevMoney + clickPower);
		if (moneyDisplayRef.current) {
			gsap.fromTo(
				moneyDisplayRef.current,
				{ scale: 1.1 },
				{ scale: 1, duration: 0.1 }
			);
		}
	};

	const buyClickPowerUpgrade = () => {
		const cost = 10 * clickPower;
		if (money >= cost) {
			setMoney((prevMoney) => prevMoney - cost);
			setClickPower((prevPower) => prevPower + 1);
		} else {
			alert("Not enough money to boost ticket sales!");
		}
	};

	const buyStadiumUpgrade = () => {
		const cost = 50 * (stadiumCapacity / 100);
		if (money >= cost) {
			setMoney((prevMoney) => prevMoney - cost);
			const newCapacity = stadiumCapacity + 100;
			setStadiumCapacity(newCapacity);
			setPassiveIncomePerSecond(newCapacity / 100);
		} else {
			alert("Not enough money to expand stadium!");
		}
	};

	// Function to handle recruiting a new player for a specific slot (replaces current player)
	const recruitNewPlayerInSlot = (slotIndex: number) => {
		const oldPlayer = players[slotIndex];
		if (!oldPlayer) return;

		const newPlayerMinOverall = oldPlayer.overall + 5;
		const newPlayerMaxOverall = oldPlayer.overall + 15;
		const newPlayer = generateRandomPlayer( // This now correctly calls the outside function
			newPlayerMinOverall,
			newPlayerMaxOverall,
			oldPlayer.position
		);

		if (money >= newPlayer.value) {
			setMoney((prevMoney) => prevMoney - newPlayer.value);
			setPlayers((prevPlayers) =>
				prevPlayers.map((p, index) => (index === slotIndex ? newPlayer : p))
			);
			alert(
				`Recruited ${newPlayer.name} (OVR: ${newPlayer.overall}) for $${newPlayer.value.toLocaleString()}! Replaced ${oldPlayer.name}.`
			);
		} else {
			alert(
				`Not enough money to recruit a new ${oldPlayer.position}! Needs $${newPlayer.value.toLocaleString()}.`
			);
		}
	};

	// Function to handle training a player in a specific slot
	const trainPlayerInSlot = (slotIndex: number) => {
		const playerToTrain = players[slotIndex];
		if (!playerToTrain) return;

		const trainCost = playerToTrain.overall * 5;
		if (money >= trainCost) {
			setMoney((prevMoney) => prevMoney - trainCost);
			setPlayers((prevPlayers) =>
				prevPlayers.map((p, index) =>
					index === slotIndex
						? {
								...p,
								overall: p.overall + 1,
								value: p.value + 100,
						  }
						: p
				)
			);
			alert(
				`Trained ${playerToTrain.name}! Overall increased to ${
					playerToTrain.overall + 1
				}.`
			);
		} else {
			alert(
				`Not enough money to train ${playerToTrain.name}! Needs $${trainCost.toLocaleString()}.`
			);
		}
	};

	// --- Game Effects (useEffect hooks) ---

	// 1. Passive Income Loop (runs every second)
	useEffect(() => {
		const intervalId = setInterval(() => {
			setMoney((prevMoney) => prevMoney + passiveIncomePerSecond);
		}, 1000);

		return () => clearInterval(intervalId);
	}, [passiveIncomePerSecond]);

	// 2. Animate Money Display Smoothly with GSAP
	useEffect(() => {
		if (moneyDisplayRef.current) {
			gsap.to(moneyDisplayRef.current, {
				duration: 0.5,
				innerHTML: Math.floor(money),
				ease: "power1.out",
				snap: "innerHTML",
			});
		}
	}, [money]);

	// 3. Save Game State to Local Storage
	useEffect(() => {
		const gameState = {
			money,
			clickPower,
			stadiumCapacity,
			passiveIncomePerSecond,
			players, // Players state is now saved here
		};
		localStorage.setItem("quickKickMogulSave", JSON.stringify(gameState));
	}, [money, clickPower, stadiumCapacity, passiveIncomePerSecond, players]);

	// 4. Load Game State (This useEffect is primarily for other states now,
	//    as players are handled by useState's initializer)
	useEffect(() => {
		const savedGame = localStorage.getItem("quickKickMogulSave");
		if (savedGame) {
			const parsedState = JSON.parse(savedGame);
			setMoney(parsedState.money || 0);
			setClickPower(parsedState.clickPower || 1);
			setStadiumCapacity(parsedState.stadiumCapacity || 100);
			setPassiveIncomePerSecond(parsedState.passiveIncomePerSecond || 0);
		} else {
			// This block runs if NO save is found (first time game is loaded)
			// It ensures initial passive income is set if players were generated by initializer
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
					Money: $
					<span ref={moneyDisplayRef}>{Math.floor(money).toLocaleString()}</span>
				</p>
				<p className="text-xl text-gray-400 mt-2">
					(+{passiveIncomePerSecond.toFixed(1)}/sec)
				</p>
			</div>

			{/* Main Click Button */}
			<button
				onClick={handleTicketSaleClick}
				className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-6 px-12 rounded-xl text-2xl shadow-lg transform transition-all duration-150 ease-in-out hover:scale-105 active:scale-95 border-b-4 border-blue-800 mb-12"
			>
				Sell Match Tickets (+${clickPower})
			</button>

			{/* Play Match Button */}
			<div className="mb-8">
				<button
					onClick={() => {
						// Only allow playing if there are players
						if (players.length === 0) {
							alert("You need players in your squad to play a match!");
							return;
						}

						const teamOverall = players.reduce((sum, p) => sum + p.overall, 0);
						const opponentOverall = Math.floor(
							Math.random() * (teamOverall * 0.8) + teamOverall * 0.5
						);
						let matchResult = "";
						let matchBonus = 0;

						if (teamOverall > opponentOverall * 1.1) {
							matchResult = `You dominated! Won against a weaker opponent (${
								Math.floor(Math.random() * 3) + 2
							}-0)!`;
							matchBonus = 500 + teamOverall * 2;
						} else if (teamOverall > opponentOverall * 0.9) {
							matchResult = `Solid win! You beat a competitive team (${
								Math.floor(Math.random() * 2) + 1
							}-0)!`;
							matchBonus = 200 + teamOverall;
						} else if (teamOverall > opponentOverall * 0.7) {
							matchResult = `Tough draw! You held your ground (${Math.floor(
								Math.random() * 2
							)}-${Math.floor(Math.random() * 2)})!`;
							matchBonus = 50 + teamOverall * 0.5;
						} else {
							matchResult = `Loss... Time to train harder! (${Math.floor(
								Math.random() * 2
							)}-${Math.floor(Math.random() * 3) + 2})!`;
							matchBonus = 10 + teamOverall * 0.1;
						}

						setMoney((prevMoney) => prevMoney + matchBonus);
						alert(
							`Match Result: ${matchResult} Gained $${matchBonus.toFixed(0)}!`
						);
					}}
					className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-lg transform transition-all duration-150 ease-in-out hover:scale-105 border-b-4 border-red-800"
				>
					Play Match!
				</button>
			</div>

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
							money >= 10 * clickPower
								? "bg-green-600 hover:bg-green-700 active:bg-green-800"
								: "bg-gray-500 cursor-not-allowed"
						}`}
						disabled={money < 10 * clickPower}
					>
						Buy (Cost: ${(10 * clickPower).toLocaleString()})
					</button>
				</div>

				{/* Upgrade 2: Stadium Capacity (Passive Income) */}
				<div className="flex flex-col sm:flex-row justify-between items-center bg-gray-700 p-4 rounded-md shadow-inner">
					<div className="mb-2 sm:mb-0 sm:mr-4 text-center sm:text-left">
						<p className="text-xl font-semibold">Expand Stadium</p>
						<p className="text-gray-400">Capacity: {stadiumCapacity} seats</p>
						<p className="text-gray-400">
							Passive Income: +${(stadiumCapacity / 100).toFixed(1)}/sec
						</p>
					</div>
					<button
						onClick={buyStadiumUpgrade}
						className={`py-3 px-6 rounded-lg font-bold transition-colors duration-200 ${
							money >= 50 * (stadiumCapacity / 100)
								? "bg-green-600 hover:bg-green-700 active:bg-green-800"
								: "bg-gray-500 cursor-not-allowed"
						}`}
						disabled={money < 50 * (stadiumCapacity / 100)}
					>
						Buy (Cost: ${(50 * (stadiumCapacity / 100)).toLocaleString()})
					</button>
				</div>
			</div>

			{/* Player Roster Section */}
			<div className="w-full max-w-lg bg-gray-800 rounded-lg p-6 shadow-xl border-t-4 border-blue-500 mt-8">
				<h2 className="text-3xl font-bold mb-6 text-center text-blue-400">
					Your Squad
				</h2>
				{players.length === 0 ? (
					<p className="text-center text-gray-500">Initializing squad...</p>
				) : (
					<div className="space-y-3">
						{players.map((player, index) => (
							<div
								key={player.id}
								className="bg-gray-700 p-3 rounded-md flex flex-col sm:flex-row justify-between items-center shadow-inner"
							>
								<div className="mb-2 sm:mb-0 text-center sm:text-left">
									<p className="text-base font-bold text-gray-300">
										{player.position} Slot {index + 1}
									</p>
									<p className="text-lg font-semibold">
										{player.name} ({player.overall} OVR)
									</p>
									<p className="text-sm text-gray-400">
										Value: ${player.value.toLocaleString()}
									</p>
								</div>
								<div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
									{/* Train Player Button */}
									<button
										onClick={() => trainPlayerInSlot(index)} // Pass index
										className={`py-2 px-4 rounded-md font-bold transition-colors duration-200 text-sm ${
											money >= player.overall * 5
												? "bg-orange-600 hover:bg-orange-700 active:bg-orange-800"
												: "bg-gray-500 cursor-not-allowed"
										}`}
										disabled={money < player.overall * 5}
									>
										Train (Cost: ${(player.overall * 5).toLocaleString()})
									</button>
									{/* Recruit New Player Button for this slot */}
									<button
										onClick={() => recruitNewPlayerInSlot(index)} // Pass index
										className={`py-2 px-4 rounded-md font-bold transition-colors duration-200 text-sm ${
											money >= (player.overall + 5) * 100 // Estimate new player cost for button disabled state
												? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
												: "bg-gray-500 cursor-not-allowed"
										}`}
										disabled={money < (player.overall + 5) * 100}
									>
										Recruit New (Est. Cost: $
										{((player.overall + 5) * 100).toLocaleString()})
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
			{/* Clear Save Button for quick testing */}
			<button
				onClick={() => {
					localStorage.clear();
					window.location.reload(); // Reload the page to reset state
				}}
				className="mt-8 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md text-sm"
			>
				Clear Save & Restart Game
			</button>
		</div>
	);
}

export default App;