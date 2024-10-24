document.getElementById('send-button').addEventListener('click', () => {
    const userInput = document.getElementById('user-input').value;
    if (userInput.trim() !== '') {
        const messageContainer = document.createElement('div');
        messageContainer.classList.add('message');
        messageContainer.textContent = userInput;
        document.getElementById('chatbot-messages').appendChild(messageContainer);
        document.getElementById('user-input').value = '';  // Clear the input box
        toggleButton();  // Call to toggle back to mic after message is sent
    }
});

document.getElementById('generate-question').addEventListener('click', () => {
    alert('Generate Question button clicked!');
});

let fileUploaded = false;

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
        fileNameDisplay.textContent = `Uploaded file: ${file.name}`;
        fileNameDisplay.style.color = 'green';
        fileNameDisplay.style.marginTop = '10px';
        fileNameDisplay.id = 'file-name-display';

        const removeButton = document.createElement('button');
        removeButton.textContent = 'Remove File';
        removeButton.id = 'remove-file';
        removeButton.style.marginTop = '10px';

        leftSide.insertBefore(fileNameDisplay, fileInput.nextSibling);
        leftSide.insertBefore(removeButton, fileNameDisplay.nextSibling);

        fileUploaded = true;

        removeButton.addEventListener('click', () => {
            leftSide.removeChild(fileNameDisplay);
            leftSide.removeChild(removeButton);
            fileInput.value = '';
            fileUploaded = false;
        });
    }
});

// Toggle between mic and send button based on input field content
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

// Initially set the mic button
sendButton.innerHTML = '<i class="fa fa-microphone"></i>';  // Mic icon
sendButton.style.backgroundColor = '#007bff';  // Initial background color for mic

// Add input event listener to toggle between mic and send button
userInput.addEventListener('input', toggleButton);

function toggleButton() {
    if (userInput.value.trim() === '') {
        // Switch back to mic icon when input is empty
        sendButton.innerHTML = '<i class="fa fa-microphone"></i>';
        sendButton.style.backgroundColor = '#007bff';  // Mic color
    } else {
        // Change to send icon when input has text
        sendButton.innerHTML = '<i class="fa fa-paper-plane"></i>';
        sendButton.style.backgroundColor = '#28a745';  // Send color
    }
}
