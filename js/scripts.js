// Theme Logic
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const icon = document.querySelector('#theme-toggle i');
    if (icon) {
        icon.className = theme === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
}

function calculateDynamicStats() {
    const today = new Date();
    
    // 1. Calculate Age (Born 1999-02-15)
    const birthDate = new Date(1999, 1, 15);
    let targetAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        targetAge--;
    }

    // 2. Calculate Experience (Started 2021)
    const startDate = new Date(2021, 0, 1);
    let expYears = today.getFullYear() - startDate.getFullYear();
    if (today.getMonth() < startDate.getMonth()) {
        expYears--;
    }
    
    // 3. Update dictionaries
    if (typeof languative !== 'undefined' && languative.dictionaries) {
        Object.keys(languative.dictionaries).forEach(lang => {
            const dict = languative.dictionaries[lang];
            if (dict.aboutMe_main && Array.isArray(dict.aboutMe_main)) {
                dict.aboutMe_main[1] = targetAge.toString();
                dict.aboutMe_main[3] = expYears >= 5 ? expYears.toString() + "+" : expYears.toString();
            }
        });
    }

    const isAnimated = sessionStorage.getItem('statsAnimated');

    // 4. Render
    const aboutText = document.getElementById('about-main-text');
    if (aboutText && typeof languative !== 'undefined') {
        const phrase = languative.getPhrase('aboutMe_main');
        if (Array.isArray(phrase) && phrase.length >= 5) {
            aboutText.innerHTML = phrase[0] + 
                                 `<span id="my-age">${isAnimated ? targetAge : '0'}</span>` + 
                                 phrase[2] + 
                                 `<span id="my-exp" class="text-accent">${isAnimated ? expYears + '+' : '0'}</span>` + 
                                 phrase[4];
            // Trigger local fade-in
            aboutText.classList.remove('fade-in-text');
            void aboutText.offsetWidth; 
            aboutText.classList.add('fade-in-text');
        }
    }

    const ageElement = document.getElementById('my-age');
    const expElement = document.getElementById('my-exp');
    if (!ageElement || !expElement) return;

    if (isAnimated) {
        ageElement.textContent = targetAge;
        expElement.textContent = expYears + "+";
    } else {
        const startAnimations = () => {
            // Animate Age
            let currentAge = 0;
            const animateAge = () => {
                currentAge++;
                ageElement.textContent = currentAge;
                if (currentAge < targetAge) {
                    let delay = 30;
                    if (currentAge >= targetAge - 2) delay = 250;
                    setTimeout(animateAge, delay);
                }
            };
            animateAge();

            // Animate Experience
            let currentExp = 0;
            const animateExp = () => {
                if (expYears <= 0) {
                    expElement.textContent = "0+";
                    return;
                }
                currentExp++;
                if (currentExp < expYears) {
                    expElement.textContent = currentExp;
                    setTimeout(animateExp, 150);
                } else {
                    expElement.textContent = expYears + "+";
                    sessionStorage.setItem('statsAnimated', '1');
                }
            };
            setTimeout(animateExp, 200);
        };

        // Use IntersectionObserver to trigger only when visible
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                startAnimations();
                observer.disconnect(); // Run only once
            }
        }, { threshold: 0.2 });

        observer.observe(aboutText);
    }
}

(function() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
})();

document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme Switcher
    const themeToggle = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme') || 'dark';
    setTheme(currentTheme);

    if (themeToggle) {
        themeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const theme = document.documentElement.getAttribute('data-theme');
            setTheme(theme === 'dark' ? 'light' : 'dark');
        });
    }

    // 2. Navigation
    const navLinks = document.querySelectorAll('.nav-links a');
    const path = window.location.pathname;
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
            const cleanHref = href.replace('.php', '').replace('.html', '').replace(/\/$/, '');
            const cleanPath = path.replace('.php', '').replace('.html', '').replace(/\/$/, '');
            
            if (cleanHref && (cleanPath === cleanHref || cleanPath.endsWith(cleanHref))) {
                link.classList.add('active');
            }
        }
    });

    // 3. Mobile Menu
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinksContainer = document.querySelector('.nav-links');
    if (mobileMenuBtn && navLinksContainer) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            navLinksContainer.classList.toggle('show');
            mobileMenuBtn.classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (!navLinksContainer.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                navLinksContainer.classList.remove('show');
                mobileMenuBtn.classList.remove('active');
            }
        });
    }

    // 4. Interactive Background
    if (!('ontouchstart' in window)) {
        const bg = document.createElement('div');
        bg.className = 'interactive-bg';
        document.body.appendChild(bg);
        window.addEventListener('mousemove', (e) => {
            requestAnimationFrame(() => {
                document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
                document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
            });
        });
    }

    // 5. Stats
    setTimeout(calculateDynamicStats, 50);

    // 6. Typewriter
    const nameElement = document.getElementById('typewriter-name');
    const subtitleElement = document.querySelector('.hero-subtitle');
    let subTimer = null;
    let nameTimer = null;
    
    function typeSubtitle() {
        if (!subtitleElement) return;
        if (subTimer) clearInterval(subTimer);
        const subText = (typeof languative !== 'undefined' && languative.getPhrase)
            ? languative.getPhrase('hero_subtitle')
            : 'Backend engineer specializing in AI implementation, NLP, and high-performance systems with Python and Golang.';
        
        subtitleElement.style.opacity = '1';
        subtitleElement.style.visibility = 'visible';
        let subIndex = 0;
        subTimer = setInterval(() => {
            if (subIndex <= subText.length) {
                const typed = subText.slice(0, subIndex);
                const remaining = subText.slice(subIndex);
                // Ghost text with cursor following the typed part
                subtitleElement.innerHTML = `${typed}${subIndex < subText.length ? '<span class="typewriter-cursor">|</span>' : ''}<span style="visibility:hidden">${remaining}</span>`;
                subIndex++;
            } else {
                clearInterval(subTimer);
                subTimer = null;
                subtitleElement.innerHTML = subText;
            }
        }, 20);
    }

    function startTypewriter() {
        if (!nameElement || !subtitleElement) return;
        if (nameTimer) clearInterval(nameTimer);

        const nameText = (typeof languative !== 'undefined' && languative.getPhrase) 
            ? languative.getPhrase('myname') 
            : 'Velikhanov Teymur';
        
        const displayName = (!nameText || nameText === 'myname') ? 'Velikhanov Teymur' : nameText;
        const nameParts = displayName.split(' ');
        const lastName = nameParts[nameParts.length - 1];
        const firstName = nameParts.slice(0, -1).join(' ');
        const nameFullHTML = `${firstName}<br><span class="text-accent">${lastName}</span>`;

        if (sessionStorage.getItem('boot')) {
            nameElement.innerHTML = nameFullHTML;
            typeSubtitle();
        } else {
            subtitleElement.style.opacity = '0';
            subtitleElement.style.visibility = 'hidden';
            let charIndex = 0;
            nameTimer = setInterval(() => {
                if (charIndex <= displayName.length) {
                    let typedHTML = '';
                    const spaceIndex = displayName.lastIndexOf(' ');
                    
                    if (charIndex <= spaceIndex) {
                        const typed = displayName.slice(0, charIndex);
                        const remainingFirst = displayName.slice(charIndex, spaceIndex);
                        // Cursor placed BEFORE the hidden ghost text
                        typedHTML = `${typed}<span class="typewriter-cursor"></span><span style="visibility:hidden">${remainingFirst}</span><br><span class="text-accent" style="visibility:hidden">${lastName}</span>`;
                    } else {
                        const typedLast = displayName.slice(spaceIndex + 1, charIndex);
                        const remainingLast = displayName.slice(charIndex);
                        // Cursor placed BEFORE the hidden ghost text
                        typedHTML = `${firstName}<br><span class="text-accent">${typedLast}<span class="typewriter-cursor">|</span><span style="visibility:hidden">${remainingLast}</span></span>`;
                    }
                    
                    nameElement.innerHTML = typedHTML;
                    charIndex++;
                } else {
                    clearInterval(nameTimer);
                    nameTimer = null;
                    nameElement.innerHTML = nameFullHTML;
                    sessionStorage.setItem('boot', '1');
                    typeSubtitle();
                }
            }, 70);
        }
    }

    setTimeout(() => { if (nameElement) startTypewriter(); }, 150);

    // 7. Lang change
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const lang = btn.getAttribute('data-lang');
            if (lang && typeof languative !== 'undefined') {
                languative.changeLanguage(lang);
                localStorage.setItem('lang', lang);
                document.documentElement.setAttribute('lang', lang);

                // 1. Update Name Translation
                if (nameElement) {
                    const newName = languative.getPhrase('myname');
                    const parts = newName.split(' ');
                    nameElement.innerHTML = `${parts.slice(0, -1).join(' ')}<br><span class="text-accent">${parts[parts.length - 1]}</span>`;
                }

                // 2. Animate all translated blocks
                document.querySelectorAll('[data-phrase-id], #about-main-text, #typewriter-name').forEach(el => {
                    el.classList.remove('fade-in-text');
                    void el.offsetWidth; // Trigger reflow
                    el.classList.add('fade-in-text');
                });

                typeSubtitle();
                calculateDynamicStats();
            }
        });
    });

    // 8. Apply saved language on load
    const savedLang = localStorage.getItem('lang');
    if (savedLang && typeof languative !== 'undefined') {
        languative.changeLanguage(savedLang);
        document.documentElement.setAttribute('lang', savedLang);
    }
    });