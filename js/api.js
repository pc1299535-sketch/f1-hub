// js/api.js
import { fallbackCalendar, fallbackDrivers, fallbackCars, fallbackTeams } from './data.js';

// Ergast API Base URL (Migrated to Jolpi Mirror for active 2024/2026 season data)
const API_BASE = 'https://api.jolpi.ca/ergast/f1';

export async function getSchedule(year = '2026') {
    try {
        const response = await fetch(`${API_BASE}/${year}.json`);
        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();
        
        if (!data.MRData.RaceTable.Races || data.MRData.RaceTable.Races.length === 0) {
            throw new Error('API returned empty schedule for 2026');
        }
        
        const races = data.MRData.RaceTable.Races;
        // Merge API data with rich imagery from fallback
        return races.map((race, idx) => {
            const fallbackInfo = fallbackCalendar.find(fb => fb.round == race.round) || fallbackCalendar[idx];
            return {
                round: race.round,
                raceName: race.raceName,
                date: race.date,
                time: race.time || '15:00:00Z',
                circuitName: race.Circuit.circuitName,
                circuitId: race.Circuit.circuitId,
                country: race.Circuit.Location.country,
                flag: fallbackInfo ? fallbackInfo.flag : '🌐',
                laps: fallbackInfo ? fallbackInfo.laps : 'TBD',
                length: fallbackInfo ? fallbackInfo.length : 'TBD',
                firstGP: fallbackInfo ? fallbackInfo.firstGP : 'TBD',
                image: fallbackInfo ? fallbackInfo.image : 'https://placehold.co/800x450/15151e/ffffff?text=F1+Circuit'
            };
        });
    } catch (error) {
        console.warn('API fetch failed, utilizing hardcoded robust fallback:', error);
        return fallbackCalendar.map(fb => ({
            ...fb, 
            circuitName: fb.circuit,
            time: '14:00:00Z'
        }));
    }
}

export async function getDriverStandings(year = 'current') {
    try {
        const response = await fetch(`${API_BASE}/${year}/driverStandings.json`);
        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();
        
        if(!data.MRData.StandingsTable.StandingsLists || data.MRData.StandingsTable.StandingsLists.length === 0) {
            throw new Error(`API returned empty driver standings for ${year}`);
        }
        
        const standings = data.MRData.StandingsTable.StandingsLists[0].DriverStandings;
        return standings.map(s => {
            const fallbackInfo = fallbackDrivers.find(fb => fb.code === s.Driver.code) || {};
            return {
                ...s.Driver,
                points: s.points,
                wins: s.wins,
                position: s.position,
                Constructors: s.Constructors,
                image: fallbackInfo.image || 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/fallback.png'
            };
        });
    } catch (error) {
        console.warn(`Standings fetch failed for ${year}, using robust fallback data.`);
        return fallbackDrivers.map((driver, idx) => ({
            ...driver,
            position: idx + 1
        }));
    }
}

export async function getCars() {
    return fallbackCars;
}

export async function getConstructorStandings(year = 'current') {
    try {
        const response = await fetch(`${API_BASE}/${year}/constructorStandings.json`);
        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();
        
        if(!data.MRData.StandingsTable.StandingsLists || data.MRData.StandingsTable.StandingsLists.length === 0) {
            throw new Error(`API returned empty constructor standings for ${year}`);
        }
        
        const standings = data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
        return standings.map(s => {
            const fb = fallbackTeams.find(t => t.id === s.Constructor.constructorId) || fallbackTeams[0];
            return {
                ...s.Constructor,
                points: s.points,
                wins: s.wins,
                position: s.position,
                image: fb.image || `https://placehold.co/800x400/1e1e2c/ffffff?text=${s.Constructor.name}`
            };
        });
    } catch (error) {
        console.warn(`Constructor Standings fetch failed for ${year}, using robust fallback data.`);
        return fallbackTeams.map((team, idx) => ({
            ...team,
            points: 100 - (idx * 10),
            wins: team.name === "Red Bull" ? 2 : 0,
            position: idx + 1
        }));
    }
}
