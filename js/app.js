// js/app.js
import { getSchedule, getDriverStandings, getCars, getConstructorStandings } from './api.js';

class App {
    constructor() {
        this.appContent = document.getElementById('app-content');
        this.navLinks = document.querySelectorAll('.nav-links a');
        this.countdownInterval = null;
        
        // Setup initial smooth scroll
        this.lenis = new Lenis({
            smooth: true,
            scrollbar: false
        });
        
        requestAnimationFrame(this.raf.bind(this));

        // Router listeners
        window.addEventListener('hashchange', () => this.handleRouting());
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                this.navLinks.forEach(l => l.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Initialize App
        this.init();
    }

    raf(time) {
        this.lenis.raf(time);
        requestAnimationFrame(this.raf.bind(this));
    }

    async init() {
        // Build the basic Home structure on load if hash is empty
        if(!window.location.hash) {
            window.location.hash = '#home';
        } else {
            this.handleRouting();
        }
    }

    async handleRouting() {
        const hash = window.location.hash.replace('#', '') || 'home';
        
        if(this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        if(this.calendarInterval) clearInterval(this.calendarInterval);
        
        switch(hash) {
            case 'home':
                this.renderHome();
                break;
            case 'calendar':
                await this.renderCalendar();
                break;
            case 'circuits':
                await this.renderCircuits();
                break;
            case 'cars':
                await this.renderCars();
                break;
            case 'drivers':
                await this.renderDrivers();
                break;
            case 'teams':
                await this.renderTeams();
                break;
            default:
                this.appContent.innerHTML = `<div class="container"><h1 class="section-title">Coming Soon: <span>${hash.toUpperCase()}</span></h1></div>`;
        }
    }

    async renderHome() {
        this.appContent.innerHTML = `
            <section class="hero" style="
                min-height: 100vh;
                position: relative;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                text-align: center;
                overflow: hidden;
                background-image: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('images/cars/user_upload.png');
                background-size: cover;
                background-position: center;
                background-attachment: fixed;
                background-repeat: no-repeat;
            ">
                <div style="z-index: 10; position: relative;">
                    <h1 class="section-title" style="font-size: clamp(3rem, 8vw, 6rem); margin-bottom: 1rem; text-shadow: 0 5px 15px rgba(0,0,0,0.8); color: #ffffff;">THE PINNACLE OF <br><span style="color: var(--clr-red);">MOTORSPORT</span></h1>
                    <div id="hero-countdown" style="font-family: var(--font-heading); font-size: clamp(2rem, 5vw, 4rem); letter-spacing: 5px; color: var(--clr-white); text-shadow: 0 2px 10px rgba(0,0,0,0.8);">CALCULATING TELEMETRY...</div>
                    <p id="hero-next-race" style="font-size: 1.2rem; color: #fff; margin-top: 1rem; text-transform: uppercase; font-weight: 800; letter-spacing: 2px; text-shadow: 0 2px 5px rgba(0,0,0,0.8);"></p>
                </div>
            </section>
        `;
        
        // Setup countdown logic
        const schedule = await getSchedule();
        const now = new Date();
        const upcomingRaces = schedule.filter(r => new Date(`${r.date}T${r.time}`) > now);
        
        if(upcomingRaces.length > 0) {
            const nextRace = upcomingRaces[0];
            const targetDate = new Date(`${nextRace.date}T${nextRace.time}`).getTime();
            
            document.getElementById('hero-next-race').textContent = `NEXT UP: ${nextRace.raceName}`;
            
            this.countdownInterval = setInterval(() => {
                const current = new Date().getTime();
                const distance = targetDate - current;
                
                if(distance < 0) {
                    clearInterval(this.countdownInterval);
                    document.getElementById('hero-countdown').innerHTML = "IT'S LIGHTS OUT!";
                    return;
                }
                
                const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
                const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
                const seconds = Math.floor((distance % (1000 * 60)) / 1000).toString().padStart(2, '0');
                
                document.getElementById('hero-countdown').innerHTML = `${days}D : ${hours}H : ${minutes}M : ${seconds}S`;
            }, 1000);
        } else {
            document.getElementById('hero-countdown').innerHTML = "SEASON COMPLETE";
        }
    }

    async renderCalendar() {
        this.appContent.innerHTML = `<div class="container"><h1 class="section-title">Locating <span>2026 Season...</span></h1></div>`;
        
        const schedule = await getSchedule('2026');
        const now = new Date();
        
        // Find exactly which race is NEXT
        const upcomingRaces = schedule.filter(r => new Date(`${r.date}T${r.time}`) > now);
        const nextRace = upcomingRaces.length > 0 ? upcomingRaces[0] : null;
        
        let html = `
            <div class="container">
                <h1 class="section-title">2026 SEASON <span>CALENDAR</span></h1>
                <div class="calendar-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
        `;

        schedule.forEach(race => {
            const isNext = nextRace && race.round === nextRace.round;
            const glowBox = isNext ? 'box-shadow: 0 0 20px rgba(225, 6, 0, 0.6); border: 1px solid var(--clr-red);' : 'border: 1px solid var(--clr-surface-light);';
            const clickEventData = JSON.stringify({
                name: race.raceName,
                date: race.date,
                time: race.time,
                flag: race.flag
            }).replace(/'/g, "&apos;");
            
            html += `
                <div class="race-card-text" data-json='${clickEventData}' style="background: var(--clr-surface); border-radius: 8px; padding: 2rem; cursor: pointer; transition: transform 0.3s ease; position: relative; ${glowBox}">
                    ${isNext ? '<span style="position: absolute; top: -10px; right: 20px; background: var(--clr-red); padding: 5px 15px; border-radius: 20px; font-size: 0.8rem; font-weight: bold;">NEXT UP</span>' : ''}
                    <div style="font-size: 3rem; margin-bottom: 1rem;">${race.flag}</div>
                    <h3 style="color: var(--clr-red); font-size: 0.8rem; text-transform: uppercase; margin-bottom: 0.5rem;">ROUND ${race.round}</h3>
                    <h2 style="font-family: var(--font-heading); font-size: 1.5rem; margin-bottom: 0.5rem;">${race.raceName}</h2>
                    <p style="color: var(--clr-white); font-weight: 600;">${race.date}</p>
                    <p style="color: var(--clr-text-muted); font-size: 0.9rem; margin-top: 0.5rem;">${race.circuitName}</p>
                </div>
            `;
        });

        html += `
                </div>
                
                <!-- Live Countdown Details Modal -->
                <div id="calendar-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(21,21,30,0.95); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(5px);">
                    <div style="background: var(--clr-surface); border-radius: 16px; padding: 4rem 2rem; max-width: 600px; width: 90%; position: relative; border-top: 4px solid var(--clr-red); text-align: center;">
                        <button id="close-cal-modal" style="position: absolute; top: 1rem; right: 1.5rem; background: none; border: none; color: var(--clr-white); font-size: 2rem; cursor: pointer;">&times;</button>
                        
                        <div id="modal-cal-flag" style="font-size: 4rem; line-height: 1;"></div>
                        <h2 id="modal-cal-name" style="font-family: var(--font-heading); font-size: 2.5rem; color: var(--clr-red); margin: 1rem 0;"></h2>
                        <p id="modal-cal-datetime" style="font-size: 1.2rem; margin-bottom: 2rem;"></p>
                        
                        <div style="background: var(--clr-bg); padding: 2rem; border-radius: 8px;">
                            <p style="color: var(--clr-text-muted); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 0.5rem;">LIVE COUNTDOWN</p>
                            <div id="live-countdown-text" style="font-family: var(--font-heading); font-size: 2.5rem; color: var(--clr-white);"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.appContent.innerHTML = html;
        
        const modal = document.getElementById('calendar-modal');
        const countDisplay = document.getElementById('live-countdown-text');
        
        document.querySelectorAll('.race-card-text').forEach(card => {
            card.addEventListener('mouseenter', () => gsap.to(card, {y: -5, duration: 0.3}));
            card.addEventListener('mouseleave', () => gsap.to(card, {y: 0, duration: 0.3}));
            
            card.addEventListener('click', () => {
                const data = JSON.parse(card.getAttribute('data-json').replace(/&apos;/g, "'"));
                document.getElementById('modal-cal-flag').textContent = data.flag;
                document.getElementById('modal-cal-name').textContent = data.name;
                document.getElementById('modal-cal-datetime').textContent = `${data.date} | ${data.time}`;
                
                modal.style.display = 'flex';
                gsap.from(modal.children[0], {scale: 0.9, opacity: 0, duration: 0.3, ease: 'back.out(1.5)'});
                
                // Hook the countdown
                if(this.calendarInterval) clearInterval(this.calendarInterval);
                const targetDate = new Date(`${data.date}T${data.time}`).getTime();
                
                const updateCountdown = () => {
                    const current = new Date().getTime();
                    const distance = targetDate - current;
                    
                    if(distance < 0) {
                        countDisplay.innerHTML = "RACE COMPLETED";
                        countDisplay.style.color = "var(--clr-text-muted)";
                        return;
                    }
                    
                    countDisplay.style.color = "var(--clr-white)";
                    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0');
                    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
                    const seconds = Math.floor((distance % (1000 * 60)) / 1000).toString().padStart(2, '0');
                    countDisplay.innerHTML = `${days}D : ${hours}H : ${minutes}M : ${seconds}S`;
                };
                updateCountdown();
                this.calendarInterval = setInterval(updateCountdown, 1000);
            });
        });
        
        document.getElementById('close-cal-modal').addEventListener('click', () => {
            modal.style.display = 'none';
            if(this.calendarInterval) clearInterval(this.calendarInterval);
        });
    }

    async renderCircuits() {
        this.appContent.innerHTML = `<div class="container"><h1 class="section-title">Loading <span>Circuits...</span></h1></div>`;
        const schedule = await getSchedule();
        
        let html = `
            <div class="container">
                <h1 class="section-title">GLOBAL <span>CIRCUITS</span></h1>
                <div class="circuit-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem;">
        `;

        schedule.forEach(c => {
            html += `
                <div class="circuit-card" data-json='${JSON.stringify({
                    name: c.circuitName,
                    country: c.country,
                    flag: c.flag,
                    image: c.image,
                    length: c.length,
                    laps: c.laps,
                    firstGP: c.firstGP
                }).replace(/'/g, "&apos;")}' style="background: var(--clr-surface); border-radius: 12px; overflow: hidden; cursor: pointer; border: 1px solid var(--clr-surface-light);">
                    <div style="height: 180px; padding: 1.5rem; background: var(--clr-surface-light); display: flex; justify-content: center; align-items: center;">
                        <img src="${c.image}" style="max-height: 100%; max-width: 100%; filter: invert(1) opacity(0.8);">
                    </div>
                    <div style="padding: 1.5rem;">
                        <div style="font-size: 2rem;">${c.flag}</div>
                        <h2 style="font-family: var(--font-heading); font-size: 1.2rem; margin-top: 0.5rem;">${c.circuitName}</h2>
                        <p style="color: var(--clr-text-muted); font-size: 0.9rem;">${c.country}</p>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
                
                <!-- Circuit Modal -->
                <div id="circuit-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(21,21,30,0.95); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(5px);">
                    <div style="background: var(--clr-surface); border-radius: 16px; padding: 3rem; max-width: 800px; width: 90%; position: relative; border: 1px solid var(--clr-red);">
                        <button id="close-modal" style="position: absolute; top: 1rem; right: 1.5rem; background: none; border: none; color: var(--clr-white); font-size: 2rem; cursor: pointer;">&times;</button>
                        <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
                            <div style="flex: 1; min-width: 250px; background: var(--clr-bg); border-radius: 8px; padding: 1rem;">
                                <img id="modal-c-img" src="" style="width: 100%; height: 100%; object-fit: contain; filter: invert(1);">
                            </div>
                            <div style="flex: 1; min-width: 250px;">
                                <div id="modal-c-flag" style="font-size: 3rem; margin-bottom: 0.5rem;"></div>
                                <h2 id="modal-c-name" style="font-family: var(--font-heading); font-size: 2rem; color: var(--clr-red); margin-bottom: 1rem;"></h2>
                                <p style="color: var(--clr-text-muted); margin-bottom: 1.5rem;" id="modal-c-country"></p>
                                
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                    <div><strong style="color: var(--clr-red);">LENGTH</strong><br><span id="modal-c-len"></span></div>
                                    <div><strong style="color: var(--clr-red);">LAPS</strong><br><span id="modal-c-laps"></span></div>
                                    <div><strong style="color: var(--clr-red);">FIRST GP</strong><br><span id="modal-c-first"></span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        this.appContent.innerHTML = html;

        // Modal Logic
        const modal = document.getElementById('circuit-modal');
        document.querySelectorAll('.circuit-card').forEach(card => {
            card.addEventListener('click', () => {
                const data = JSON.parse(card.getAttribute('data-json').replace(/&apos;/g, "'"));
                document.getElementById('modal-c-img').src = data.image;
                document.getElementById('modal-c-flag').textContent = data.flag;
                document.getElementById('modal-c-name').textContent = data.name;
                document.getElementById('modal-c-country').textContent = data.country;
                document.getElementById('modal-c-len').textContent = data.length;
                document.getElementById('modal-c-laps').textContent = data.laps;
                document.getElementById('modal-c-first').textContent = data.firstGP;
                
                modal.style.display = 'flex';
                gsap.from(modal.children[0], {scale: 0.9, opacity: 0, duration: 0.3, ease: 'back.out(1.5)'});
            });
            
            card.addEventListener('mouseenter', () => gsap.to(card, {y: -10, duration: 0.3}));
            card.addEventListener('mouseleave', () => gsap.to(card, {y: 0, duration: 0.3}));
        });
        
        document.getElementById('close-modal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    async renderCars() {
        this.appContent.innerHTML = `<div class="container"><h1 class="section-title">Loading <span>Vehicles...</span></h1></div>`;
        const cars = await getCars();
        
        let html = `
            <section style="position: relative; min-height: 100vh; padding: 4rem 0; width: 100%; overflow: hidden;">
                <!-- Full Section Background Image -->
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0;">
                    <img src="https://images.unsplash.com/photo-1502444330042-d1a1ddf9d779?auto=format&fit=crop&q=80&w=2000" 
                         referrerpolicy="no-referrer"
                         onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1532938911079-1b06ac7ce122?auto=format&fit=crop&q=80&w=2000';"
                         style="width: 100%; height: 100%; object-fit: cover; object-position: center; display: block;" alt="F1 Racing Background">
                </div>
                <!-- Dark Overlay -->
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to bottom, rgba(21, 21, 30, 0.7) 0%, rgba(21, 21, 30, 0.85) 100%); z-index: 1; backdrop-filter: blur(3px);"></div>
                
                <div class="container" style="position: relative; z-index: 2;">
                    <h1 class="section-title" style="font-size: 4rem; text-shadow: 0 4px 10px rgba(0,0,0,0.8);">F1 <span>CARS</span></h1>
                    <div class="cars-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 3rem;">
        `;
        
        cars.forEach(car => {
            const carPhoto = car.image || 'https://images.unsplash.com/photo-1532938911079-1b06ac7ce122?auto=format&fit=crop&q=80&w=1200';
            html += `
                <div class="car-card" style="background: rgba(21,21,30,0.7); border-radius: 16px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden; position: relative; backdrop-filter: blur(10px);">
                    <div style="position: relative; width: 100%; height: 260px; overflow: hidden; background: url('https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&q=80&w=800') center/cover;">
                        <div style="position: absolute; top:0; left:0; width:100%; height:100%; background: linear-gradient(to bottom, rgba(21,21,30,0.3) 0%, rgba(21,21,30,0.95) 100%); z-index: 1;"></div>
                        <img src="${carPhoto}" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1532938911079-1b06ac7ce122?auto=format&fit=crop&q=80&w=1200';" style="position: relative; z-index: 2; width: 100%; height: 100%; object-fit: contain; padding: 2rem 3rem 4rem 3rem; transform-origin: center center; transition: transform 0.3s ease; display: block; filter: drop-shadow(0 15px 15px rgba(0,0,0,0.8));" class="car-img" alt="${car.name}">
                    </div>
                    <div style="padding: 1.5rem; text-align: center; position: relative; z-index: 3; background: transparent; border-top: 1px solid rgba(255,255,255,0.05);">
                        <h3 style="color: var(--clr-red); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; font-weight: 800;">SEASON ${car.year}</h3>
                        <h2 style="font-family: var(--font-heading); font-size: 2.2rem; margin: 0.5rem 0; color: #ffffff;">${car.name}</h2>
                        <p style="font-weight: 800; color: #ffffff; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 1px;">${car.team}</p>
                        <p style="color: #a0a0b5; font-size: 0.9rem; margin-top: 0.5rem; text-transform: uppercase; font-weight: 700;">POWERED BY ${car.engine}</p>
                    </div>
                </div>
            `;
        });
        
        html += `</div></div></section>`;
        this.appContent.innerHTML = html;
        
        document.querySelectorAll('.car-card').forEach(card => {
            const img = card.querySelector('.car-img');
            card.addEventListener('mouseenter', () => {
                gsap.to(card, {y: -10, boxShadow: '0 20px 40px rgba(0,0,0,0.8)', duration: 0.3});
                gsap.to(img, {scale: 1.05, duration: 0.3, ease: 'power2.out'});
            });
            card.addEventListener('mouseleave', () => {
                gsap.to(card, {y: 0, boxShadow: 'none', duration: 0.3});
                gsap.to(img, {scale: 1.0, duration: 0.3, ease: 'power2.out'});
            });
        });
    }

    async renderDrivers() {
        this.appContent.innerHTML = `<div class="container"><h1 class="section-title">Fetching <span>Championship Standings...</span></h1></div>`;
        
        // Fetch explicit real live standings ('current') to mathematically enforce truth
        const drivers = await getDriverStandings('current');
        
        let html = `
            <style>
                .standings-row:hover {
                    transform: translateX(10px) scale(1.02);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.5);
                    z-index: 10;
                    position: relative;
                }
            </style>
            <div class="container">
                <h1 class="section-title">CHAMPIONSHIP <span>STANDINGS</span></h1>
                
                <table class="standings-table" style="border-collapse: separate; border-spacing: 0 10px; width: 100%;">
                    <thead>
                        <tr style="text-align: left; color: var(--clr-text-muted); font-size: 0.9rem;">
                            <th style="padding: 1rem 2rem;">POS</th>
                            <th style="padding: 1rem;">DRIVER</th>
                            <th style="padding: 1rem;">TEAM</th>
                            <th style="padding: 1rem;">POINTS</th>
                            <th style="padding: 1rem;">WINS</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        // Sort explicitly by points safely (if numeric)
        drivers.sort((a,b) => parseFloat(b.points) - parseFloat(a.points));
        
        const teamColors = {
            'Red Bull': 'rgba(6, 0, 239, 0.15)',
            'Ferrari': 'rgba(220, 0, 0, 0.15)',
            'McLaren': 'rgba(255, 128, 0, 0.15)',
            'Mercedes': 'rgba(0, 210, 190, 0.15)',
            'Aston Martin': 'rgba(0, 110, 96, 0.15)',
            'Alpine': 'rgba(0, 144, 255, 0.15)',
            'Williams': 'rgba(0, 90, 255, 0.15)',
            'RB': 'rgba(102, 146, 255, 0.15)',
            'Kick Sauber': 'rgba(82, 226, 82, 0.15)',
            'Haas F1 Team': 'rgba(255, 255, 255, 0.1)',
            'Red Bull Racing': 'rgba(6, 0, 239, 0.15)'
        };
        
        drivers.forEach((d, index) => {
            const driverName = d.givenName ? `${d.givenName} ${d.familyName}` : d.name;
            const driverTeam = d.Constructors && d.Constructors.length > 0 ? d.Constructors[0].name : (d.team || 'Loading');
            const driverPhoto = d.image || 'https://placehold.co/400x400/15151e/ffffff?text=Driver';
            const wins = d.wins || '0';
            const position = d.position || (index + 1);
            
            // Podium Logic
            let posStyle = 'color: var(--clr-text-muted); font-weight: bold; font-size: 1.2rem;';
            if(index === 0) posStyle = 'color: #FFD700; font-weight: 900; font-size: 1.8rem; text-shadow: 0 0 15px rgba(255,215,0,0.6);';
            else if(index === 1) posStyle = 'color: #C0C0C0; font-weight: 800; font-size: 1.5rem; text-shadow: 0 0 10px rgba(192,192,192,0.4);';
            else if(index === 2) posStyle = 'color: #CD7F32; font-weight: 800; font-size: 1.4rem; text-shadow: 0 0 10px rgba(205,127,50,0.4);';
            
            const tColor = teamColors[driverTeam] || 'var(--clr-surface)';
            const bColor = tColor !== 'var(--clr-surface)' ? tColor.replace(/0\.15|0\.1/, '0.8') : 'var(--clr-surface-light)';
            
            html += `
                        <tr class="standings-row" style="background: ${tColor}; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease; border-radius: 12px; cursor: default;">
                            <td style="padding: 1rem 2rem; border-top-left-radius: 12px; border-bottom-left-radius: 12px; border-left: 5px solid ${bColor}; font-family: var(--font-heading); ${posStyle}">${position}</td>
                            <td style="padding: 1rem;">
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    <img src="${driverPhoto}" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/fallback.png';" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 2px solid ${bColor}; background: var(--clr-bg);">
                                    <span style="font-weight: 800; font-size: 1.2rem; color: var(--clr-white);">${driverName}</span>
                                </div>
                            </td>
                            <td style="padding: 1rem; text-transform: uppercase; font-weight: 600; font-size: 0.9rem; color: var(--clr-text-muted);">${driverTeam}</td>
                            <td style="padding: 1rem; font-family: var(--font-heading); font-size: 1.8rem; color: var(--clr-white);">${d.points}</td>
                            <td style="padding: 1rem; border-top-right-radius: 12px; border-bottom-right-radius: 12px; font-weight: bold; font-size: 1.2rem; color: var(--clr-text-muted);">${wins}</td>
                        </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
                
                <h2 class="section-title" style="font-size: 2rem; margin-top: 4rem;">THE <span>GRID</span></h2>
                <div class="driver-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 2.5rem;">
        `;
        
        drivers.forEach(d => {
            const firstName = d.givenName || (d.name ? d.name.split(' ')[0] : '');
            const lastName = d.familyName || (d.name ? d.name.split(' ')[1] : '');
            const driverTeam = d.Constructors && d.Constructors.length > 0 ? d.Constructors[0].name : (d.team || 'Loading');
            const driverNat = d.nationality || d.code || 'F1';
            const driverPhoto = d.image || 'https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/fallback.png';
            const wins = d.wins || '0';
            
            const tColor = teamColors[driverTeam] || 'var(--clr-surface)';
            const bColor = tColor !== 'var(--clr-surface)' ? tColor.replace(/0\.15|0\.1/, '0.9') : 'var(--clr-red)';
            
            html += `
                <div class="driver-card" style="background: #181824; border: 1px solid #2a2a35; border-top: 4px solid ${bColor}; border-radius: 12px; padding: 2rem; transition: transform 0.3s ease, box-shadow 0.3s ease; position: relative; z-index: 1;">
                    <div style="position: absolute; top: 1rem; right: 1.5rem; font-size: 3.5rem; font-family: var(--font-heading); color: rgba(255,255,255,0.05); font-weight: 900; line-height: 1; z-index: 1;">${d.number || d.position}</div>
                    
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; position: relative; z-index: 2;">
                        <img src="${driverPhoto}" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='https://media.formula1.com/d_driver_fallback_image.png/content/dam/fom-website/drivers/fallback.png';" style="width: 55px; height: 55px; border-radius: 50%; object-fit: cover; border: 2px solid ${bColor}; background: #111;">
                        <div>
                            <h2 style="font-family: var(--font-heading); font-size: 1.6rem; color: #ffffff; text-transform: uppercase; line-height: 1.1; margin: 0; text-shadow: 0 1px 3px rgba(0,0,0,0.5);">
                                ${firstName} <span style="font-weight: 900; color: #ffffff;">${lastName}</span>
                            </h2>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 1.5rem; position: relative; z-index: 2; text-align: left;">
                        <h3 style="color: ${bColor}; font-size: 1.1rem; text-transform: uppercase; font-weight: 900; margin-bottom: 0.5rem; letter-spacing: 1px;">${driverTeam}</h3>
                        <p style="color: #ffffff; font-size: 0.85rem; text-transform: uppercase; font-weight: 700; background: #2a2a35; display: inline-block; padding: 3px 10px; border-radius: 4px; letter-spacing: 1px;">${driverNat}</p>
                    </div>
                    
                    <div style="display: flex; gap: 3rem; border-top: 1px solid #333344; padding-top: 1.5rem; position: relative; z-index: 2; text-align: left;">
                        <div>
                            <p style="font-size: 0.8rem; color: #a0a0b5; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 0.3rem; font-weight: 800;">Points</p>
                            <p style="font-size: 2.2rem; font-family: var(--font-heading); font-weight: 900; color: #ffffff; line-height: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${d.points}</p>
                        </div>
                        <div style="border-left: 1px solid #333344; padding-left: 3rem;">
                            <p style="font-size: 0.8rem; color: #a0a0b5; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 0.3rem; font-weight: 800;">Wins</p>
                            <p style="font-size: 2.2rem; font-family: var(--font-heading); font-weight: 900; color: #ffffff; line-height: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${wins}</p>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `</div></div>`;
        this.appContent.innerHTML = html;
        
        gsap.from('.standings-table tr', {
            y: 20, opacity: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out'
        });
        gsap.from('.driver-card', {
            y: 30, opacity: 0, duration: 0.6, stagger: 0.05, ease: 'power2.out', delay: 0.2
        });
        
        // Setup Hover Animations for Grid
        document.querySelectorAll('.driver-card').forEach(card => {
            card.addEventListener('mouseenter', () => gsap.to(card, {y: -10, borderColor: 'var(--clr-red)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', duration: 0.3}));
            card.addEventListener('mouseleave', () => gsap.to(card, {y: 0, borderColor: 'rgba(255,255,255,0.05)', boxShadow: 'none', duration: 0.3}));
        });
    }

    async renderTeams() {
        this.appContent.innerHTML = `<div class="container"><h1 class="section-title">Loading <span>Constructors...</span></h1></div>`;
        const teams = await getConstructorStandings();
        
        let html = `
            <div class="container">
                <h1 class="section-title">CONSTRUCTOR <span>STANDINGS</span></h1>
                
                <table class="standings-table">
                    <thead>
                        <tr>
                            <th>Pos</th>
                            <th>Team</th>
                            <th>Points</th>
                            <th>Wins</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        const teamColors = {
            "Red Bull": "rgba(54, 113, 198, 0.15)",
            "Ferrari": "rgba(232, 0, 32, 0.15)",
            "Mercedes": "rgba(39, 244, 210, 0.15)",
            "McLaren": "rgba(255, 128, 0, 0.1)",
            "Aston Martin": "rgba(34, 89, 78, 0.15)",
            "Alpine F1 Team": "rgba(0, 144, 255, 0.15)",
            "Williams": "rgba(55, 190, 221, 0.15)",
            "RB": "rgba(102, 146, 255, 0.15)",
            "Sauber": "rgba(82, 226, 82, 0.15)",
            "Haas F1 Team": "rgba(255, 255, 255, 0.1)"
        };
        
        teams.forEach(t => {
            const tColor = teamColors[t.name] || 'var(--clr-surface)';
            const bColor = tColor !== 'var(--clr-surface)' ? tColor.replace(/0\.15|0\.1/, '0.9') : 'var(--clr-red)';
            
            html += `
                <tr class="standings-row" style="background: ${tColor}; transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease; border-radius: 12px; cursor: default;">
                    <td style="padding: 1rem 2rem; border-top-left-radius: 12px; border-bottom-left-radius: 12px; border-left: 5px solid ${bColor}; font-family: var(--font-heading); font-size: 2rem; color: var(--clr-white);">${t.position}</td>
                    <td style="padding: 1rem; font-weight: 900; font-size: 1.5rem; color: var(--clr-white); text-transform: uppercase;">${t.name}</td>
                    <td style="padding: 1rem; font-family: var(--font-heading); font-size: 2.2rem; color: var(--clr-white);">${t.points}</td>
                    <td style="padding: 1rem; border-top-right-radius: 12px; border-bottom-right-radius: 12px; font-weight: bold; font-size: 1.5rem; color: var(--clr-text-muted);">${t.wins}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
                
                <h2 class="section-title" style="font-size: 2rem; margin-top: 4rem;">THE <span>GARAGES</span></h2>
                <div class="driver-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 2.5rem;">
        `;
        
        teams.forEach(t => {
            const engine = t.engine || 'Unknown';
            const tColor = teamColors[t.name] || 'var(--clr-surface)';
            const bColor = tColor !== 'var(--clr-surface)' ? tColor.replace(/0\.15|0\.1/, '0.9') : 'var(--clr-red)';
            
            html += `
                <div class="driver-card" style="background: #181824; border: 1px solid #2a2a35; border-top: 4px solid ${bColor}; border-radius: 12px; padding: 2rem; transition: transform 0.3s ease, box-shadow 0.3s ease; position: relative; z-index: 1;">
                    <div style="position: absolute; top: 1rem; right: 1.5rem; font-size: 4rem; font-family: var(--font-heading); color: rgba(255,255,255,0.05); font-weight: 900; line-height: 1; z-index: 1;">${t.position}</div>
                    
                    <div style="position: relative; z-index: 2; text-align: center;">
                        <div style="height: 160px; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem;">
                            <img src="${t.image}" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='https://images.unsplash.com/photo-1532938911079-1b06ac7ce122?auto=format&fit=crop&q=80&w=1200';" style="max-width: 100%; max-height: 100%; object-fit: contain; filter: drop-shadow(0 10px 10px rgba(0,0,0,0.5));">
                        </div>
                        
                        <h2 style="font-family: var(--font-heading); font-size: 2rem; color: #ffffff; text-transform: uppercase; margin-bottom: 0.5rem; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">
                            ${t.name}
                        </h2>
                        
                        <p style="color: #a0a0b5; font-size: 0.9rem; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; background: #2a2a35; display: inline-block; padding: 4px 12px; border-radius: 4px; margin-bottom: 1.5rem;">POWERED BY ${engine}</p>
                        
                        <div style="display: flex; justify-content: center; gap: 3rem; border-top: 1px solid #333344; padding-top: 1.5rem;">
                            <div style="text-align: center;">
                                <p style="font-size: 0.8rem; color: #a0a0b5; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 0.2rem; font-weight: 700;">Points</p>
                                <p style="font-size: 2.2rem; font-family: var(--font-heading); font-weight: 900; color: #ffffff; line-height: 1;">${t.points}</p>
                            </div>
                            <div style="text-align: center;">
                                <p style="font-size: 0.8rem; color: #a0a0b5; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 0.2rem; font-weight: 700;">Wins</p>
                                <p style="font-size: 2.2rem; font-family: var(--font-heading); font-weight: 900; color: #ffffff; line-height: 1;">${t.wins}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `</div></div>`;
        this.appContent.innerHTML = html;
        
        gsap.from('.standings-table tr', {
            y: 20, opacity: 0, duration: 0.4, stagger: 0.05, ease: 'power2.out'
        });
        gsap.from('.driver-card', {
            y: 30, opacity: 0, duration: 0.6, stagger: 0.05, ease: 'power2.out', delay: 0.2
        });
        
        document.querySelectorAll('.driver-card').forEach(card => {
            card.addEventListener('mouseenter', () => gsap.to(card, {y: -10, borderColor: 'var(--clr-red)', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', duration: 0.3}));
            card.addEventListener('mouseleave', () => gsap.to(card, {y: 0, borderColor: 'rgba(255,255,255,0.05)', boxShadow: 'none', duration: 0.3}));
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.f1App = new App();
});
