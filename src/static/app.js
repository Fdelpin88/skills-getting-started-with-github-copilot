document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Helper: obtener iniciales desde nombre o email
  function getInitials(text) {
    if (!text) return "";
    const local = text.split("@")[0].replace(/[\._\-]+/g, " ");
    const parts = local.split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity selector to avoid duplicated options on refresh
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants HTML with a delete button for each participant
        const participantsHtml = details.participants && details.participants.length
          ? details.participants
              .map((p) => `
                <li class="participant-item">
                  <span class="avatar">${getInitials(p)}</span>
                  <span class="participant-email">${p}</span>
                  <button class="delete-btn" data-email="${p}" aria-label="Remove participant">✖</button>
                </li>`)
              .join("")
          : `<li class="no-participants">No participants yet</li>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants">
            <h5>Participants</h5>
            <ul class="participants-list">
              ${participantsHtml}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Attach delete handlers for each participant in this activity
        activityCard.querySelectorAll('.delete-btn').forEach((btn) => {
          btn.addEventListener('click', async () => {
            const email = btn.dataset.email;
            try {
              const resp = await fetch(
                `/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(email)}`,
                { method: 'DELETE' }
              );
              const result = await resp.json();

              if (resp.ok) {
                messageDiv.textContent = result.message;
                messageDiv.className = 'success';
                // Refresh list
                fetchActivities();
              } else {
                messageDiv.textContent = result.detail || 'An error occurred';
                messageDiv.className = 'error';
              }
              messageDiv.classList.remove('hidden');
              setTimeout(() => messageDiv.classList.add('hidden'), 5000);
            } catch (error) {
              messageDiv.textContent = 'Failed to remove participant.';
              messageDiv.className = 'error';
              messageDiv.classList.remove('hidden');
              setTimeout(() => messageDiv.classList.add('hidden'), 5000);
              console.error('Error removing participant:', error);
            }
          });
        });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
          // Refresh activities so the new participant appears immediately
          fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
