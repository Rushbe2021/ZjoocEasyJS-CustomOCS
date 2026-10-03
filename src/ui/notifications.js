import settings from '../core/settings.js';

export function displaySuccessNotification(heading, prompt) {
    if (settings.examMode) {
        return;
    }
    const notificationContainer = document.createElement('div');
    notificationContainer.className = 'notifications-container';

    notificationContainer.innerHTML = `
      <div class="success">
          <div class="flex">
              <div class="flex-shrink-0">
                  <svg class="succes-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                  </svg>
              </div>
              <div class="success-prompt-wrap">
                  <p class="success-prompt-heading">${heading}</p>
                  <div class="success-prompt-prompt">${prompt}</div>
              </div>
          </div>
      </div>
      `;

    const style = document.createElement('style');
    style.textContent = `
      .notifications-container {
          width: 320px;
          height: auto;
          font-size: 0.875rem;
          line-height: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
      }

      .flex {
          display: flex;
      }

      .flex-shrink-0 {
          flex-shrink: 0;
      }

      .success {
          padding: 1rem;
          border-radius: 0.375rem;
          background-color: rgb(240 253 244);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }

      .succes-svg {
          color: rgb(74 222 128);
          width: 1.25rem;
          height: 1.25rem;
      }

      .success-prompt-wrap {
          margin-left: 0.75rem;
      }

      .success-prompt-heading {
          font-weight: bold;
          color: rgb(22 101 52);
      }

      .success-prompt-prompt {
          margin-top: 0.5rem;
          color: rgb(21 128 61);
      }
      `;

    document.head.appendChild(style);
    document.body.appendChild(notificationContainer);

    setTimeout(() => {
        notificationContainer.remove();
    }, 3000);
}

export function displayErrorNotification(heading, details) {
    if (settings.examMode) {
        return;
    }
    const notificationContainer = document.createElement('div');
    notificationContainer.className = 'notifications-container';

    notificationContainer.innerHTML = `
  <div class="error-alert">
      <div class="flex">
          <div class="flex-shrink-0">
              <svg class="error-svg" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path clip-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" fill-rule="evenodd"></path>
              </svg>
          </div>
          <div class="error-prompt-container">
              <p class="error-prompt-heading">${heading}</p>
              <div class="error-prompt-wrap">
                  <ul class="error-prompt-list" role="list">
                      ${details.map(item => `<li>${item}</li>`).join('')}
                  </ul>
              </div>
          </div>
      </div>
  </div>
  `;

    notificationContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      opacity: 0;
      animation: fadeIn 0.5s forwards, fadeOut 0.5s forwards 3s;
  `;

    document.body.appendChild(notificationContainer);

    const style = document.createElement('style');
    style.textContent = `
  .notifications-container {
      width: 320px;
      height: auto;
      font-size: 0.875rem;
      line-height: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
  }

  .flex {
      display: flex;
  }

  .flex-shrink-0 {
      flex-shrink: 0;
  }

  .error-alert {
      border-radius: 0.375rem;
      padding: 1rem;
      background-color: rgb(254 242 242);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .error-svg {
      color: #F87171;
      width: 1.25rem;
      height: 1.25rem;
  }

  .error-prompt-heading {
      color: #991B1B;
      font-size: 0.875rem;
      line-height: 1.25rem;
      font-weight: bold;
  }

  .error-prompt-container {
      display: flex;
      flex-direction: column;
      margin-left: 1.25rem;
  }

  .error-prompt-wrap {
      margin-top: 0.5rem;
      color: #B91C1C;
      font-size: 0.875rem;
      line-height: 1.25rem;
  }

  .error-prompt-list {
      padding-left: 1.25rem;
      margin-top: 0.25rem;
      list-style-type: disc;
  }

  @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeOut {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-20px); }
  }
  `;
    if (!document.head.querySelector('#error-notification-styles')) {
        style.id = 'error-notification-styles';
        document.head.appendChild(style);
    }

    setTimeout(() => {
        notificationContainer.remove();
    }, 3000);
}
