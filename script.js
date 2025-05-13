document.addEventListener('DOMContentLoaded', () => {
    const wordInputEl = document.getElementById('wordInput');
    const wordDisplayAreaEl = document.getElementById('word-display-area');
    const etymologyResultsAreaEl = document.getElementById('etymology-results-area');
    const loadingIndicatorEl = document.getElementById('loading-indicator');

    let currentWord = null;
    let isFetching = false;

    // --- Particle Background (Optional with tsParticles) ---
    // if (window.tsParticles) {
    //     tsParticles.load("particle-background", {
    //         fpsLimit: 60,
    //         particles: {
    //             number: { value: 50, density: { enable: true, value_area: 800 } },
    //             color: { value: ["#00f7ff", "#ff40ff", "#ffffff"] }, // Cyan, Magenta, White
    //             shape: { type: "circle" },
    //             opacity: { value: 0.5, random: true, anim: { enable: true, speed: 0.3, opacity_min: 0.1, sync: false } },
    //             size: { value: 2, random: true, anim: { enable: false } },
    //             line_linked: { enable: false }, // Keep it clean, no lines
    //             move: {
    //                 enable: true, speed: 0.5, direction: "none", random: true, straight: false, out_mode: "out",
    //                 attract: { enable: false }
    //             }
    //         },
    //         interactivity: { detect_on: "canvas", events: { onclick: { enable: false }, onhover: { enable: false } } },
    //         detectRetina: true,
    //     });
    // }

    wordInputEl.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && wordInputEl.value.trim() !== '') {
            initiateWordAnalysis(wordInputEl.value.trim());
        }
    });
    wordInputEl.addEventListener('blur', () => { // Also trigger on blur if there's text
        if (wordInputEl.value.trim() !== '' && !currentWord) { // Only if no word is currently displayed
             initiateWordAnalysis(wordInputEl.value.trim());
        }
    });

    function initiateWordAnalysis(word) {
        currentWord = word.toLowerCase();
        wordInputEl.value = ''; // Clear input
        wordDisplayAreaEl.innerHTML = ''; // Clear previous word
        etymologyResultsAreaEl.innerHTML = ''; // Clear previous results
        etymologyResultsAreaEl.classList.remove('visible');

        const wordEl = document.createElement('div');
        wordEl.className = 'interactive-word';
        wordEl.textContent = currentWord;
        wordEl.addEventListener('click', handleWordClick);
        wordDisplayAreaEl.appendChild(wordEl);
    }

    async function handleWordClick() {
        if (isFetching || !currentWord) return;

        isFetching = true;
        loadingIndicatorEl.classList.remove('hidden');
        wordDisplayAreaEl.style.opacity = '0.5'; // Dim the word slightly

        try {
            const response = await fetch(`/api/get-etymology?word=${encodeURIComponent(currentWord)}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({error: "Unknown error occurred"}));
                throw new Error(`API Error: ${response.status} - ${errorData.error || response.statusText}`);
            }
            const data = await response.json();
            displayEtymology(data);
        } catch (error) {
            console.error('Error fetching etymology:', error);
            etymologyResultsAreaEl.innerHTML = `<p class="error-message">Sorry, couldn't fetch etymology. ${error.message}</p>`;
            etymologyResultsAreaEl.classList.add('visible');
        } finally {
            isFetching = false;
            loadingIndicatorEl.classList.add('hidden');
            wordDisplayAreaEl.style.opacity = '1';
        }
    }

    function displayEtymology(data) {
        wordDisplayAreaEl.innerHTML = ''; // Clear the clickable word, as it's "broken apart"

        let html = '';

        if (data.overall_etymology) {
            html += `<p class="overall-etymology-text">${data.overall_etymology}</p>`;
        }

        if (data.morphemes && data.morphemes.length > 0) {
            html += '<div class="morphemes-container">';
            data.morphemes.forEach((morph, index) => {
                html += `
                    <div class="morpheme-group" style="animation-delay: ${index * 0.15}s; animation-name: fadeInAndUpMorpheme; animation-duration: 0.5s; animation-fill-mode: forwards;">
                        <div class="morpheme-particle">${morph.morpheme}</div>
                        <div class="morpheme-details">
                            ${morph.type ? `<span><span class="detail-label">Type:</span> ${morph.type}</span>` : ''}
                            ${morph.origin ? `<span><span class="detail-label">Origin:</span> ${morph.origin}</span>` : ''}
                            ${morph.meaning ? `<span><span class="detail-label">Meaning:</span> ${morph.meaning}</span>` : ''}
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        } else if (!data.overall_etymology) {
             html += `<p>No detailed morpheme breakdown found for "${data.word}".</p>`;
        }


        etymologyResultsAreaEl.innerHTML = html;
        etymologyResultsAreaEl.classList.add('visible');

        // Re-focus input for next word, or provide another way to reset
        // wordInputEl.focus();
        currentWord = null; // Allow new word input
    }
});