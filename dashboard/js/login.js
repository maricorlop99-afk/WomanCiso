// =====================================================
// LOGIN - CENTINELA-X
// =====================================================

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('login-form');
    const btn = document.getElementById('login-btn');
    const btnText = document.getElementById('btn-text');
    const btnIcon = document.getElementById('btn-icon');
    const messageEl = document.getElementById('login-message');

    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        // Deshabilitar botón y mostrar estado de carga
        btn.disabled = true;
        btnText.textContent = 'Verificando...';
        btnIcon.className = 'fa-solid fa-spinner fa-spin';
        messageEl.textContent = '';

        // Simular verificación por 500ms
        setTimeout(function () {
            // Siempre "autenticar" correctamente (prototipo)
            // Redirigir al dashboard
            window.location.href = '/dashboard/';
        }, 500);
    });

    // Toggle de visibilidad de contraseña (opcional)
    const toggleBtn = document.getElementById('password-toggle');
    const passwordInput = document.getElementById('password');
    if (toggleBtn && passwordInput) {
        toggleBtn.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            this.querySelector('i').className = type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
        });
    }
});