// src/App.tsx

import React, { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import "./App.css";

// ----------------------------------------------------
// Helper functions, Interfaces, and Image Imports
// (All defined globally, outside the App component)
// ----------------------------------------------------

interface Player {
	id: string;
	name: string;
	overall: number;
	value: number; // Market value for buying/selling (cost to recruit this player)
	position: "FWD" | "MID" | "DEF" | "GK"; // Forward, Midfielder, Defender, Goalkeeper
}

// --- Import ALL Visual Tier Images ---
// Ticket Sales Visual Tiers (ensure you have ticket_sales_visual_1.png through _10.png in src/assets/images/)
import ts_visual_1 from './assets/images/ticket_sales_visual_1.png';
import ts_visual_2 from './assets/images/ticket_sales_visual_2.png';
import ts_visual_3 from './assets/images/ticket_sales_visual_3.png';
import ts_visual_4 from './assets/images/ticket_sales_visual_4.png';
import ts_visual_5 from './assets/images/ticket_sales_visual_5.png';
import ts_visual_6 from './assets/images/ticket_sales_visual_6.png';
import ts_visual_7 from './assets/images/ticket_sales_visual_7.png';
import ts_visual_8 from './assets/images/ticket_sales_visual_8.png';
import ts_visual_9 from './assets/images/ticket_sales_visual_9.png';
import ts_visual_10 from './assets/images/ticket_sales_visual_10.png';

// Stadium Visual Tiers (ensure you have stadium_visual_1.png through _10.png in src/assets/images/)
import stadium_visual_1 from './assets/images/stadium_visual_1.png';
import stadium_visual_2 from './assets/images/stadium_visual_2.png';
import stadium_visual_3 from './assets/images/stadium_visual_3.png';
import stadium_visual_4 from './assets/images/stadium_visual_4.png';
import stadium_visual_5 from './assets/images/stadium_visual_5.png';
import stadium_visual_6 from './assets/images/stadium_visual_6.png';
import stadium_visual_7 from './assets/images/stadium_visual_7.png';
import stadium_visual_8 from './assets/images/stadium_visual_8.png';
import stadium_visual_9 from './assets/images/stadium_visual_9.png';
import stadium_visual_10 from './assets/images/stadium_visual_10.png';

// General Icons (ensure you have these files in src/assets/images/)
import matchIcon from './assets/images/match_icon.png';
import trainIcon from './assets/images/train_player_icon.png';
import recruitIcon from './assets/images/recruit_player_icon.png';
import playerBaseImg from './assets/images/player_base.png'; // Generic player avatar
import trophyBaseImg from './assets/images/trophy_base.png'; // Generic trophy/emblem


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
	const value = randomOverall * 100;

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

// League Tiers Data
interface LeagueTier {
    level: number;
    name: string;
    baseWinReward: number;
    overallMultiplier: number;
    opponentOverallRange: { minFactor: number; maxFactor: number }; // Opponent's OVR relative to yours
    promotionThresholdOverall: number; // Sum of player overalls for promotion
    promotionCost: number; // Cost to advance to next league
}

const LEAGUE_TIERS: LeagueTier[] = [
    {
        level: 1,
        name: "Amateur League",
        baseWinReward: 100,
        overallMultiplier: 0.5,
        opponentOverallRange: { minFactor: 0.4, maxFactor: 0.7 },
        promotionThresholdOverall: 400,
        promotionCost: 5000,
    },
    {
        level: 2,
        name: "Regional League",
        baseWinReward: 500,
        overallMultiplier: 1.0,
        opponentOverallRange: { minFactor: 0.6, maxFactor: 0.9 },
        promotionThresholdOverall: 800,
        promotionCost: 20000,
    },
    {
        level: 3,
        name: "National League",
        baseWinReward: 2000,
        overallMultiplier: 2.0,
        opponentOverallRange: { minFactor: 0.8, maxFactor: 1.1 },
        promotionThresholdOverall: 1500,
        promotionCost: 100000,
    },
    {
        level: 4,
        name: "Continental Championship",
        baseWinReward: 5000,
        overallMultiplier: 3.0,
        opponentOverallRange: { minFactor: 1.0, maxFactor: 1.3 },
        promotionThresholdOverall: 2500,
        promotionCost: 500000,
    },
    // Add more tiers as desired!
];

// Tier Colors (10 colors for 10 color tiers)
const TIER_COLORS = [
  "bg-gray-700",   // Tier 0 (Starter/Common)
  "bg-emerald-700",// Tier 1 (Uncommon)
  "bg-blue-700",   // Tier 2 (Rare)
  "bg-purple-700", // Tier 3 (Epic)
  "bg-yellow-700", // Tier 4 (Legendary)
  "bg-orange-700", // Tier 5 (Mythic)
  "bg-pink-700",   // Tier 6 (Divine)
  "bg-red-700",    // Tier 7 (Ascendant)
  "bg-lime-700",   // Tier 8 (Celestial)
  "bg-sky-700",    // Tier 9 (Cosmic)
];

// Define these global image arrays here, AFTER their imports
const TICKET_SALES_VISUAL_IMAGES = [
    ts_visual_1, ts_visual_2, ts_visual_3, ts_visual_4, ts_visual_5,
    ts_visual_6, ts_visual_7, ts_visual_8, ts_visual_9, ts_visual_10,
];

const STADIUM_VISUAL_IMAGES = [
    stadium_visual_1, stadium_visual_2, stadium_visual_3, stadium_visual_4, stadium_visual_5,
    stadium_visual_6, stadium_visual_7, stadium_visual_8, stadium_visual_9, stadium_visual_10,
];


// Function to calculate the image and color for an upgrade based on complex tiers
const getUpgradeVisuals = (
    currentUpgradeLevel: number,
    visualImages: string[], // Array of imported image paths for major visual tiers
    levelsPerVisualTier: number, // How many TOTAL levels before the next major image tier
    levelsPerColorTier: number = 1 // How many TOTAL levels before the next color tier
) => {
    const maxVisualTierIndex = visualImages.length - 1;
    const maxColorTierIndex = TIER_COLORS.length - 1;

    const visualTierIndex = Math.min(
        Math.floor(currentUpgradeLevel / levelsPerVisualTier),
        maxVisualTierIndex
    );

    const colorTierIndex = Math.min(
        Math.floor(currentUpgradeLevel / levelsPerColorTier) % TIER_COLORS.length,
        maxColorTierIndex
    );

    return {
        imageSrc: visualImages[visualTierIndex] || visualImages[0],
        colorClass: TIER_COLORS[colorTierIndex] || TIER_COLORS[0],
    };
};

// ----------------------------------------------------
// End Helper functions, Interfaces, and Image Imports
// ----------------------------------------------------


function App() {
	// --- Game State Variables ---
	const [money, setMoney] = useState(0);
	const [clickPower, setClickPower] = useState(1);
	const [stadiumCapacity, setStadiumCapacity] = useState(100);
	const [passiveIncomePerSecond, setPassiveIncomePerSecond] = useState(0);
    const [currentLeagueLevel, setCurrentLeagueLevel] = useState(1);

	const [players, setPlayers] = useState<Player[]>(() => {
		const savedGame = localStorage.getItem("quickKickMogulSave");
		if (savedGame) {
			const parsedState = JSON.parse(savedGame);
			return parsedState.players || generateInitialLineup();
		}
		return generateInitialLineup();
	});

    const MATCH_DURATION_SECONDS = 5 * 60; // 5 minutes in seconds
    const [matchInProgress, setMatchInProgress] = useState(false);
    const [matchTimeLeft, setMatchTimeLeft] = useState(MATCH_DURATION_SECONDS);
    const [matchProgress, setMatchProgress] = useState(0); // 0-100 percentage
    const matchIntervalRef = useRef<number | null>(null);

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

	const recruitNewPlayerInSlot = (slotIndex: number) => {
		const oldPlayer = players[slotIndex];
		if (!oldPlayer) return;

		const newPlayerMinOverall = oldPlayer.overall + 5;
		const newPlayerMaxOverall = oldPlayer.overall + 15;
		const newPlayer = generateRandomPlayer(
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

    const finishMatch = () => {
        setMatchInProgress(false);
        setMatchTimeLeft(MATCH_DURATION_SECONDS);

        if (matchIntervalRef.current !== null) {
            clearInterval(matchIntervalRef.current);
            matchIntervalRef.current = null;
        }

        const teamOverall = players.reduce((sum, p) => sum + p.overall, 0);

        if (teamOverall === 0) {
            alert("Match skipped: No players in your squad!");
            return;
        }

        const currentTier = LEAGUE_TIERS.find(tier => tier.level === currentLeagueLevel);
        if (!currentTier) {
            console.error("League tier data not found for level:", currentLeagueLevel);
            alert("Error: League data missing. Match aborted.");
            return;
        }

        const opponentOverall = Math.floor(
            Math.random() * (teamOverall * currentTier.opponentOverallRange.maxFactor - teamOverall * currentTier.opponentOverallRange.minFactor) + teamOverall * currentTier.opponentOverallRange.minFactor
        );

        let matchResult = "";
        let matchBonus = 0;

        if (teamOverall > opponentOverall * 1.1) {
            matchResult = `You crushed them! Won (${Math.floor(Math.random() * 3) + 2}-0) against ${currentTier.name} opponent!`;
            matchBonus = currentTier.baseWinReward * 1.5 + teamOverall * currentTier.overallMultiplier * 1.5;
        } else if (teamOverall > opponentOverall * 0.9) {
            matchResult = `Solid victory! Won (${Math.floor(Math.random() * 2) + 1}-0) against ${currentTier.name} opponent!`;
            matchBonus = currentTier.baseWinReward + teamOverall * currentTier.overallMultiplier;
        } else if (teamOverall > opponentOverall * 0.7) {
            matchResult = `Tough draw! You held your ground (${Math.floor(Math.random() * 2)}-${Math.floor(Math.random() * 2)}) in the ${currentTier.name}!`;
            matchBonus = currentTier.baseWinReward * 0.5 + teamOverall * currentTier.overallMultiplier * 0.5;
        } else {
            matchResult = `Loss... Time to train harder! (${Math.floor(Math.random() * 2)}-${Math.floor(Math.random() * 3) + 2}) in the ${currentTier.name}.`;
            matchBonus = currentTier.baseWinReward * 0.1 + teamOverall * currentTier.overallMultiplier * 0.1;
        }

        setMoney((prevMoney) => prevMoney + matchBonus);
        alert(
            `Match Result: ${matchResult} Gained $${Math.floor(matchBonus).toLocaleString()}!`
        );
    };

    const startMatch = () => {
        if (players.length === 0) {
            alert("You need players in your squad to play a match!");
            return;
        }
        if (matchInProgress) return;

        setMatchInProgress(true);
        setMatchTimeLeft(MATCH_DURATION_SECONDS);
        setMatchProgress(0);

        matchIntervalRef.current = window.setInterval(() => {
            setMatchTimeLeft((prevTime) => {
                const newTime = prevTime - 1;
                setMatchProgress(
                    ((MATCH_DURATION_SECONDS - newTime) / MATCH_DURATION_SECONDS) * 100
                );
                if (newTime <= 0) {
                    finishMatch();
                    return 0;
                }
                return newTime;
            });
        }, 1000);
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
			players,
            matchInProgress,
            matchTimeLeft,
            currentLeagueLevel,
		};
		localStorage.setItem("quickKickMogulSave", JSON.stringify(gameState));
	}, [
		money,
		clickPower,
		stadiumCapacity,
		passiveIncomePerSecond,
		players,
        matchInProgress,
        matchTimeLeft,
        currentLeagueLevel,
	]);

	// 4. Load Game State from Local Storage on initial component mount
	useEffect(() => {
		const savedGame = localStorage.getItem("quickKickMogulSave");
		if (savedGame) {
			const parsedState = JSON.parse(savedGame);
			setMoney(parsedState.money || 0);
			setClickPower(parsedState.clickPower || 1);
			setStadiumCapacity(parsedState.stadiumCapacity || 100);
			setPassiveIncomePerSecond(parsedState.passiveIncomePerSecond || 0);

            setMatchInProgress(parsedState.matchInProgress || false);
            setMatchTimeLeft(parsedState.matchTimeLeft || MATCH_DURATION_SECONDS);
            setCurrentLeagueLevel(parsedState.currentLeagueLevel || 1);

            if (parsedState.matchInProgress && parsedState.matchTimeLeft > 0) {
                setMatchProgress(
                    ((MATCH_DURATION_SECONDS - parsedState.matchTimeLeft) / MATCH_DURATION_SECONDS) * 100
                );
                matchIntervalRef.current = window.setInterval(() => {
                    setMatchTimeLeft((prevTime) => {
                        const newTime = prevTime - 1;
                        setMatchProgress(
                            ((MATCH_DURATION_SECONDS - newTime) / MATCH_DURATION_SECONDS) * 100
                        );
                        if (newTime <= 0) {
                            finishMatch();
                            return 0;
                        }
                        return newTime;
                    });
                }, 1000);
            }
		} else {
			setPassiveIncomePerSecond(stadiumCapacity / 100);
		}
        return () => {
            if (matchIntervalRef.current !== null) {
                clearInterval(matchIntervalRef.current);
            }
        };
	}, []);

    // Helper to format time for display (MM:SS)
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

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
                {/* Display Current League */}
                <p className="text-2xl font-bold mt-4 text-blue-300">
                    Current League: {LEAGUE_TIERS.find(t => t.level === currentLeagueLevel)?.name || "Unknown League"}
                </p>
			</div>

			{/* Main Click Button */}
			<button
				onClick={handleTicketSaleClick}
				className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-6 px-12 rounded-xl text-2xl shadow-lg transform transition-all duration-150 ease-in-out hover:scale-105 active:scale-95 border-b-4 border-blue-800 mb-12"
			>
				Sell Match Tickets (+${clickPower})
			</button>

			{/* Play Match Button / Progress Bar */}
			<div className="mb-8 w-full max-w-lg">
				{matchInProgress ? (
					<div className="bg-gray-700 rounded-full h-8 flex items-center justify-center relative overflow-hidden shadow-inner">
						<div
							className="bg-red-600 h-full absolute left-0 top-0 transition-all ease-linear"
							style={{ width: `${matchProgress}%` }}
						></div>
						<span className="relative z-10 text-lg font-bold">
							Match in Progress: {formatTime(matchTimeLeft)} ({matchProgress.toFixed(1)}%)
						</span>
					</div>
				) : (
					<button
						onClick={startMatch}
						className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-lg transform transition-all duration-150 ease-in-out hover:scale-105 border-b-4 border-red-800 w-full flex items-center justify-center"
						disabled={players.length === 0}
					>
                        <img src={matchIcon} alt="Play Match" className="w-8 h-8 mr-2" />
						Play Match!
					</button>
				)}
			</div>

			{/* Upgrades Section */}
			<div className="w-full max-w-lg bg-gray-800 rounded-lg p-6 shadow-xl border-t-4 border-yellow-500">
				<h2 className="text-3xl font-bold mb-6 text-center text-yellow-400">
					Club Upgrades
				</h2>

				{/* Upgrade 1: Click Power (Ticket Sales) */}
                {/* Visuals calculated using getUpgradeVisuals */}
                {
                    (() => {
                        const ticketSalesVisuals = getUpgradeVisuals(
                            clickPower,
                            TICKET_SALES_VISUAL_IMAGES,
                            10, // Change major image every 10 levels of clickPower
                            1   // Change color every 1 level of clickPower within a visual tier
                        );
                        return (
                            <div className="mb-4 flex flex-col sm:flex-row justify-between items-center bg-gray-700 p-4 rounded-md shadow-inner">
                                <div className="flex items-center mb-2 sm:mb-0 sm:mr-4">
                                    <div className={`w-16 h-16 mr-4 rounded-md shadow-md flex items-center justify-center overflow-hidden ${ticketSalesVisuals.colorClass}`}>
                                        <img
                                            src={ticketSalesVisuals.imageSrc}
                                            alt="Ticket Sales Upgrade"
                                            className="w-14 h-14 object-contain"
                                        />
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <p className="text-xl font-semibold">Boost Ticket Sales</p>
                                        <p className="text-gray-400">Current: +${clickPower} per click</p>
                                    </div>
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
                        );
                    })()
                }


				{/* Upgrade 2: Stadium Capacity (Passive Income) */}
                {/* Visuals calculated using getUpgradeVisuals */}
                {
                    (() => {
                        const stadiumUpgradeLevel = Math.floor(stadiumCapacity / 100) - 1; // Normalize to 0-indexed upgrade level
                        const stadiumVisuals = getUpgradeVisuals(
                            stadiumUpgradeLevel,
                            STADIUM_VISUAL_IMAGES,
                            2, // Change major image every 2 stadium effective upgrades (200 capacity increase)
                            1  // Change color every 1 stadium effective upgrade (100 capacity increase)
                        );
                        return (
                            <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-700 p-4 rounded-md shadow-inner">
                                <div className="flex items-center mb-2 sm:mb-0 sm:mr-4">
                                    <div className={`w-16 h-16 mr-4 rounded-md shadow-md flex items-center justify-center overflow-hidden ${stadiumVisuals.colorClass}`}>
                                        <img
                                            src={stadiumVisuals.imageSrc}
                                            alt="Stadium Upgrade"
                                            className="w-14 h-14 object-contain"
                                        />
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <p className="text-xl font-semibold">Expand Stadium</p>
                                        <p className="text-gray-400">Capacity: {stadiumCapacity} seats</p>
                                        <p className="text-gray-400">
                                            Passive Income: +${(stadiumCapacity / 100).toFixed(1)}/sec
                                        </p>
                                    </div>
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
                        );
                    })()
                }


                {/* Promote to Next League Upgrade */}
                {/* Visuals for League Emblem (using trophyBaseImg and coloring based on league level) */}
                {
                    (() => {
                        const leagueVisuals = getUpgradeVisuals(
                            currentLeagueLevel,
                            [trophyBaseImg], // Only one visual image for leagues (but it uses color tiers)
                            1000, // Very high number, so it never changes "visual tier" image
                            1     // Change color every 1 league level
                        );
                        const nextLeague = LEAGUE_TIERS.find(t => t.level === currentLeagueLevel + 1);

                        return (
                            <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-700 p-4 rounded-md shadow-inner mt-4">
                                <div className="flex items-center mb-2 sm:mb-0 sm:mr-4">
                                    <div className={`w-16 h-16 mr-4 rounded-md shadow-md flex items-center justify-center overflow-hidden ${leagueVisuals.colorClass}`}>
                                        <img src={trophyBaseImg} alt="League Emblem" className="w-14 h-14 object-contain" />
                                    </div>
                                    <div className="text-center sm:text-left">
                                        <p className="text-xl font-semibold">Promote to Next League</p>
                                        {currentLeagueLevel < LEAGUE_TIERS.length ? (
                                            <>
                                                <p className="text-gray-400">Current: {LEAGUE_TIERS.find(t => t.level === currentLeagueLevel)?.name}</p>
                                                <p className="text-gray-400">Next: {nextLeague?.name}</p>
                                                <p className="text-gray-400">Required Team OVR: {nextLeague?.promotionThresholdOverall.toLocaleString()}</p>
                                            </>
                                        ) : (
                                            <p className="text-gray-400">You are in the highest league!</p>
                                        )}
                                    </div>
                                </div>
                                {currentLeagueLevel < LEAGUE_TIERS.length && (
                                    <button
                                        onClick={() => {
                                            if (!nextLeague) return;

                                            const teamOverall = players.reduce((sum, p) => sum + p.overall, 0);

                                            if (money < nextLeague.promotionCost) {
                                                alert(`Not enough money for promotion! Needs $${nextLeague.promotionCost.toLocaleString()}.`);
                                                return;
                                            }
                                            if (teamOverall < nextLeague.promotionThresholdOverall) {
                                                alert(`Your team is not strong enough for ${nextLeague.name}! Total OVR needed: ${nextLeague.promotionThresholdOverall.toLocaleString()} (Your team: ${teamOverall.toLocaleString()}).`);
                                                return;
                                            }

                                            setMoney(money - nextLeague.promotionCost);
                                            setCurrentLeagueLevel(currentLeagueLevel + 1);
                                            alert(`Congratulations! You've been promoted to the ${nextLeague.name}!`);
                                        }}
                                        className={`py-3 px-6 rounded-lg font-bold transition-colors duration-200 ${
                                            money >= (nextLeague?.promotionCost || Infinity) &&
                                            players.reduce((sum, p) => sum + p.overall, 0) >= (nextLeague?.promotionThresholdOverall || Infinity)
                                                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                                                : 'bg-gray-500 cursor-not-allowed'
                                        }`}
                                        disabled={
                                            currentLeagueLevel >= LEAGUE_TIERS.length ||
                                            money < (nextLeague?.promotionCost || Infinity) ||
                                            players.reduce((sum, p) => sum + p.overall, 0) < (nextLeague?.promotionThresholdOverall || Infinity)
                                        }
                                    >
                                        Promote (Cost: ${nextLeague?.promotionCost.toLocaleString() || 'N/A'})
                                    </button>
                                )}
                            </div>
                        );
                    })()
                }
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
								<div className="flex items-center mb-2 sm:mb-0 text-center sm:text-left">
                                    {/* Player Avatar with dynamic color tier */}
                                    {
                                        (() => {
                                            const playerVisuals = getUpgradeVisuals(
                                                player.overall,
                                                [playerBaseImg], // Only one visual image for players
                                                1000, // Very high number, so it never changes "visual tier"
                                                5     // Change color every 5 Overall points
                                            );
                                            return (
                                                <div className={`w-12 h-12 mr-3 rounded-full flex items-center justify-center overflow-hidden ${playerVisuals.colorClass}`}>
                                                    <img
                                                        src={playerBaseImg}
                                                        alt="Player Avatar"
                                                        className="w-10 h-10 object-contain"
                                                    />
                                                </div>
                                            );
                                        })()
                                    }
									<div>
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
								</div>
								<div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
									{/* Train Player Button */}
									<button
										onClick={() => trainPlayerInSlot(index)} // Pass index
										className={`py-2 px-4 rounded-md font-bold transition-colors duration-200 text-sm flex items-center justify-center ${
											money >= player.overall * 5
												? "bg-orange-600 hover:bg-orange-700 active:bg-orange-800"
												: "bg-gray-500 cursor-not-allowed"
										}`}
										disabled={money < player.overall * 5}
									>
                                        <img src={trainIcon} alt="Train Player" className="w-4 h-4 mr-1" />
										Train (Cost: ${(player.overall * 5).toLocaleString()})
									</button>
									{/* Recruit New Player Button for this slot */}
									<button
										onClick={() => recruitNewPlayerInSlot(index)} // Pass index
										className={`py-2 px-4 rounded-md font-bold transition-colors duration-200 text-sm flex items-center justify-center ${
											money >= (player.overall + 5) * 100 // Estimate new player cost for button disabled state
												? "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
												: "bg-gray-500 cursor-not-allowed"
										}`}
										disabled={money < (player.overall + 5) * 100}
									>
                                        <img src={recruitIcon} alt="Recruit Player" className="w-4 h-4 mr-1" />
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