document.addEventListener('DOMContentLoaded', () => {
  const quizRoot = document.querySelector('.myth-fact-grid');
  if (!quizRoot) return;

  const cards = Array.from(quizRoot.querySelectorAll('.myth-fact-card'));
  if (!cards.length) return;

  let currentIndex = 0;

  // Screen-reader wiring: each answer button is described by its statement,
  // and the Next button by the result + explanation, so moving focus there
  // reads the feedback out.
  cards.forEach((card, i) => {
    const id = `${quizRoot.id || 'mythFact'}-${i}`;
    const statement = card.querySelector('.myth-fact-statement');
    const result = card.querySelector('.myth-fact-result');
    const explanation = card.querySelector('.myth-fact-explanation');
    const next = card.querySelector('.myth-fact-next');
    if (statement) {
      statement.id = `${id}-statement`;
      card.querySelectorAll('.myth-fact-choice').forEach((b) => b.setAttribute('aria-describedby', statement.id));
    }
    if (result && explanation && next) {
      result.id = `${id}-result`;
      explanation.id = `${id}-explanation`;
      next.setAttribute('aria-describedby', `${result.id} ${explanation.id}`);
    }
  });

  // Writes the explanation, turning citations like "[11b]" into links to the
  // matching entry in the page's Sources section (#source-11b).
  function renderWithCitations(element, text) {
    element.textContent = '';
    text.split(/(\[\d+[a-z]?\])/).forEach((part) => {
      const match = part.match(/^\[(\d+[a-z]?)\]$/);
      if (!match) {
        if (part) element.append(part);
        return;
      }
      const link = document.createElement('a');
      link.className = 'cite';
      link.href = `#source-${match[1]}`;
      link.textContent = part;
      link.setAttribute('aria-label', `Source ${match[1]}`);
      element.append(link);
    });
  }

  // The words for an answer come from its button ("Myth", "Fact", "It's complicated").
  function choiceLabel(card, choice) {
    const button = Array.from(card.querySelectorAll('.myth-fact-choice'))
      .find((b) => (b.dataset.choice || '').toLowerCase() === choice);
    return button ? button.textContent.trim() : choice;
  }

  // Only the face the student can see is reachable by keyboard / screen reader.
  function syncFaces(card) {
    const flipped = card.classList.contains('is-flipped');
    const front = card.querySelector('.myth-fact-front');
    const back = card.querySelector('.myth-fact-back');
    if (front) front.inert = flipped;
    if (back) back.inert = !flipped;
  }

  function showCard(index) {
    cards.forEach((card) => {
      const button = card.querySelector('.myth-fact-next');
      if (button) button.textContent = 'Next';
    });

    cards.forEach((card, cardIndex) => {
      const isActive = cardIndex === index;
      card.classList.toggle('is-active', isActive);
      if (!isActive) {
        card.classList.remove('is-flipped', 'is-correct', 'is-incorrect', 'is-shaking');
      }
    });

    const activeCard = cards[index];
    if (activeCard) {
      const activeNextButton = activeCard.querySelector('.myth-fact-next');
      if (activeNextButton) {
        activeNextButton.textContent = index === cards.length - 1 ? 'Reset' : 'Next';
      }
    }

    cards.forEach(syncFaces);
    currentIndex = index;
  }

  function focusFirstChoice() {
    const first = cards[currentIndex] && cards[currentIndex].querySelector('.myth-fact-choice');
    if (first) first.focus();
  }

  function resetQuiz() {
    cards.forEach((card) => {
      card.classList.remove('is-flipped', 'is-correct', 'is-incorrect', 'is-shaking');
    });
    showCard(0);
  }

  quizRoot.addEventListener('click', (event) => {
    const activeCard = cards[currentIndex];
    if (!activeCard) return;

    const nextButton = event.target.closest('.myth-fact-next');
    if (nextButton && activeCard.contains(nextButton) && activeCard.classList.contains('is-flipped')) {
      if (currentIndex < cards.length - 1) {
        showCard(currentIndex + 1);
      } else {
        resetQuiz();
      }
      focusFirstChoice();
      return;
    }

    const choiceButton = event.target.closest('.myth-fact-choice');
    if (!choiceButton || !activeCard.contains(choiceButton) || activeCard.classList.contains('is-flipped')) return;

    const selectedChoice = (choiceButton.dataset.choice || '').toLowerCase();
    const correctChoice = (activeCard.dataset.correct || '').toLowerCase();
    const explanation = activeCard.dataset.explanation || '';
    const resultElement = activeCard.querySelector('.myth-fact-result');
    const explanationElement = activeCard.querySelector('.myth-fact-explanation');
    const isCorrect = selectedChoice === correctChoice;

    if (resultElement) {
      const correctLabel = choiceLabel(activeCard, correctChoice);
      resultElement.textContent = isCorrect
        ? `✓ Correct: ${correctLabel}.`
        : `Incorrect. Correct answer: ${correctLabel}.`;
    }

    if (explanationElement) {
      renderWithCitations(explanationElement, explanation);
    }

    activeCard.classList.add('is-flipped');
    activeCard.classList.toggle('is-correct', isCorrect);
    activeCard.classList.toggle('is-incorrect', !isCorrect);
    syncFaces(activeCard);
    const next = activeCard.querySelector('.myth-fact-next');
    if (next) next.focus();

    if (!isCorrect) {
      activeCard.classList.add('is-shaking');
      activeCard.addEventListener(
        'animationend',
        () => {
          activeCard.classList.remove('is-shaking');
        },
        { once: true }
      );
    }
  });

  showCard(0);
});
