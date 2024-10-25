const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

signUpButton.addEventListener('click', () => {
  container.classList.add('right-panel-active');
});

signInButton.addEventListener('click', () => {
  container.classList.remove('right-panel-active');
});

// Form Submission Logic
function submitSignup() {
  document.getElementById('formAction').value = 'signup';
  document.getElementById('authForm').submit();
}

function submitLogin() {
  document.getElementById('formAction').value = 'login';
  document.getElementById('authForm').submit();
}