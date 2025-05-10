// Validation utility functions
const validation = {
    // Player name validation
    validatePlayerName: (name) => {
        if (!name || name.trim() === '') {
            return {
                isValid: false,
                message: 'Player name is required'
            };
        }
        
        if (name.length < 2) {
            return {
                isValid: false,
                message: 'Player name must be at least 2 characters long'
            };
        }
        
        if (name.length > 50) {
            return {
                isValid: false,
                message: 'Player name must not exceed 50 characters'
            };
        }
        
        if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
            return {
                isValid: false,
                message: 'Player name can only contain letters, numbers, spaces, hyphens, and underscores'
            };
        }
        
        return {
            isValid: true,
            message: ''
        };
    },

    // Show validation message
    showValidationMessage: (inputElement, message, isValid) => {
        // Remove any existing validation message
        const existingMessage = inputElement.parentElement.querySelector('.validation-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Remove any existing validation classes
        inputElement.classList.remove('is-invalid', 'is-valid');

        if (message) {
            // Create and append validation message
            const messageElement = document.createElement('div');
            messageElement.className = `validation-message ${isValid ? 'valid' : 'invalid'}`;
            messageElement.textContent = message;
            inputElement.parentElement.appendChild(messageElement);

            // Add appropriate class to input
            inputElement.classList.add(isValid ? 'is-valid' : 'is-invalid');
        }
    },

    // Validate input on change
    setupValidation: (inputElement, validationFunction) => {
        inputElement.addEventListener('input', () => {
            const result = validationFunction(inputElement.value);
            validation.showValidationMessage(inputElement, result.message, result.isValid);
        });

        inputElement.addEventListener('blur', () => {
            const result = validationFunction(inputElement.value);
            validation.showValidationMessage(inputElement, result.message, result.isValid);
        });
    }
}; 