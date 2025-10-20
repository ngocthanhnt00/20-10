// Mobile optimizations
function initMobileOptimizations() {
    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Optimize touch events
    document.addEventListener('touchstart', function(e) {
        // Add haptic feedback for supported devices
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
    });
    
    // Prevent pull-to-refresh on mobile
    document.addEventListener('touchmove', function(e) {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Optimize scroll performance
    let ticking = false;
    function updateScrollIndicator() {
        const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        const indicator = document.querySelector('.scroll-indicator');
        if (indicator) {
            indicator.style.transform = `scaleX(${scrollPercent / 100})`;
        }
        ticking = false;
    }
    
    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(updateScrollIndicator);
            ticking = true;
        }
    });
    
    // Mobile-specific animations
    if (window.innerWidth <= 768) {
        // Reduce animation complexity on mobile
        document.documentElement.style.setProperty('--animation-duration', '0.3s');
        
        // Optimize particle effects
        const originalCreateParticle = window.createParticle;
        window.createParticle = function() {
            // Reduce particle count on mobile
            if (Math.random() < 0.5) {
                originalCreateParticle();
            }
        };
    }
}

// Music Player
function initMusicPlayer() {
    const playBtn = document.getElementById('playBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    const audio = document.getElementById('backgroundMusic');
    
    // YouTube Player variables
    let player;
    let isPlaying = false;
    let isYouTubeLoaded = false;
    
    // Make player globally accessible
    window.player = null;
    
    // Load YouTube API
    function loadYouTubeAPI() {
        // Show loading indicator
        const loadingIndicator = document.getElementById('musicLoading');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }
        
        if (window.YT && window.YT.Player) {
            initYouTubePlayer();
            return;
        }
        
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        
        // This will be handled by the global function below
    }
    
    function initYouTubePlayer() {
        player = new YT.Player('youtubePlayer', {
            height: '0',
            width: '0',
            videoId: 'Trjrj_fQnIM', // Extract from your YouTube URL
            playerVars: {
                'autoplay': 0,
                'controls': 0,
                'disablekb': 1,
                'enablejsapi': 1,
                'fs': 0,
                'iv_load_policy': 3,
                'modestbranding': 1,
                'playsinline': 1,
                'rel': 0,
                'showinfo': 0
            },
            events: {
                'onReady': function(event) {
                    isYouTubeLoaded = true;
                    window.player = player; // Make globally accessible
                    console.log('YouTube player ready');
                    
                    // Hide loading indicator
                    const loadingIndicator = document.getElementById('musicLoading');
                    if (loadingIndicator) {
                        loadingIndicator.style.display = 'none';
                    }
                },
                'onStateChange': function(event) {
                    if (event.data === YT.PlayerState.PLAYING) {
                        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                        playBtn.classList.add('playing');
                        createMusicVisualizer();
                    } else if (event.data === YT.PlayerState.PAUSED) {
                        playBtn.innerHTML = '<i class="fas fa-play"></i>';
                        playBtn.classList.remove('playing');
                    }
                }
            }
        });
    }
    
    // Fallback tone generator
    let audioContext;
    let oscillator;
    
    function createTone() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Beautiful in White melody notes (simplified)
        const melody = [
            { freq: 523.25, time: 0 },    // C5
            { freq: 587.33, time: 0.5 },  // D5
            { freq: 659.25, time: 1 },    // E5
            { freq: 523.25, time: 1.5 },  // C5
            { freq: 440, time: 2 },       // A4
            { freq: 392, time: 2.5 },     // G4
            { freq: 440, time: 3 },       // A4
            { freq: 523.25, time: 3.5 },  // C5
            { freq: 587.33, time: 4 },    // D5
            { freq: 659.25, time: 4.5 },  // E5
            { freq: 698.46, time: 5 },    // F5
            { freq: 659.25, time: 5.5 },  // E5
            { freq: 523.25, time: 6 },    // C5
            { freq: 440, time: 6.5 },     // A4
            { freq: 392, time: 7 },       // G4
            { freq: 440, time: 7.5 }      // A4
        ];
        
        let currentNote = 0;
        
        function playNextNote() {
            if (currentNote >= melody.length) {
                currentNote = 0; // Loop the melody
            }
            
            const note = melody[currentNote];
            
            oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(note.freq, audioContext.currentTime);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
            
            currentNote++;
            
            if (isPlaying) {
                setTimeout(playNextNote, note.time * 1000);
            }
        }
        
        isPlaying = true;
        playNextNote();
    }
    
    function stopTone() {
        isPlaying = false;
        if (oscillator) {
            oscillator.stop();
        }
    }
    
    playBtn.addEventListener('click', function() {
        if (!isPlaying) {
            // Try YouTube first, fallback to tone generator
            if (isYouTubeLoaded && player) {
                player.playVideo();
            } else {
                createTone();
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
                playBtn.classList.add('playing');
                createMusicVisualizer();
            }
        } else {
            if (isYouTubeLoaded && player) {
                player.pauseVideo();
            } else {
                stopTone();
                playBtn.innerHTML = '<i class="fas fa-play"></i>';
                playBtn.classList.remove('playing');
            }
        }
    });
    
    volumeSlider.addEventListener('input', function() {
        const volume = this.value;
        if (isYouTubeLoaded && player) {
            player.setVolume(volume);
        } else if (oscillator && audioContext) {
            const gainNode = audioContext.createGain();
            gainNode.gain.setValueAtTime(volume / 1000, audioContext.currentTime);
        }
    });
    
    // Load YouTube API when page loads
    loadYouTubeAPI();
    
    // Auto-play with user interaction
    let hasUserInteracted = false;
    
    function tryAutoPlay() {
        if (!hasUserInteracted) return;
        
        if (isYouTubeLoaded && player) {
            player.playVideo();
        } else {
            createTone();
            playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            playBtn.classList.add('playing');
            createMusicVisualizer();
        }
    }
    
    // Listen for any user interaction
    document.addEventListener('click', function() {
        hasUserInteracted = true;
        tryAutoPlay();
    }, { once: true });
    
    document.addEventListener('keydown', function() {
        hasUserInteracted = true;
        tryAutoPlay();
    }, { once: true });
    
    document.addEventListener('touchstart', function() {
        hasUserInteracted = true;
        tryAutoPlay();
    }, { once: true });
    
    // Try autoplay when YouTube is ready
    window.onYouTubeIframeAPIReady = function() {
        initYouTubePlayer();
        // Try autoplay after a short delay
        setTimeout(() => {
            if (hasUserInteracted) {
                tryAutoPlay();
            }
        }, 1000);
    };
    
    // Fallback: Start tone generator if YouTube fails to load
    setTimeout(() => {
        if (!isYouTubeLoaded && !isPlaying) {
            console.log('YouTube failed to load, starting fallback music');
            hasUserInteracted = true;
            tryAutoPlay();
        }
    }, 5000);
}

// Magic Button
function initMagicButton() {
    const magicBtn = document.getElementById('magicBtn');
    
    magicBtn.addEventListener('click', function() {
        createMagicEffect();
        createFloatingPetals();
        createRomanticFireworks();
        createSuperHeartStorm();
    });
}

// Floating Petals
function initFloatingPetals() {
    setInterval(createFloatingPetals, 3000);
}

function createFloatingPetals() {
    const petalCount = 15;
    const petalsContainer = document.querySelector('.floating-petals');
    
    for (let i = 0; i < petalCount; i++) {
        setTimeout(() => {
            const petal = document.createElement('div');
            petal.className = 'petal';
            
            petal.style.left = Math.random() * 100 + '%';
            petal.style.animationDelay = Math.random() * 2 + 's';
            petal.style.animationDuration = (Math.random() * 3 + 5) + 's';
            
            petalsContainer.appendChild(petal);
            
            setTimeout(() => {
                if (petal.parentNode) {
                    petal.parentNode.removeChild(petal);
                }
            }, 8000);
        }, i * 100);
    }
}

// Enhanced Love Button Interaction
function initLoveButton() {
    const loveBtn = document.getElementById('loveBtn');
    const floatingHearts = document.getElementById('floatingHearts');
    let clickCount = 0;
    let lastClickTime = 0;
    
    // Add enhanced class
    loveBtn.className = 'love-button-enhanced';
    
    loveBtn.addEventListener('click', function(e) {
        const currentTime = Date.now();
        clickCount++;
        
        // Enhanced click animation with ripple effect
        createButtonRipple(this, e);
        
        // Create enhanced floating hearts
        createEnhancedFloatingHearts(floatingHearts);
        
        // Show enhanced love message
        showEnhancedLoveMessage();
        
        // Special effects based on click patterns
        if (clickCount === 3) {
            createHeartbeatEffect();
            clickCount = 0;
        } else if (clickCount === 5) {
            createFloatingLoveLetters();
            clickCount = 0;
        } else if (clickCount === 7) {
            createRomanticFireworks();
            clickCount = 0;
        }
        
        // Rapid click detection
        if (currentTime - lastClickTime < 300) {
            createRapidClickEffect();
        }
        lastClickTime = currentTime;
        
        // Add pulsing effect
        this.style.animation = 'none';
        setTimeout(() => {
            this.style.animation = 'gradientShiftEnhanced 4s ease infinite';
        }, 100);
        
        // Add haptic feedback for mobile
        if (navigator.vibrate) {
            navigator.vibrate([50, 30, 50]);
        }
    });
    
    // Add hover effects
    loveBtn.addEventListener('mouseenter', function() {
        createHoverSparkles(this);
    });
}

// Enhanced floating hearts animation
function createEnhancedFloatingHearts(container) {
    const heartCount = 20;
    const heartEmojis = ['💖', '💕', '💗', '💝', '💘', '💓', '💞'];
    
    for (let i = 0; i < heartCount; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.className = 'floating-heart-enhanced';
            
            // Random position with better distribution
            const startX = Math.random() * 80 + 10; // 10% to 90%
            const startY = Math.random() * 40 + 60; // 60% to 100%
            
            heart.style.left = startX + '%';
            heart.style.top = startY + '%';
            
            // Random size with more variation
            const size = Math.random() * 15 + 20; // 20px to 35px
            heart.style.width = size + 'px';
            heart.style.height = size + 'px';
            
            // Add emoji overlay
            const emoji = document.createElement('div');
            emoji.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
            emoji.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.6);
                font-size: 0.8em;
                z-index: 1;
            `;
            heart.appendChild(emoji);
            
            container.appendChild(heart);
            
            // Remove heart after animation
            setTimeout(() => {
                if (heart.parentNode) {
                    heart.parentNode.removeChild(heart);
                }
            }, 4000);
        }, i * 80);
    }
}

// Create floating hearts animation (legacy)
function createFloatingHearts(container) {
    const heartCount = 15;
    
    for (let i = 0; i < heartCount; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.className = 'floating-heart';
            
            // Random position
            const startX = Math.random() * 100;
            const startY = Math.random() * 50 + 50;
            
            heart.style.left = startX + '%';
            heart.style.top = startY + '%';
            
            // Random size
            const size = Math.random() * 10 + 15;
            heart.style.width = size + 'px';
            heart.style.height = size + 'px';
            
            // Random color with pink theme
            const colors = ['#ff69b4', '#ff1493', '#ffc0cb', '#ffb6c1', '#ff91a4'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            heart.style.background = color;
            
            container.appendChild(heart);
            
            // Remove heart after animation
            setTimeout(() => {
                if (heart.parentNode) {
                    heart.parentNode.removeChild(heart);
                }
            }, 3000);
        }, i * 100);
    }
}

// Show love message
function showLoveMessage() {
    const messages = [
        "Anh yêu em! 💕",
        "Em là tất cả của anh! 🌟",
        "Cảm ơn em vì đã ở bên anh! 💖",
        "Em làm cuộc sống anh đẹp hơn! ✨",
        "Chúc em ngày 20/10 thật hạnh phúc! 🎉"
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 255, 255, 0.95);
        color: #333;
        padding: 20px 30px;
        border-radius: 15px;
        font-size: 1.2rem;
        font-weight: 500;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        animation: messagePop 2s ease-out forwards;
    `;
    messageEl.textContent = randomMessage;
    
    // Add animation keyframes
    if (!document.getElementById('messageAnimation')) {
        const style = document.createElement('style');
        style.id = 'messageAnimation';
        style.textContent = `
            @keyframes messagePop {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(messageEl);
    
    // Remove message after animation
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl);
        }
    }, 2000);
}

// Enhanced Wish Cards Interaction
function initWishCards() {
    const wishCards = document.querySelectorAll('.wish-card');
    
    wishCards.forEach(card => {
        // Add enhanced class
        card.className = 'wish-card-enhanced';
        
        card.addEventListener('mouseenter', function() {
            // Add enhanced sparkle effect
            createEnhancedSparkleEffect(this);
        });
        
        card.addEventListener('click', function() {
            // Add enhanced click ripple effect
            createEnhancedRippleEffect(this);
            
            // Add special message for each card
            const cardIndex = Array.from(wishCards).indexOf(this);
            showCardSpecificMessage(cardIndex);
        });
        
        // Add touch support for mobile
        card.addEventListener('touchstart', function(e) {
            e.preventDefault();
            createEnhancedSparkleEffect(this);
        });
    });
}

function createEnhancedSparkleEffect(element) {
    const sparkleCount = 12;
    const sparkles = ['✨', '⭐', '💫', '🌟', '✨'];
    
    for (let i = 0; i < sparkleCount; i++) {
        setTimeout(() => {
            const sparkle = document.createElement('div');
            sparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
            sparkle.className = 'sparkle-enhanced';
            
            const rect = element.getBoundingClientRect();
            sparkle.style.left = (rect.left + Math.random() * rect.width) + 'px';
            sparkle.style.top = (rect.top + Math.random() * rect.height) + 'px';
            
            element.style.position = 'relative';
            element.appendChild(sparkle);
            
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.parentNode.removeChild(sparkle);
                }
            }, 2500);
        }, i * 30);
    }
}

function createEnhancedRippleEffect(element) {
    const ripple = document.createElement('div');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: radial-gradient(circle, rgba(255, 105, 180, 0.3), transparent);
        border-radius: 50%;
        transform: scale(0);
        animation: enhancedRipple 0.8s ease-out;
        pointer-events: none;
        top: 50%;
        left: 50%;
        margin-left: -${size/2}px;
        margin-top: -${size/2}px;
    `;
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 800);
    
    // Add enhanced ripple animation if not exists
    if (!document.getElementById('enhancedRippleAnimation')) {
        const style = document.createElement('style');
        style.id = 'enhancedRippleAnimation';
        style.textContent = `
            @keyframes enhancedRipple {
                0% { transform: scale(0); opacity: 1; }
                50% { transform: scale(1); opacity: 0.6; }
                100% { transform: scale(2); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

function showCardSpecificMessage(cardIndex) {
    const messages = [
        "Chúc em luôn hạnh phúc và nở nụ cười! 😊",
        "Mong em đạt được mọi ước mơ! 🌟",
        "Chúc em luôn khỏe mạnh và tràn đầy năng lượng! 💪",
        "Em xứng đáng với mọi điều tốt đẹp nhất! 💖"
    ];
    
    const message = messages[cardIndex] || messages[0];
    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.className = 'message-popup-enhanced';
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl);
        }
    }, 3000);
}

// Create sparkle effect
function createSparkleEffect(element) {
    const sparkleCount = 8;
    
    for (let i = 0; i < sparkleCount; i++) {
        setTimeout(() => {
            const sparkle = document.createElement('div');
            sparkle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: #fff;
                border-radius: 50%;
                pointer-events: none;
                animation: sparkleAnimation 1s ease-out forwards;
            `;
            
            const rect = element.getBoundingClientRect();
            sparkle.style.left = (Math.random() * rect.width) + 'px';
            sparkle.style.top = (Math.random() * rect.height) + 'px';
            
            element.style.position = 'relative';
            element.appendChild(sparkle);
            
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.parentNode.removeChild(sparkle);
                }
            }, 1000);
        }, i * 50);
    }
    
    // Add sparkle animation if not exists
    if (!document.getElementById('sparkleAnimation')) {
        const style = document.createElement('style');
        style.id = 'sparkleAnimation';
        style.textContent = `
            @keyframes sparkleAnimation {
                0% { opacity: 0; transform: scale(0) rotate(0deg); }
                50% { opacity: 1; transform: scale(1) rotate(180deg); }
                100% { opacity: 0; transform: scale(0) rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Create ripple effect
function createRippleEffect(element) {
    const ripple = document.createElement('div');
    ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
    `;
    
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (rect.width / 2 - size / 2) + 'px';
    ripple.style.top = (rect.height / 2 - size / 2) + 'px';
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 600);
    
    // Add ripple animation if not exists
    if (!document.getElementById('rippleAnimation')) {
        const style = document.createElement('style');
        style.id = 'rippleAnimation';
        style.textContent = `
            @keyframes ripple {
                to { transform: scale(4); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Scroll Animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
            }
        });
    }, observerOptions);
    
    // Observe elements with animations
    const animatedElements = document.querySelectorAll('.message-card, .wish-card, .quote-section, .footer');
    animatedElements.forEach(el => {
        observer.observe(el);
    });
}

// Particle Effect
function initParticleEffect() {
    const container = document.querySelector('.container');
    
    // Create floating particles
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            createParticle(container);
        }, i * 200);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.style.cssText = `
        position: fixed;
        width: 4px;
        height: 4px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        pointer-events: none;
        animation: particleFloat 8s linear infinite;
        z-index: 0;
    `;
    
    particle.style.left = Math.random() * 100 + 'vw';
    particle.style.top = '100vh';
    
    container.appendChild(particle);
    
    // Add particle animation if not exists
    if (!document.getElementById('particleAnimation')) {
        const style = document.createElement('style');
        style.id = 'particleAnimation';
        style.textContent = `
            @keyframes particleFloat {
                0% { transform: translateY(0) rotate(0deg); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Remove particle after animation
    setTimeout(() => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
    }, 8000);
}

// Typing Effect for Poem
function initTypingEffect() {
    const poemLines = document.querySelectorAll('.poem-line');
    
    poemLines.forEach((line, index) => {
        const text = line.textContent;
        line.textContent = '';
        
        setTimeout(() => {
            typeText(line, text, 50);
        }, index * 200 + 1000);
    });
}

function typeText(element, text, speed) {
    let i = 0;
    const timer = setInterval(() => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(timer);
        }
    }, speed);
}

// Add keyboard interactions
document.addEventListener('keydown', function(e) {
    // Press 'L' for love message
    if (e.key.toLowerCase() === 'l') {
        const loveBtn = document.getElementById('loveBtn');
        loveBtn.click();
    }
    
    // Press 'H' for hearts
    if (e.key.toLowerCase() === 'h') {
        const floatingHearts = document.getElementById('floatingHearts');
        createFloatingHearts(floatingHearts);
    }
});

// Add touch interactions for mobile
let touchStartY = 0;
let touchEndY = 0;

document.addEventListener('touchstart', function(e) {
    touchStartY = e.changedTouches[0].screenY;
});

document.addEventListener('touchend', function(e) {
    touchEndY = e.changedTouches[0].screenY;
    handleSwipe();
});

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartY - touchEndY;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe up - show love message
            showLoveMessage();
        } else {
            // Swipe down - create hearts
            const floatingHearts = document.getElementById('floatingHearts');
            createFloatingHearts(floatingHearts);
        }
    }
}

// Add music note animation on special occasions
function createMusicNotes() {
    const notes = ['♪', '♫', '♬', '♭', '♮', '♯'];
    const container = document.querySelector('.container');
    
    for (let i = 0; i < 10; i++) {
        setTimeout(() => {
            const note = document.createElement('div');
            note.textContent = notes[Math.floor(Math.random() * notes.length)];
            note.style.cssText = `
                position: fixed;
                font-size: 2rem;
                color: rgba(255, 255, 255, 0.7);
                pointer-events: none;
                animation: musicNoteFloat 3s ease-out forwards;
                z-index: 1;
            `;
            
            note.style.left = Math.random() * 100 + 'vw';
            note.style.top = '100vh';
            
            container.appendChild(note);
            
            setTimeout(() => {
                if (note.parentNode) {
                    note.parentNode.removeChild(note);
                }
            }, 3000);
        }, i * 100);
    }
    
    // Add music note animation if not exists
    if (!document.getElementById('musicNoteAnimation')) {
        const style = document.createElement('style');
        style.id = 'musicNoteAnimation';
        style.textContent = `
            @keyframes musicNoteFloat {
                0% { transform: translateY(0) rotate(0deg); opacity: 0; }
                20% { opacity: 1; }
                80% { opacity: 1; }
                100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Special effect for double-click
let clickCount = 0;
let clickTimer = null;

document.addEventListener('click', function(e) {
    clickCount++;
    
    if (clickCount === 1) {
        clickTimer = setTimeout(() => {
            clickCount = 0;
        }, 300);
    } else if (clickCount === 2) {
        clearTimeout(clickTimer);
        clickCount = 0;
        
        // Double click effect - create music notes
        createMusicNotes();
    }
});

// Add a subtle parallax effect
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.background');
    
    parallaxElements.forEach(element => {
        const speed = 0.5;
        element.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// Initialize everything when page loads
window.addEventListener('load', function() {
    // Add a welcome message
    setTimeout(() => {
        showEnhancedLoveMessage();
    }, 2000);
    
    // Add scroll indicator
    initScrollIndicator();
    
    // Add loading animation
    showLoadingAnimation();
    
    // Auto-start music after page is fully loaded
    setTimeout(() => {
        autoStartMusic();
    }, 2000);
    
    // Additional fallback - try again after 5 seconds
    setTimeout(() => {
        const playBtn = document.getElementById('playBtn');
        if (playBtn && !playBtn.classList.contains('playing')) {
            console.log('Second attempt to start music...');
            playBtn.click();
        }
    }, 5000);
});

// Auto-start music function
function autoStartMusic() {
    const playBtn = document.getElementById('playBtn');
    if (playBtn && !playBtn.classList.contains('playing')) {
        // Force start music with fallback
        console.log('Auto-starting music...');
        
        // Try YouTube first
        if (window.player && window.player.playVideo) {
            try {
                window.player.playVideo();
                console.log('YouTube music started');
            } catch (e) {
                console.log('YouTube failed, using fallback');
                startFallbackMusic();
            }
        } else {
            console.log('YouTube not ready, using fallback');
            startFallbackMusic();
        }
    }
}

// Fallback music function
function startFallbackMusic() {
    const playBtn = document.getElementById('playBtn');
    if (playBtn) {
        playBtn.click();
    }
}

// Enhanced Love Message
function showEnhancedLoveMessage() {
    const messages = [
        "Anh yêu em vô cùng! 💕",
        "Em là tất cả của anh! 🌟",
        "Cảm ơn em vì đã ở bên anh! 💖",
        "Em làm cuộc sống anh đẹp hơn! ✨",
        "Chúc em ngày 20/10 thật hạnh phúc! 🎉",
        "Em là ánh sáng trong tim anh! 💫",
        "Mỗi ngày với em đều là một món quà! 🎁"
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    // Create enhanced message element
    const messageEl = document.createElement('div');
    messageEl.className = 'message-popup-enhanced';
    messageEl.textContent = randomMessage;
    
    document.body.appendChild(messageEl);
    
    // Remove message after animation
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl);
        }
    }, 3500);
}

// Show love message (legacy)
function showLoveMessage() {
    const messages = [
        "Anh yêu em! 💕",
        "Em là tất cả của anh! 🌟",
        "Cảm ơn em vì đã ở bên anh! 💖",
        "Em làm cuộc sống anh đẹp hơn! ✨",
        "Chúc em ngày 20/10 thật hạnh phúc! 🎉"
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 255, 255, 0.95);
        color: #333;
        padding: 20px 30px;
        border-radius: 15px;
        font-size: 1.2rem;
        font-weight: 500;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        animation: messagePop 2s ease-out forwards;
    `;
    messageEl.textContent = randomMessage;
    
    document.body.appendChild(messageEl);
    
    // Remove message after animation
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl);
        }
    }, 2000);
}

// New Enhanced Functions
function createHoverSparkles(element) {
    const sparkleCount = 8;
    
    for (let i = 0; i < sparkleCount; i++) {
        setTimeout(() => {
            const sparkle = document.createElement('div');
            sparkle.innerHTML = '✨';
            sparkle.className = 'sparkle-enhanced';
            
            const rect = element.getBoundingClientRect();
            sparkle.style.left = (rect.left + Math.random() * rect.width) + 'px';
            sparkle.style.top = (rect.top + Math.random() * rect.height) + 'px';
            
            document.body.appendChild(sparkle);
            
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.parentNode.removeChild(sparkle);
                }
            }, 2500);
        }, i * 50);
    }
}

function createSuperHeartStorm() {
    const stormCount = 50;
    const heartEmojis = ['💖', '💕', '💗', '💝', '💘', '💓', '💞', '💟'];
    
    for (let i = 0; i < stormCount; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
            heart.style.cssText = `
                position: fixed;
                font-size: 2rem;
                pointer-events: none;
                z-index: 1000;
                animation: superHeartStorm 3s ease-out forwards;
            `;
            
            heart.style.left = Math.random() * window.innerWidth + 'px';
            heart.style.top = '-50px';
            
            document.body.appendChild(heart);
            
            setTimeout(() => {
                if (heart.parentNode) {
                    heart.parentNode.removeChild(heart);
                }
            }, 3000);
        }, i * 30);
    }
    
    // Add super heart storm animation if not exists
    if (!document.getElementById('superHeartStormAnimation')) {
        const style = document.createElement('style');
        style.id = 'superHeartStormAnimation';
        style.textContent = `
            @keyframes superHeartStorm {
                0% { transform: translateY(0) rotate(0deg) scale(0.5); opacity: 1; }
                30% { transform: translateY(30vh) rotate(120deg) scale(1.2); opacity: 1; }
                60% { transform: translateY(60vh) rotate(240deg) scale(1); opacity: 0.8; }
                100% { transform: translateY(100vh) rotate(360deg) scale(0.3); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

function createRapidClickEffect() {
    // Create burst effect for rapid clicks
    const burstCount = 15;
    
    for (let i = 0; i < burstCount; i++) {
        setTimeout(() => {
            const burst = document.createElement('div');
            burst.innerHTML = '💥';
            burst.style.cssText = `
                position: fixed;
                font-size: 1.5rem;
                pointer-events: none;
                z-index: 1000;
                animation: rapidBurst 1s ease-out forwards;
            `;
            
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const angle = (i / burstCount) * Math.PI * 2;
            const distance = 100 + Math.random() * 50;
            
            burst.style.left = (centerX + Math.cos(angle) * distance) + 'px';
            burst.style.top = (centerY + Math.sin(angle) * distance) + 'px';
            
            document.body.appendChild(burst);
            
            setTimeout(() => {
                if (burst.parentNode) {
                    burst.parentNode.removeChild(burst);
                }
            }, 1000);
        }, i * 20);
    }
    
    // Add rapid burst animation if not exists
    if (!document.getElementById('rapidBurstAnimation')) {
        const style = document.createElement('style');
        style.id = 'rapidBurstAnimation';
        style.textContent = `
            @keyframes rapidBurst {
                0% { transform: scale(0) rotate(0deg); opacity: 1; }
                50% { transform: scale(1.5) rotate(180deg); opacity: 0.8; }
                100% { transform: scale(0) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

function initScrollIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'scroll-indicator';
    document.body.appendChild(indicator);
    
    window.addEventListener('scroll', function() {
        const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        indicator.style.transform = `scaleX(${scrollPercent / 100})`;
    });
}

function showLoadingAnimation() {
    const loadingContainer = document.createElement('div');
    loadingContainer.className = 'loading-hearts';
    loadingContainer.innerHTML = `
        <div class="loading-heart"></div>
        <div class="loading-heart"></div>
        <div class="loading-heart"></div>
    `;
    
    document.body.appendChild(loadingContainer);
    
    setTimeout(() => {
        if (loadingContainer.parentNode) {
            loadingContainer.parentNode.removeChild(loadingContainer);
        }
    }, 2000);
}

// Magic Effect
function createMagicEffect() {
    const magicCount = 30;
    const magicSymbols = ['✨', '⭐', '💫', '🌟', '✨', '🔮', '💎', '💫'];
    
    for (let i = 0; i < magicCount; i++) {
        setTimeout(() => {
            const magic = document.createElement('div');
            magic.textContent = magicSymbols[Math.floor(Math.random() * magicSymbols.length)];
            magic.style.cssText = `
                position: fixed;
                font-size: 2rem;
                pointer-events: none;
                z-index: 1000;
                animation: magicFloat 3s ease-out forwards;
            `;
            
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const angle = (i / magicCount) * Math.PI * 2;
            const distance = 150 + Math.random() * 100;
            
            magic.style.left = (centerX + Math.cos(angle) * distance) + 'px';
            magic.style.top = (centerY + Math.sin(angle) * distance) + 'px';
            
            document.body.appendChild(magic);
            
            setTimeout(() => {
                if (magic.parentNode) {
                    magic.parentNode.removeChild(magic);
                }
            }, 3000);
        }, i * 50);
    }
    
    // Add magic float animation if not exists
    if (!document.getElementById('magicFloatAnimation')) {
        const style = document.createElement('style');
        style.id = 'magicFloatAnimation';
        style.textContent = `
            @keyframes magicFloat {
                0% { transform: scale(0) rotate(0deg); opacity: 1; }
                30% { transform: scale(1.2) rotate(120deg); opacity: 1; }
                70% { transform: scale(1) rotate(240deg); opacity: 0.8; }
                100% { transform: scale(0.3) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Music Visualizer
function createMusicVisualizer() {
    const visualizer = document.createElement('div');
    visualizer.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 4px;
        z-index: 1000;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        padding: 10px 20px;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    for (let i = 0; i < 25; i++) {
        const bar = document.createElement('div');
        bar.style.cssText = `
            width: 3px;
            height: 15px;
            background: linear-gradient(to top, #ff69b4, #ff1493, #ffeaa7);
            border-radius: 2px;
            animation: musicBar ${0.3 + Math.random() * 0.4}s ease-in-out infinite;
            animation-delay: ${i * 0.05}s;
        `;
        visualizer.appendChild(bar);
    }
    
    document.body.appendChild(visualizer);
    
    // Add music bar animation if not exists
    if (!document.getElementById('musicBarAnimation')) {
        const style = document.createElement('style');
        style.id = 'musicBarAnimation';
        style.textContent = `
            @keyframes musicBar {
                0%, 100% { height: 15px; transform: scaleY(1); }
                25% { height: 25px; transform: scaleY(1.2); }
                50% { height: 35px; transform: scaleY(1.5); }
                75% { height: 20px; transform: scaleY(1.1); }
            }
        `;
        document.head.appendChild(style);
    }
    
    setTimeout(() => {
        if (visualizer.parentNode) {
            visualizer.parentNode.removeChild(visualizer);
        }
    }, 8000);
}

// Romantic Fireworks
function createRomanticFireworks() {
    const fireworkCount = 8;
    const colors = ['#ff69b4', '#ff1493', '#ffc0cb', '#ffb6c1', '#ff91a4'];
    
    for (let i = 0; i < fireworkCount; i++) {
        setTimeout(() => {
            const firework = document.createElement('div');
            firework.style.cssText = `
                position: fixed;
                width: 6px;
                height: 6px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                animation: romanticFirework 2s ease-out forwards;
                box-shadow: 0 0 10px ${colors[Math.floor(Math.random() * colors.length)]};
            `;
            
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const angle = (i / fireworkCount) * Math.PI * 2;
            const distance = 200 + Math.random() * 100;
            
            firework.style.left = (centerX + Math.cos(angle) * distance) + 'px';
            firework.style.top = (centerY + Math.sin(angle) * distance) + 'px';
            
            document.body.appendChild(firework);
            
            setTimeout(() => {
                if (firework.parentNode) {
                    firework.parentNode.removeChild(firework);
                }
            }, 2000);
        }, i * 200);
    }
    
    // Add romantic firework animation if not exists
    if (!document.getElementById('romanticFireworkAnimation')) {
        const style = document.createElement('style');
        style.id = 'romanticFireworkAnimation';
        style.textContent = `
            @keyframes romanticFirework {
                0% { transform: scale(0) rotate(0deg); opacity: 1; }
                30% { transform: scale(1.5) rotate(120deg); opacity: 1; }
                70% { transform: scale(1) rotate(240deg); opacity: 0.8; }
                100% { transform: scale(0.3) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Floating Love Letters
function createFloatingLoveLetters() {
    const letters = ['L', 'O', 'V', 'E', '💕', '💖', '💗', '💝'];
    const letterCount = 20;
    
    for (let i = 0; i < letterCount; i++) {
        setTimeout(() => {
            const letter = document.createElement('div');
            letter.textContent = letters[Math.floor(Math.random() * letters.length)];
            letter.style.cssText = `
                position: fixed;
                font-size: 2rem;
                color: #ff69b4;
                pointer-events: none;
                z-index: 1000;
                animation: floatingLetter 4s ease-out forwards;
                font-weight: bold;
                text-shadow: 0 0 10px rgba(255, 105, 180, 0.6);
            `;
            
            letter.style.left = Math.random() * window.innerWidth + 'px';
            letter.style.top = window.innerHeight + 'px';
            
            document.body.appendChild(letter);
            
            setTimeout(() => {
                if (letter.parentNode) {
                    letter.parentNode.removeChild(letter);
                }
            }, 4000);
        }, i * 100);
    }
    
    // Add floating letter animation if not exists
    if (!document.getElementById('floatingLetterAnimation')) {
        const style = document.createElement('style');
        style.id = 'floatingLetterAnimation';
        style.textContent = `
            @keyframes floatingLetter {
                0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                50% { transform: translateY(-50vh) rotate(180deg); opacity: 0.8; }
                100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Heartbeat Effect
function createHeartbeatEffect() {
    const heartbeat = document.createElement('div');
    heartbeat.innerHTML = '💓';
    heartbeat.style.cssText = `
        position: fixed;
        font-size: 4rem;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 1000;
        animation: heartbeatEffect 2s ease-out forwards;
    `;
    
    document.body.appendChild(heartbeat);
    
    setTimeout(() => {
        if (heartbeat.parentNode) {
            heartbeat.parentNode.removeChild(heartbeat);
        }
    }, 2000);
    
    // Add heartbeat animation if not exists
    if (!document.getElementById('heartbeatEffectAnimation')) {
        const style = document.createElement('style');
        style.id = 'heartbeatEffectAnimation';
        style.textContent = `
            @keyframes heartbeatEffect {
                0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                20% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
                40% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                60% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
                80% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// New Surprise Effects
function initSurpriseEffects() {
    // Add random sparkles on page
    createRandomSparkles();
    
    // Add mouse trail effect
    initMouseTrail();
    
    // Add surprise messages on scroll
    initScrollSurprises();
}

// Create random sparkles
function createRandomSparkles() {
    setInterval(() => {
        if (Math.random() < 0.3) { // 30% chance every interval
            createSparkle();
        }
    }, 2000);
}

function createSparkle() {
    const sparkle = document.createElement('div');
    sparkle.innerHTML = '✨';
    sparkle.style.cssText = `
        position: fixed;
        font-size: 1.5rem;
        pointer-events: none;
        z-index: 1000;
        animation: sparkleFloat 2s ease-out forwards;
    `;
    
    sparkle.style.left = Math.random() * window.innerWidth + 'px';
    sparkle.style.top = Math.random() * window.innerHeight + 'px';
    
    document.body.appendChild(sparkle);
    
    setTimeout(() => {
        if (sparkle.parentNode) {
            sparkle.parentNode.removeChild(sparkle);
        }
    }, 2000);
    
    // Add sparkle animation if not exists
    if (!document.getElementById('sparkleFloatAnimation')) {
        const style = document.createElement('style');
        style.id = 'sparkleFloatAnimation';
        style.textContent = `
            @keyframes sparkleFloat {
                0% { opacity: 0; transform: scale(0) rotate(0deg); }
                50% { opacity: 1; transform: scale(1) rotate(180deg); }
                100% { opacity: 0; transform: scale(0.5) rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Mouse trail effect
function initMouseTrail() {
    let mouseTrail = [];
    const maxTrailLength = 20;
    
    document.addEventListener('mousemove', function(e) {
        const trailDot = document.createElement('div');
        trailDot.style.cssText = `
            position: fixed;
            width: 6px;
            height: 6px;
            background: rgba(255, 105, 180, 0.6);
            border-radius: 50%;
            pointer-events: none;
            z-index: 999;
            animation: trailFade 1s ease-out forwards;
        `;
        
        trailDot.style.left = e.clientX - 3 + 'px';
        trailDot.style.top = e.clientY - 3 + 'px';
        
        document.body.appendChild(trailDot);
        mouseTrail.push(trailDot);
        
        if (mouseTrail.length > maxTrailLength) {
            const oldDot = mouseTrail.shift();
            if (oldDot.parentNode) {
                oldDot.parentNode.removeChild(oldDot);
            }
        }
        
        setTimeout(() => {
            if (trailDot.parentNode) {
                trailDot.parentNode.removeChild(trailDot);
            }
        }, 1000);
    });
    
    // Add trail animation if not exists
    if (!document.getElementById('trailFadeAnimation')) {
        const style = document.createElement('style');
        style.id = 'trailFadeAnimation';
        style.textContent = `
            @keyframes trailFade {
                0% { opacity: 1; transform: scale(1); }
                100% { opacity: 0; transform: scale(0); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Scroll surprises
function initScrollSurprises() {
    let surpriseCount = 0;
    
    window.addEventListener('scroll', function() {
        const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        
        if (scrollPercent > 25 && surpriseCount === 0) {
            createFloatingLoveLetters();
            surpriseCount++;
        } else if (scrollPercent > 50 && surpriseCount === 1) {
            createRomanticFireworks();
            surpriseCount++;
        } else if (scrollPercent > 75 && surpriseCount === 2) {
            createHeartbeatEffect();
            surpriseCount++;
        }
    });
}

// Create floating emojis
function createFloatingEmojis(emojis) {
    emojis.forEach((emoji, index) => {
        setTimeout(() => {
            const emojiEl = document.createElement('div');
            emojiEl.textContent = emoji;
            emojiEl.style.cssText = `
                position: fixed;
                font-size: 2rem;
                pointer-events: none;
                z-index: 1000;
                animation: emojiFloat 3s ease-out forwards;
            `;
            
            emojiEl.style.left = Math.random() * window.innerWidth + 'px';
            emojiEl.style.top = window.innerHeight + 'px';
            
            document.body.appendChild(emojiEl);
            
            setTimeout(() => {
                if (emojiEl.parentNode) {
                    emojiEl.parentNode.removeChild(emojiEl);
                }
            }, 3000);
        }, index * 200);
    });
    
    // Add emoji animation if not exists
    if (!document.getElementById('emojiFloatAnimation')) {
        const style = document.createElement('style');
        style.id = 'emojiFloatAnimation';
        style.textContent = `
            @keyframes emojiFloat {
                0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Enhanced Rainbow effect
function createRainbowEffect() {
    const rainbowContainer = document.createElement('div');
    rainbowContainer.className = 'rainbow-container';
    
    // Create 7 rainbow arcs
    for (let i = 0; i < 7; i++) {
        const arc = document.createElement('div');
        arc.className = 'rainbow-arc';
        rainbowContainer.appendChild(arc);
    }
    
    document.body.appendChild(rainbowContainer);
    
    // Add sparkle effects around rainbow
    setTimeout(() => {
        createRainbowSparkles();
    }, 500);
    
    // Remove rainbow after animation
    setTimeout(() => {
        if (rainbowContainer.parentNode) {
            rainbowContainer.parentNode.removeChild(rainbowContainer);
        }
    }, 4000);
}

// Create sparkles around rainbow
function createRainbowSparkles() {
    const sparkleCount = 20;
    const sparkles = ['✨', '⭐', '💫', '🌟', '✨'];
    
    for (let i = 0; i < sparkleCount; i++) {
        setTimeout(() => {
            const sparkle = document.createElement('div');
            sparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
            sparkle.className = 'sparkle-enhanced';
            
            // Position around the center
            const angle = (i / sparkleCount) * Math.PI * 2;
            const radius = 200 + Math.random() * 100;
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            
            sparkle.style.left = (centerX + Math.cos(angle) * radius) + 'px';
            sparkle.style.top = (centerY + Math.sin(angle) * radius) + 'px';
            
            document.body.appendChild(sparkle);
            
            setTimeout(() => {
                if (sparkle.parentNode) {
                    sparkle.parentNode.removeChild(sparkle);
                }
            }, 2500);
        }, i * 50);
    }
}

// Love message surprise
function createLoveMessage() {
    const messages = [
        "Em là ánh sáng trong cuộc đời anh! 💫",
        "Mỗi ngày với em đều là một món quà! 🎁",
        "Anh yêu em hơn cả những từ ngữ có thể diễn tả! 💕",
        "Em làm trái tim anh nhảy múa! 💃",
        "Cảm ơn em vì đã là chính em! 🌟"
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    const messageEl = document.createElement('div');
    messageEl.textContent = message;
    messageEl.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(45deg, #ff69b4, #ff1493);
        color: white;
        padding: 20px 30px;
        border-radius: 20px;
        font-size: 1.3rem;
        font-weight: 600;
        box-shadow: 0 15px 40px rgba(255, 105, 180, 0.5);
        z-index: 1001;
        animation: loveMessagePop 3s ease-out forwards;
        text-align: center;
    `;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        if (messageEl.parentNode) {
            messageEl.parentNode.removeChild(messageEl);
        }
    }, 3000);
    
    // Add love message animation if not exists
    if (!document.getElementById('loveMessagePopAnimation')) {
        const style = document.createElement('style');
        style.id = 'loveMessagePopAnimation';
        style.textContent = `
            @keyframes loveMessagePop {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.3) rotate(-10deg); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1) rotate(5deg); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(0deg); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8) rotate(10deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Easter Eggs
function initEasterEggs() {
    // Konami code easter egg
    let konamiCode = [];
    const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
    
    document.addEventListener('keydown', function(e) {
        konamiCode.push(e.code);
        if (konamiCode.length > konamiSequence.length) {
            konamiCode.shift();
        }
        
        if (konamiCode.join(',') === konamiSequence.join(',')) {
            createSuperSurprise();
            konamiCode = [];
        }
    });
    
    // Secret click pattern
    let clickPattern = [];
    const secretPattern = [1, 1, 2, 1, 2]; // 1 = left click, 2 = right click
    
    document.addEventListener('click', function(e) {
        clickPattern.push(1);
        if (clickPattern.length > secretPattern.length) {
            clickPattern.shift();
        }
        
        if (clickPattern.join(',') === secretPattern.join(',')) {
            createSecretEffect();
            clickPattern = [];
        }
    });
    
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        clickPattern.push(2);
        if (clickPattern.length > secretPattern.length) {
            clickPattern.shift();
        }
        
        if (clickPattern.join(',') === secretPattern.join(',')) {
            createSecretEffect();
            clickPattern = [];
        }
    });
}

// Super surprise effect
function createSuperSurprise() {
    // Create confetti explosion
    createConfettiExplosion();
    
    // Create multiple heart explosions
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            createHeartExplosion();
        }, i * 200);
    }
    
    // Show super message
    setTimeout(() => {
        const superMessage = document.createElement('div');
        superMessage.innerHTML = `
            <div style="font-size: 3rem; margin-bottom: 20px;">🎉</div>
            <div style="font-size: 2rem; font-weight: bold; margin-bottom: 10px;">BẤT NGỜ SIÊU TO KHỔNG LỒ!</div>
            <div style="font-size: 1.2rem;">Anh yêu em vô cùng! 💕</div>
        `;
        superMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(45deg, #ff69b4, #ff1493, #ff69b4);
            background-size: 200% 200%;
            color: white;
            padding: 40px;
            border-radius: 30px;
            box-shadow: 0 20px 60px rgba(255, 105, 180, 0.6);
            z-index: 1002;
            animation: superSurprisePop 4s ease-out forwards;
            text-align: center;
        `;
        
        document.body.appendChild(superMessage);
        
        setTimeout(() => {
            if (superMessage.parentNode) {
                superMessage.parentNode.removeChild(superMessage);
            }
        }, 4000);
    }, 1000);
    
    // Add super surprise animation if not exists
    if (!document.getElementById('superSurprisePopAnimation')) {
        const style = document.createElement('style');
        style.id = 'superSurprisePopAnimation';
        style.textContent = `
            @keyframes superSurprisePop {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.1) rotate(-180deg); }
                30% { opacity: 1; transform: translate(-50%, -50%) scale(1.2) rotate(10deg); }
                70% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(-5deg); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8) rotate(180deg); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Secret effect
function createSecretEffect() {
    // Create floating roses
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const rose = document.createElement('div');
            rose.textContent = '🌹';
            rose.style.cssText = `
                position: fixed;
                font-size: 2rem;
                pointer-events: none;
                z-index: 1000;
                animation: roseFloat 4s ease-out forwards;
            `;
            
            rose.style.left = Math.random() * window.innerWidth + 'px';
            rose.style.top = window.innerHeight + 'px';
            
            document.body.appendChild(rose);
            
            setTimeout(() => {
                if (rose.parentNode) {
                    rose.parentNode.removeChild(rose);
                }
            }, 4000);
        }, i * 100);
    }
    
    // Add rose animation if not exists
    if (!document.getElementById('roseFloatAnimation')) {
        const style = document.createElement('style');
        style.id = 'roseFloatAnimation';
        style.textContent = `
            @keyframes roseFloat {
                0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                50% { transform: translateY(-50vh) rotate(180deg); opacity: 0.8; }
                100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Button ripple effect
function createButtonRipple(button, event) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.4);
        border-radius: 50%;
        transform: scale(0);
        animation: rippleEffect 0.6s ease-out;
        pointer-events: none;
    `;
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);
    
    setTimeout(() => {
        if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
        }
    }, 600);
    
    // Add ripple animation if not exists
    if (!document.getElementById('rippleEffectAnimation')) {
        const style = document.createElement('style');
        style.id = 'rippleEffectAnimation';
        style.textContent = `
            @keyframes rippleEffect {
                to { transform: scale(2); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Heart explosion effect
function createHeartExplosion() {
    const container = document.querySelector('.container');
    const heartCount = 30;
    
    for (let i = 0; i < heartCount; i++) {
        setTimeout(() => {
            const heart = document.createElement('div');
            heart.innerHTML = '💖';
            heart.style.cssText = `
                position: fixed;
                font-size: 1.5rem;
                pointer-events: none;
                z-index: 1000;
                animation: heartExplode 2s ease-out forwards;
            `;
            
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const angle = (i / heartCount) * Math.PI * 2;
            const distance = 100 + Math.random() * 200;
            
            heart.style.left = (centerX + Math.cos(angle) * distance) + 'px';
            heart.style.top = (centerY + Math.sin(angle) * distance) + 'px';
            
            document.body.appendChild(heart);
            
            setTimeout(() => {
                if (heart.parentNode) {
                    heart.parentNode.removeChild(heart);
                }
            }, 2000);
        }, i * 50);
    }
    
    // Add heart explode animation if not exists
    if (!document.getElementById('heartExplodeAnimation')) {
        const style = document.createElement('style');
        style.id = 'heartExplodeAnimation';
        style.textContent = `
            @keyframes heartExplode {
                0% { transform: scale(0) rotate(0deg); opacity: 1; }
                50% { transform: scale(1.2) rotate(180deg); opacity: 0.8; }
                100% { transform: scale(0.5) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Confetti effect
function initConfettiEffect() {
    // Add confetti on special occasions
    setInterval(() => {
        if (Math.random() < 0.1) { // 10% chance every interval
            createConfetti();
        }
    }, 5000);
}

function createConfetti() {
    const colors = ['#ff69b4', '#ff1493', '#ffc0cb', '#ffb6c1', '#ff91a4', '#ff69b4'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                pointer-events: none;
                z-index: 1000;
                animation: confettiFall 3s ease-out forwards;
            `;
            
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.top = '-10px';
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 3000);
        }, i * 20);
    }
    
    // Add confetti animation if not exists
    if (!document.getElementById('confettiFallAnimation')) {
        const style = document.createElement('style');
        style.id = 'confettiFallAnimation';
        style.textContent = `
            @keyframes confettiFall {
                0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

function createConfettiExplosion() {
    const colors = ['#ff69b4', '#ff1493', '#ffc0cb', '#ffb6c1', '#ff91a4'];
    const confettiCount = 100;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 8px;
                height: 8px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                pointer-events: none;
                z-index: 1000;
                animation: confettiExplode 2s ease-out forwards;
            `;
            
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 300;
            
            confetti.style.left = (centerX + Math.cos(angle) * distance) + 'px';
            confetti.style.top = (centerY + Math.sin(angle) * distance) + 'px';
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 2000);
        }, i * 10);
    }
    
    // Add confetti explode animation if not exists
    if (!document.getElementById('confettiExplodeAnimation')) {
        const style = document.createElement('style');
        style.id = 'confettiExplodeAnimation';
        style.textContent = `
            @keyframes confettiExplode {
                0% { transform: scale(0) rotate(0deg); opacity: 1; }
                50% { transform: scale(1) rotate(180deg); opacity: 0.8; }
                100% { transform: scale(0.5) rotate(360deg); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile optimizations first
    initMobileOptimizations();
    
    // Initialize all interactive features
    initMusicPlayer();
    initLoveButton();
    initWishCards();
    initScrollAnimations();
    initParticleEffect();
    initTypingEffect();
    initSurpriseEffects();
    initEasterEggs();
    initConfettiEffect();
    initMagicButton();
    initFloatingPetals();
});
