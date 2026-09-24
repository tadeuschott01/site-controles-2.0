/* =========================================================
   CONTROLES — SITE.JS
   JavaScript da página institucional
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       SCROLL SUAVE PARA LINKS INTERNOS
       ===================================================== */

    document.querySelectorAll('a[href^="#"]').forEach(link => {

        link.addEventListener("click", event => {

            const href = link.getAttribute("href");

            if (!href || href === "#") {
                return;
            }

            const section = document.querySelector(href);

            if (!section) {
                return;
            }

            event.preventDefault();

            section.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        });

    });


    /* =====================================================
       HEADER AO ROLAR A PÁGINA
       ===================================================== */

    const header = document.querySelector(".site-header");

    function updateHeader() {

        if (!header) {
            return;
        }

        if (window.scrollY > 20) {

            header.classList.add("scrolled");

        } else {

            header.classList.remove("scrolled");

        }

    }

    updateHeader();

    window.addEventListener(
        "scroll",
        updateHeader,
        {
            passive: true
        }
    );


    /* =====================================================
       ANIMAÇÃO DOS ELEMENTOS AO APARECEREM NA TELA
       ===================================================== */

    const animatedElements = document.querySelectorAll(
        ".feature-card, " +
        ".online-card, " +
        ".premium-features, " +
        ".phone-frame"
    );

    if ("IntersectionObserver" in window) {

        const observer = new IntersectionObserver(

            entries => {

                entries.forEach(entry => {

                    if (entry.isIntersecting) {

                        entry.target.classList.add(
                            "visible"
                        );

                        observer.unobserve(
                            entry.target
                        );

                    }

                });

            },

            {
                threshold: 0.15
            }

        );


        animatedElements.forEach(element => {

            element.classList.add(
                "reveal"
            );

            observer.observe(
                element
            );

        });

    } else {

        animatedElements.forEach(element => {

            element.classList.add(
                "visible"
            );

        });

    }


    /* =====================================================
       LINKS PARA O CONTROLES ONLINE
       ===================================================== */

    const onlineLinks = document.querySelectorAll(
        'a[href="app.html"]'
    );

    onlineLinks.forEach(link => {

        link.addEventListener("click", () => {

            console.log(
                "Abrindo ControleS Online..."
            );

        });

    });


    /* =====================================================
       LINK DA PLAY STORE
       ===================================================== */

    const playStoreButton = document.querySelector(
        ".play-store-button"
    );

    if (playStoreButton) {

        playStoreButton.addEventListener(
            "click",
            event => {

                const href =
                    playStoreButton.getAttribute(
                        "href"
                    );

                /*
                 * Enquanto o aplicativo ainda não tiver
                 * um link configurado, evita abrir "#".
                 */

                if (
                    !href ||
                    href === "#"
                ) {

                    event.preventDefault();

                    alert(
                        "O ControleS estará disponível em breve na Google Play."
                    );

                }

            }
        );

    }


    /* =====================================================
       ANO AUTOMÁTICO DO RODAPÉ
       ===================================================== */

    const yearElement = document.querySelector(
        "[data-current-year]"
    );

    if (yearElement) {

        yearElement.textContent =
            new Date().getFullYear();

    }

});
