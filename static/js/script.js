document.addEventListener('DOMContentLoaded', function () {
    // DOM elements
    const newsForm = document.getElementById('news-form')
    const newsTitle = document.getElementById('news-title')
    const newsContent = document.getElementById('news-content')
    const resultsSection = document.getElementById('results-section')
    const closeResults = document.getElementById('close-results')
    const loadingOverlay = document.getElementById('loading-overlay')

    // Result elements
    const verdictValue = document.getElementById('verdict-value')
    const confidenceProgress = document.getElementById('confidence-progress')
    const confidenceValue = document.getElementById('confidence-value')
    const realProgress = document.getElementById('real-progress')
    const realValue = document.getElementById('real-value')
    const fakeProgress = document.getElementById('fake-progress')
    const fakeValue = document.getElementById('fake-value')
    const interpretation = document.getElementById('interpretation')

    // Form submission
    newsForm.addEventListener('submit', function (e) {
        e.preventDefault()

        // Show loading overlay
        loadingOverlay.style.display = 'flex'

        // Get form data
        const title = newsTitle.value.trim()
        const text = newsContent.value.trim()

        // Validate input
        if (!title || !text) {
            showError('Please fill in both the title and content fields.')
            return
        }

        // Send API request
        fetch('/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: title,
                text: text,
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                // Hide loading overlay
                loadingOverlay.style.display = 'none'

                if (data.status === 'success') {
                    displayResults(data)
                } else {
                    showError(
                        data.error || 'An error occurred during analysis.'
                    )
                }
            })
            .catch((error) => {
                // Hide loading overlay
                loadingOverlay.style.display = 'none'
                showError('Failed to connect to the server. Please try again.')
                console.error('Error:', error)
            })
    })

    // Close results button
    closeResults.addEventListener('click', function () {
        resultsSection.classList.add('hidden')
    })

    // Display results function
    function displayResults(data) {
        // Update verdict
        verdictValue.textContent = data.prediction
        verdictValue.className = 'verdict'
        verdictValue.classList.add(data.prediction.toLowerCase())

        // Update confidence bar
        confidenceProgress.style.width = `${data.confidence}%`
        confidenceValue.textContent = `${data.confidence}%`

        // Update probability bars
        realProgress.style.width = `${data.real_probability}%`
        realValue.textContent = `${data.real_probability}%`

        fakeProgress.style.width = `${data.fake_probability}%`
        fakeValue.textContent = `${data.fake_probability}%`

        // Set interpretation text
        let interpretationText = ''
        if (data.prediction === 'Real') {
            if (data.confidence >= 90) {
                interpretationText =
                    'This news appears to be highly reliable and from a legitimate source.'
            } else if (data.confidence >= 75) {
                interpretationText =
                    'This news is likely legitimate, but you may want to verify from another source.'
            } else {
                interpretationText =
                    'While classified as real, this news has some characteristics of fake news. Consider checking additional sources.'
            }
        } else {
            if (data.confidence >= 90) {
                interpretationText =
                    'This news is highly likely to be fake or misleading. Be very skeptical of its claims.'
            } else if (data.confidence >= 75) {
                interpretationText =
                    'This news shows significant signs of being fake. Verify from credible sources before believing.'
            } else {
                interpretationText =
                    'There are some signs this might be fake news, but further verification is recommended.'
            }
        }

        interpretation.innerHTML = `<i class="fas fa-info-circle"></i><span>${interpretationText}</span>`

        // Show results section with animation
        resultsSection.classList.remove('hidden')

        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth' })
    }

    // Show error message
    function showError(message) {
        loadingOverlay.style.display = 'none'

        // Show results section with error
        verdictValue.textContent = 'Error'
        verdictValue.className = 'verdict'

        confidenceProgress.style.width = '0%'
        confidenceValue.textContent = '0%'

        realProgress.style.width = '0%'
        realValue.textContent = '0%'

        fakeProgress.style.width = '0%'
        fakeValue.textContent = '0%'

        interpretation.innerHTML = `<i class="fas fa-exclamation-triangle" style="color:var(--danger-color)"></i><span>${message}</span>`

        resultsSection.classList.remove('hidden')
    }

    // Add animation effects to form inputs
    const inputs = document.querySelectorAll('input, textarea')
    inputs.forEach((input) => {
        input.addEventListener('focus', function () {
            this.parentElement.classList.add('focused')
        })

        input.addEventListener('blur', function () {
            this.parentElement.classList.remove('focused')
        })
    })
})
