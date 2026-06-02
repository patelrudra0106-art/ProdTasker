/* onboarding.js - S1N Adaptive Intro System (Assets Folder Update) */

const ONBOARDING_SLIDES = [
    {
        title: "Protocol System",
        desc: "Build your routine. Execute protocols and track adherence.",
        imgDark: "assets/122393.jpg",  // UPDATED PATH
        imgLight: "assets/122395.jpg" // UPDATED PATH
    },
    {
        title: "Focus Engine",
        desc: "Enter deep work states with the timer and audio environments.",
        imgDark: "assets/122399.jpg",
        imgLight: "assets/122397.jpg"
    },
    {
        title: "System Analytics",
        desc: "Visualize efficiency. Track focus time and completion rates.",
        imgDark: "assets/122401.jpg",
        imgLight: "assets/122405.jpg"
    },
    {
        title: "Global Network",
        desc: "Compete on the leaderboard. Compare streaks with other agents.",
        imgDark: "assets/122409.jpg",
        imgLight: "assets/122407.jpg"
    },
    {
        title: "Market Economy",
        desc: "Earn Credits. Purchase status badges and streak repairs.",
        imgDark: "assets/122411.jpg",
        imgLight: "assets/122413.jpg"
    }
];

let currentSlideIndex = 0;

window.startOnboarding = function() {
    const modal = document.getElementById('onboarding-modal');
    if(modal) {
        modal.classList.remove('hidden');
        currentSlideIndex = 0;
        renderSlide();
    }
};

window.goToSlide = function(index) {
    currentSlideIndex = index;
    renderSlide();
};

window.nextSlide = function() {
    if (currentSlideIndex < ONBOARDING_SLIDES.length - 1) {
        currentSlideIndex++;
        renderSlide();
    } else {
        finishOnboarding();
    }
};

window.finishOnboarding = function() {
    const modal = document.getElementById('onboarding-modal');
    if(modal) {
        modal.classList.add('hidden');
        if(window.confetti) {
            confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 }, colors: ['#ffffff', '#000000'] });
        }
    }
};

function renderSlide() {
    const content = document.getElementById('onboarding-content');
    const dotsContainer = document.getElementById('onboarding-dots');
    const btn = document.getElementById('onboarding-btn');
    
    if(!content || !dotsContainer) return;

    const slide = ONBOARDING_SLIDES[currentSlideIndex];
    const isLast = currentSlideIndex === ONBOARDING_SLIDES.length - 1;
    
    const isDark = document.documentElement.classList.contains('dark');
    const imgSrc = isDark ? slide.imgDark : slide.imgLight;

    // RENDER CONTENT
    content.innerHTML = `
        <div class="flex flex-col items-center justify-center w-full h-full animate-fade-in select-none pt-4">
            
            <div class="relative shrink-0 w-56 h-96 md:w-64 md:h-[28rem] mb-6 rounded-[2rem] border-[6px] border-border bg-card overflow-hidden shadow-2xl">
                <img src="${imgSrc}" 
                     class="absolute inset-0 w-full h-full object-cover" 
                     alt="${slide.title}"
                     onerror="console.log('Image failed:', this.src)">
            </div>

            <div class="px-6 text-center">
                <h2 class="text-2xl font-extrabold uppercase tracking-tight mb-2 leading-none text-main">
                    <span class="animate-title inline-block">${slide.title}</span>
                </h2>
                <p class="text-[10px] text-muted font-bold uppercase tracking-widest leading-relaxed max-w-xs mx-auto">
                    <span class="animate-title stagger-1 inline-block">${slide.desc}</span>
                </p>
            </div>
        </div>
    `;

    // RENDER DOTS
    dotsContainer.innerHTML = ONBOARDING_SLIDES.map((_, idx) => `
        <button onclick="goToSlide(${idx})" class="h-1.5 rounded-full transition-all duration-300 ${idx === currentSlideIndex ? 'bg-main w-8' : 'bg-border w-2 hover:bg-muted'}"></button>
    `).join('');

    // UPDATE BUTTON
    if(btn) {
        btn.innerHTML = isLast ? 'Initialize System' : 'Next Step';
        if(isLast) btn.classList.add('bg-main', 'text-body');
        else btn.classList.remove('animate-pulse');
    }

    if(window.lucide) lucide.createIcons();
}
