
// Mobile Menu Toggle
const mobileToggle = document.querySelector('.mobile-toggle');
const navMenu = document.querySelector('.nav-menu');

if (mobileToggle) {
    mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        const icon = mobileToggle.querySelector('i');
        if (icon) {
            icon.classList.toggle('fa-bars');
            icon.classList.toggle('fa-times');
        }
    });
}

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        if (navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
        }
    });
});

// Scroll Animation Observer
const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-up').forEach(el => {
    observer.observe(el);
});

// Language Switcher Logic
function switchLanguage(lang) {
    localStorage.setItem('diakore_lang', lang);
    // Logic to redirect if needed, or visual feedback
    // In this multi-page setup, we just link to the other file, 
    // but we can store preference for future visits.
}

// Check saved language on root load ONLY (optional)
/*
if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
   const savedInfo = localStorage.getItem('diakore_lang');
   if (savedInfo === 'fr' && !window.location.pathname.includes('/fr/')) {
       // Optional: Redirect to FR version if user previously selected FR
       // window.location.href = '/fr/'; 
   }
}
*/

// Contact Form Logic
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    const messageContainer = contactForm.querySelector('.form-message');
    const lang = document.documentElement.lang || 'en';

    const uiMessages = {
        en: {
            success: 'Message sent successfully! We will get back to you soon.',
            error: 'Failed to send message. Please try again later.',
            captcha: 'Please complete the captcha verification.',
            sending: 'Sending...'
        },
        fr: {
            success: 'Message envoyé avec succès ! Nous vous répondrons bientôt.',
            error: 'Échec de l\'envoi du message. Veuillez réessayer plus tard.',
            captcha: 'Veuillez compléter la vérification captcha.',
            sending: 'Envoi en cours...'
        }
    };

    // Fallback to English if lang not found
    const t = uiMessages[lang] || uiMessages['en'];

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());

        // Get generic recaptcha response
        const recaptchaResponse = grecaptcha.getResponse();

        if (!recaptchaResponse) {
            showMessage(t.captcha, 'error');
            return;
        }

        data.recaptchaToken = recaptchaResponse;

        // Show loading state
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerText;
        submitBtn.innerText = t.sending;
        submitBtn.disabled = true;

        try {
            const response = await fetch('/.netlify/functions/contact', {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                showMessage(t.success, 'success');
                contactForm.reset();
                grecaptcha.reset();
            } else {
                const resData = await response.json();
                console.error('Server Error:', resData);
                showMessage(t.error, 'error');
            }
        } catch (error) {
            console.error('Network Error:', error);
            showMessage(t.error, 'error');
        } finally {
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        }
    });

    function showMessage(text, type) {
        if (!messageContainer) return;
        messageContainer.textContent = text;
        messageContainer.className = `form-message ${type}`;

        // Optional: Hide after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                messageContainer.style.display = 'none';
            }, 6000);
        }
    }
}
