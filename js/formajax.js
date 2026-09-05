"use strict";

(function() {
    let myTimer;
    const form = document.getElementById("contact_form");
    if (!form) return;

    // Helper: Get localized message
    const getMessage = (key) => {
        const lang = localStorage.getItem("lang") || window.navigator.language;
        const messages = {
            en: {
                success: "The request has been successfully sent!",
                error: "An error occurred. Please try again later!",
                invalid: "Check the correctness of the data you entered!",
                sending: "Sending..."
            },
            az: {
                success: "Müraciət uğurla göndərildi!",
                error: "Xəta baş verdi. Zəhmət olmasa bir az sonra yenə cəhd edin!",
                invalid: "Daxil etdiyiniz məlumatların düzgünlüyünü yoxlayın!",
                sending: "Göndərilir..."
            },
            ru: {
                success: "Заявка успешно отправлена!",
                error: "Произошла ошибка. Пожалуйста, повторите попытку позже!",
                invalid: "Проверьте корректность введенных вами данных!",
                sending: "Отправка..."
            }
        };
        const l = lang.startsWith("az") ? "az" : lang.startsWith("ru") ? "ru" : "en";
        return messages[l][key];
    };

    const validateInput = (input) => {
        const name = input.getAttribute('name');
        if (name === 'website') return true; // Skip honeypot field

        const value = input.value.trim();
        let isValid = true;

        if (name === 'email') {
            isValid = value.length >= 5 && value.length <= 80 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        } else if (name === 'message') {
            isValid = value.length >= 2;
        } else {
            isValid = value.length >= 1 && value.length <= 100;
        }

        if (!isValid) input.classList.add("error");
        else input.classList.remove("error");
        return isValid;
    };

    // Live validation (Skip honeypot)
    form.querySelectorAll('input:not([name="website"]), textarea').forEach(input => {
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

        // 1. Honeypot check
        const honeypot = form.querySelector("#website_hp").value;
        if (honeypot) {
            showToast(getMessage('success'), 'success'); // Fake success
            form.reset();
            return;
        }

        const submitBtn = form.querySelector(".submit-btn");
        
        let isFormValid = true;
        // Validate actual inputs only
        form.querySelectorAll('input:not([name="website"]), textarea').forEach(input => {
            if (!validateInput(input)) isFormValid = false;
        });

        if (!isFormValid) {
            showToast(getMessage('invalid'), 'error');
            return;
        }

        submitBtn.classList.add("loading");
        submitBtn.disabled = true;
        const btnTextSpan = submitBtn.querySelector(".btn-send-text");
        const originalBtnText = btnTextSpan.innerText;
        btnTextSpan.innerText = getMessage('sending');
        
        emailjs.init({publicKey: "_GCxj9wp4lONoUvJG"});

        const formData = {
            name: (form.querySelector("input[name=name]")?.value || "").trim(),
            email: (form.querySelector("input[name=email]")?.value || "").trim(),
            subject: (form.querySelector("input[name=subject]")?.value || "").trim(),
            message: (form.querySelector("[name=message]")?.value || "").trim()
        };    

        emailjs.send("service_mmm1wzr", "template_04r4zio", formData)
            .then(() => {
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
            })
            .finally(() => {
                submitBtn.classList.remove("loading");
            });
    });
})();