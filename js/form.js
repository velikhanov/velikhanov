"use strict";

(function() {
    let myTimer;
    const form = document.getElementById("contact_form");
    if (!form) return;

    const startedAtInput = document.getElementById("started_at");
    if (startedAtInput) startedAtInput.value = Date.now();

    // --- Turnstile: render explicitly so it matches the site's theme, ---
    // --- and re-render (theme can't be changed on an existing widget) ---
    // --- whenever the user toggles dark/light mode.                   ---
    const turnstileEl = document.getElementById("turnstile-widget");
    let turnstileWidgetId = null;

    const currentSiteTheme = () => document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';

    const renderTurnstile = () => {
        if (!turnstileEl || typeof turnstile === 'undefined') return;
        if (turnstileWidgetId !== null) turnstile.remove(turnstileWidgetId);
        turnstileWidgetId = turnstile.render(turnstileEl, {
            sitekey: turnstileEl.dataset.sitekey,
            theme: currentSiteTheme(),
            size: 'flexible'
        });
    };

    window.onTurnstileLoad = renderTurnstile;

    if (turnstileEl) {
        new MutationObserver(() => renderTurnstile())
            .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }

    const MESSAGES = {
        success: "The request has been successfully sent!",
        error: "An error occurred. Please try again later!",
        invalid: "Check the correctness of the data you entered!",
        captcha: "Please complete the verification challenge!",
        sending: "Sending..."
    };
    const getMessage = (key) => MESSAGES[key];

    const validateInput = (input) => {
        const name = input.getAttribute('name');
        if (name === 'website') return true;

        const value = input.value.trim();
        let isValid = true;

        if (name === 'email') {
            isValid = value.length >= 5 && value.length <= 80 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        } else if (name === 'message') {
            isValid = value.length >= 2;
        } else if (name === 'subject') {
            isValid = value.length <= 100; // optional
        } else {
            isValid = value.length >= 1 && value.length <= 100;
        }

        if (!isValid) input.classList.add("error");
        else input.classList.remove("error");
        return isValid;
    };

    form.querySelectorAll('input:not([name="website"])').forEach(input => {
        input.addEventListener('input', () => validateInput(input));
    });

    const showToast = (message, type) => {
        const toast = document.querySelector(".toast");
        clearTimeout(myTimer);
        toast.textContent = message;
        toast.className = `toast toast--${type} toast--visible`;
        myTimer = setTimeout(() => {
            toast.classList.remove("toast--visible");
        }, 3000);
    };

    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const honeypot = form.querySelector("#website_hp").value;
        if (honeypot) {
            showToast(getMessage('success'), 'success');
            form.reset();
            return;
        }

        const submitBtn = form.querySelector(".submit-btn");

        let isFormValid = true;
        form.querySelectorAll('input:not([name="website"])').forEach(input => {
            if (!validateInput(input)) isFormValid = false;
        });

        if (!isFormValid) {
            showToast(getMessage('invalid'), 'error');
            return;
        }

        const token = (typeof turnstile !== 'undefined' && turnstileWidgetId !== null) ? turnstile.getResponse(turnstileWidgetId) : '';
        if (!token) {
            showToast(getMessage('captcha'), 'error');
            return;
        }

        submitBtn.classList.add("loading");
        submitBtn.disabled = true;
        const btnTextSpan = submitBtn.querySelector(".btn-send-text");
        const originalBtnText = btnTextSpan.innerText;
        btnTextSpan.innerText = getMessage('sending');

        const formData = {
            name: (form.querySelector("input[name=name]")?.value || "").trim(),
            email: (form.querySelector("input[name=email]")?.value || "").trim(),
            subject: (form.querySelector("input[name=subject]")?.value || "").trim(),
            message: (form.querySelector("[name=message]")?.value || "").trim(),
            website: honeypot,
            startedAt: startedAtInput ? startedAtInput.value : 0,
            token: token
        };

        fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
            .then((res) => {
                if (!res.ok) throw new Error('send failed');
                showToast(getMessage('success'), 'success');
                form.reset();
                form.querySelectorAll('input').forEach(i => i.disabled = true);
                submitBtn.disabled = true;
                btnTextSpan.innerText = originalBtnText;
            })
            .catch(() => {
                showToast(getMessage('error'), 'error');
                submitBtn.disabled = false;
                btnTextSpan.innerText = originalBtnText;
                if (typeof turnstile !== 'undefined' && turnstileWidgetId !== null) turnstile.reset(turnstileWidgetId);
            })
            .finally(() => {
                submitBtn.classList.remove("loading");
            });
    });
})();
