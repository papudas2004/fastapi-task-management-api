// State management
let tasks = [];
let activeFilter = 'all';
let searchQuery = '';

// DOM Elements
const tasksContainer = document.getElementById('tasks-container');
const createTaskForm = document.getElementById('create-task-form');
const titleInput = document.getElementById('task-title-input');
const descInput = document.getElementById('task-desc-input');

const statTotal = document.getElementById('stat-total');
const statPending = document.getElementById('stat-pending');
const statCompleted = document.getElementById('stat-completed');
const statRate = document.getElementById('stat-rate');
const statProgressBar = document.getElementById('stat-progress-bar');
const progressMeter = document.getElementById('progress-meter');

const searchInput = document.getElementById('search-input');
const filterTabs = document.querySelectorAll('.filter-tab');

const editDialog = document.getElementById('edit-dialog');
const editForm = document.getElementById('edit-task-form');
const editTaskId = document.getElementById('edit-task-id');
const editTaskTitle = document.getElementById('edit-task-title');
const editTaskDesc = document.getElementById('edit-task-desc');
const btnCloseEditModal = document.getElementById('btn-close-edit-modal');
const btnCancelEdit = document.getElementById('btn-cancel-edit');
const toastContainer = document.getElementById('toast-container');

// Toast Notification System
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>`;
  if (type === 'success') {
    icon = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>`;
  } else if (type === 'danger') {
    icon = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>`;
  }

  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

// Fetch all tasks from FastAPI
async function fetchTasks() {
  try {
    const res = await fetch('/tasks');
    if (!res.ok) throw new Error('Failed to load tasks');
    tasks = await res.json();
    render();
  } catch (err) {
    console.error(err);
    showToast('Failed to load tasks from server', 'danger');
  }
}

// Update dashboard statistics
function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

  statTotal.textContent = total;
  statPending.textContent = pending;
  statCompleted.textContent = completed;
  statRate.textContent = `${rate}%`;
  statProgressBar.style.width = `${rate}%`;
  progressMeter.setAttribute('aria-valuenow', rate);
}

// Render task list based on active filter and search query
function render() {
  updateStats();

  const filtered = tasks.filter(task => {
    // Filter by completion status
    if (activeFilter === 'pending' && task.completed) return false;
    if (activeFilter === 'completed' && !task.completed) return false;

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = (task.description || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    return true;
  });

  if (filtered.length === 0) {
    let emptyMsg = "No tasks yet. Create your first task above!";
    if (searchQuery.trim()) {
      emptyMsg = `No tasks matching "${searchQuery}".`;
    } else if (activeFilter === 'completed') {
      emptyMsg = "No completed tasks yet. Finish a task to see it here!";
    } else if (activeFilter === 'pending') {
      emptyMsg = "All caught up! No active tasks pending.";
    }

    tasksContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
        </div>
        <div class="empty-title">All Clean</div>
        <p class="empty-subtitle">${emptyMsg}</p>
      </div>
    `;
    return;
  }

  tasksContainer.innerHTML = filtered.map(task => `
    <article class="task-card ${task.completed ? 'completed' : ''}" id="task-card-${task.id}">
      <button 
        type="button" 
        class="task-check-btn" 
        onclick="toggleTaskComplete(${task.id})"
        aria-label="${task.completed ? 'Mark as incomplete' : 'Mark as complete'}"
      >
        <div class="checkbox-custom">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      </button>

      <div class="task-details">
        <div class="task-title-row">
          <span class="task-id-badge">#${task.id}</span>
          <span class="task-title">${escapeHtml(task.title)}</span>
        </div>
        ${task.description ? `<p class="task-desc">${escapeHtml(task.description)}</p>` : ''}
      </div>

      <div class="task-actions">
        <button 
          type="button" 
          class="icon-btn edit-btn" 
          onclick="openEditModal(${task.id})"
          title="Edit task"
          aria-label="Edit task #${task.id}"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
        <button 
          type="button" 
          class="icon-btn delete-btn" 
          onclick="deleteTask(${task.id})"
          title="Delete task"
          aria-label="Delete task #${task.id}"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    </article>
  `).join('');
}

// Utility: escape HTML strings
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Create Task
createTaskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const description = descInput.value.trim();

  if (!title) return;

  try {
    const res = await fetch('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        completed: false
      })
    });

    if (!res.ok) throw new Error('Failed to create task');

    const created = await res.json();
    tasks.push(created);
    titleInput.value = '';
    descInput.value = '';
    titleInput.focus();
    render();
    showToast(`Task #${created.id} created!`, 'success');
  } catch (err) {
    console.error(err);
    showToast('Failed to create task', 'danger');
  }
});

// Toggle Task Complete Status
async function toggleTaskComplete(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  const newStatus = !task.completed;

  try {
    const res = await fetch(`/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: task.title,
        description: task.description,
        completed: newStatus
      })
    });

    if (!res.ok) throw new Error('Failed to update task');

    const updated = await res.json();
    const index = tasks.findIndex(t => t.id === taskId);
    if (index !== -1) tasks[index] = updated;

    render();
    showToast(newStatus ? 'Task completed! 🎉' : 'Task reopened', 'info');
  } catch (err) {
    console.error(err);
    showToast('Could not update task status', 'danger');
  }
}

// Delete Task
async function deleteTask(taskId) {
  try {
    const res = await fetch(`/tasks/${taskId}`, {
      method: 'DELETE'
    });

    if (!res.ok) throw new Error('Failed to delete task');

    tasks = tasks.filter(t => t.id !== taskId);
    render();
    showToast(`Task #${taskId} deleted`, 'danger');
  } catch (err) {
    console.error(err);
    showToast('Failed to delete task', 'danger');
  }
}

// Edit Modal Handling
function openEditModal(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  editTaskId.value = task.id;
  editTaskTitle.value = task.title;
  editTaskDesc.value = task.description || '';
  editDialog.showModal();
}

function closeEditModal() {
  editDialog.close();
}

btnCloseEditModal.addEventListener('click', closeEditModal);
btnCancelEdit.addEventListener('click', closeEditModal);

// Close dialog when clicking on the backdrop
editDialog.addEventListener('click', (e) => {
  const rect = editDialog.getBoundingClientRect();
  const isInDialog = (
    rect.top <= e.clientY &&
    e.clientY <= rect.top + rect.height &&
    rect.left <= e.clientX &&
    e.clientX <= rect.left + rect.width
  );
  if (!isInDialog) {
    closeEditModal();
  }
});

editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = parseInt(editTaskId.value, 10);
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const updatedTitle = editTaskTitle.value.trim();
  const updatedDesc = editTaskDesc.value.trim();

  if (!updatedTitle) return;

  try {
    const res = await fetch(`/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: updatedTitle,
        description: updatedDesc,
        completed: task.completed
      })
    });

    if (!res.ok) throw new Error('Failed to update task');

    const updated = await res.json();
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) tasks[index] = updated;

    closeEditModal();
    render();
    showToast(`Task #${id} updated!`, 'success');
  } catch (err) {
    console.error(err);
    showToast('Failed to update task', 'danger');
  }
});

// Search input event
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  render();
});

// Filter tabs event
filterTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    filterTabs.forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    activeFilter = tab.dataset.filter;
    render();
  });
});

// Seed sample tasks if initially empty so user immediately sees a lively UI
async function seedInitialTasksIfEmpty() {
  if (tasks.length === 0) {
    const defaultTasks = [
      {
        title: "Welcome to Task Flow! 👋",
        description: "This is a full-featured task manager connected to your FastAPI backend without any database.",
        completed: true
      },
      {
        title: "Try creating a new task",
        description: "Type a title above and press 'Create Task' or tap Enter.",
        completed: false
      },
      {
        title: "Explore interactive Swagger API documentation",
        description: "Click the 'Docs' button in the top right header to see Swagger UI.",
        completed: false
      }
    ];

    for (const item of defaultTasks) {
      try {
        const res = await fetch('/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
        if (res.ok) {
          const created = await res.json();
          tasks.push(created);
        }
      } catch (e) {
        console.error('Initial seeding failed', e);
      }
    }
    render();
  }
}

// Initial load
(async () => {
  await fetchTasks();
  if (tasks.length === 0) {
    await seedInitialTasksIfEmpty();
  }
})();
