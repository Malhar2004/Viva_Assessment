let currentQuestionIndex = 0;
let qaPairs = [];  // Store questions and answers fetched from the backend
let fileUploaded = false;
let totalScore = 0;  // Initialize total score variable
const maxQuestions = 10; // Define the maximum number of questions

// Get the CSRF token from the meta tag
const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');

// Initialize SpeechRecognition
let recognition;
if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = false;  // Stop automatically after a result
    recognition.interimResults = false;  // Only final results

    // Event listeners for recognition
    recognition.onstart = () => {
        console.log('Voice recognition started. Speak into the microphone.');
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('You said:', transcript);
        handleUserInputWithText(transcript); // Handle the recognized text
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        alert('Speech recognition error, please try again.');
    };

    recognition.onend = () => {
        console.log('Voice recognition ended.');
        toggleButton(); // Reset the button state after recognition ends
    };
} else {
    console.warn('Speech recognition not supported in this browser.');
}

// Event listener for 'Generate Question' button
const generateButton = document.getElementById('generate-question');
generateButton.addEventListener('click', fetchNextQuestion);

// Fetch the next question from the backend
function fetchNextQuestion() {
    fetch('/rag/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken  // Add CSRF token to the request header
        },
        body: JSON.stringify({ action: 'next_question', current_index: currentQuestionIndex })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            const question = data.question;
            console.log(question);
            qaPairs.push({ question: question, answer: null });
            displayQuestionInChat(question);
            waitForUserResponse();
            generateButton.textContent = 'Next Question'; // Change button text
        } else {
            alert('No more questions to send or an error occurred.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Display question from the bot in the chat container
function displayQuestionInChat(question) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('bot-message');
    messageContainer.textContent = question;
    document.getElementById('chatbot-messages').appendChild(messageContainer);
    document.getElementById('chatbot-messages').scrollTop = document.getElementById('chatbot-messages').scrollHeight;
}

// Wait for user response and handle the send button click
function waitForUserResponse() {
    const sendButton = document.getElementById('send-button');
    const userInput = document.getElementById('user-input');

    sendButton.addEventListener('click', () => {
        if (userInput.value.trim() !== '') {
            handleUserInput();
        } else {
            startVoiceRecognition(); // Start voice recognition if input is empty
        }
    }, { once: true });

    userInput.addEventListener('input', function() {
        toggleButton();  // Update button display on input change
    });

    userInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            handleUserInput();
            event.preventDefault();
        }
    });
}

// Handle user input and send it for comparison
function handleUserInput() {
    const userInput = document.getElementById('user-input').value;
    if (userInput.trim() !== '') {
        qaPairs[currentQuestionIndex].answer = userInput;
        displayResponseInChat(userInput);
        sendUserResponse(userInput);
        document.getElementById('user-input').value = '';  // Clear the input box
        toggleButton();  // Call to toggle back to mic after message is sent
    }
}

// Handle user input from voice recognition
function handleUserInputWithText(text) {
    qaPairs[currentQuestionIndex].answer = text;
    displayResponseInChat(text);
    sendUserResponse(text);
}

// Display user response in the chat container
function displayResponseInChat(response) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('user-message');
    messageContainer.textContent = `You: ${response}`;
    document.getElementById('chatbot-messages').appendChild(messageContainer);
    document.getElementById('chatbot-messages').scrollTop = document.getElementById('chatbot-messages').scrollHeight;
}

// Send the user's response to the backend for comparison
function sendUserResponse(response) {
    fetch('/rag/compare/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken  // Add CSRF token to the request header
        },
        body: JSON.stringify({
            action: 'compare_response',
            user_response: response,
            question_index: currentQuestionIndex
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            totalScore += data.score;  // Add the score (if correct) to the total score
            updateScore(totalScore);  // Update score display
            currentQuestionIndex += 1; // Move to the next question
            if (currentQuestionIndex < maxQuestions) {
                fetchNextQuestion();  // Fetch the next question if more are available
            } else {
                alert('All questions completed!'); // Show final alert when done
            }
        } else {
            console.log('Incorrect answer. Moving to the next question.'); // Debugging line
            currentQuestionIndex += 1; // Increment the question index
            if (currentQuestionIndex < maxQuestions) {
                fetchNextQuestion();  // Fetch the next question
            } else {
                alert('All questions completed!'); // Show final alert when done
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Function to update the score display
function updateScore(newScore) {
    const scoreDisplay = document.getElementById('score-display');
    scoreDisplay.textContent = `Score: ${newScore}`; // Fixed template literal
}

// Handle file upload and save it to Django's backend
document.getElementById('file-upload').addEventListener('change', () => {
    const fileInput = document.getElementById('file-upload');
    const leftSide = document.querySelector('.left-side');

    if (fileUploaded) {
        alert('You can only upload one file at a time. Remove the existing file to upload a new one.');
        fileInput.value = '';  // Reset file input
        return;
    }

    const file = fileInput.files[0];
    if (file) {
        const fileNameDisplay = document.createElement('p');
        fileNameDisplay.textContent = `Uploaded file: ${file.name}`; // Fixed template literal
        fileNameDisplay.style.color = 'green';
        fileNameDisplay.style.marginTop = '10px';
        fileNameDisplay.id = 'file-name-display';

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove File';
        removeButton.id = 'remove-file';
        removeButton.style.marginTop = '10px';

        leftSide.insertBefore(fileNameDisplay, fileInput.nextSibling);
        leftSide.insertBefore(removeButton, fileNameDisplay.nextSibling);

        removeButton.addEventListener('click', () => {
            leftSide.removeChild(fileNameDisplay);
            leftSide.removeChild(removeButton);
            fileUploaded = false;  // Reset the upload status
            fileInput.value = '';  // Reset file input
        });

        const formData = new FormData();
        formData.append('file', file);

        fetch('/upload/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': csrfToken  // Include CSRF token
            }
        })
        .then(response => {
            if (response.ok) {
                fileUploaded = true; // Set the flag to true
                alert('File uploaded successfully!');
                console.log('File uploaded successfully');
            } else {
                throw new Error('File upload failed.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error uploading file. Please try again.');
        });
    }
});

// Function to toggle the button between 'Send' and 'Mic'
function toggleButton() {
    const sendButton = document.getElementById('send-button');
    const micButton = document.getElementById('mic-button');
    const userInput = document.getElementById('user-input');

    // Defensive checks to ensure elements exist
    if (!sendButton || !micButton || !userInput) {
        console.error('One or more buttons or the input field do not exist in the DOM.');
        return;
    }

    if (userInput.value.trim() === '') {
        micButton.style.display = 'block';  // Show mic button
        sendButton.style.display = 'none';  // Hide send button
    } else {
        micButton.style.display = 'none';  // Hide mic button
        sendButton.style.display = 'block';  // Show send button
    }
}

// Handle mic button click to start recognition
document.getElementById('mic-button').addEventListener('click', () => {
    toggleButton(); // Call to toggle button states
    recognition.start(); // Start voice recognition when mic is clicked
});

// Call toggleButton initially to set the correct button state when the page loads
document.addEventListener('DOMContentLoaded', (event) => {
    toggleButton(); // Set initial button states
});
