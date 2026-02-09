/*
 * Task Tracker - Portfolio Project
 * Demonstrates: DOM Manipulation, Event Handling, Local Storage, CRUD Operations
 * Author: Richard Hawes
 * Date: 02/09/2026
 */

// ======================
// DOM ELEMENT SELECTORS
// ======================

const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const filterButtons = document.querySelectorAll('.filter-btn');
const totalTasksEl = document.getElementById('totalTasks');
const activeTasksEl = document.getElementById('activeTasks');
const completedTasksEl = document.getElementById('completedTasks');
const githubLink = document.getElementById('githubLink');
const linkedinLink = document.getElementById('linkedinLink');
const developerName = document.getElementById('developerName');

// ======================
// APPLICATION STATE
// ======================

let tasks = JSON.parse(localStorage.getItem('portfolioTasks')) || [];
let currentFilter = 'all';

// ======================
// INITIALIZATION
// ======================

developerName.textContent = 'Richard Hawes';
githubLink.href = 'https://github.com/yourusername';
linkedinLink.href = 'www.linkedin.com/in/richard-hawes-a4533399';

// Initialize the application
function init() {
    loadTasks();
    setupEventListeners();
    renderTasks();
    updateStats();
}

// ======================
// EVENT LISTENERS
// ======================

function setupEventListeners() {
    // Add task button click
    addTaskBtn.addEventListener('click', addTask);
    
    // Add task on Enter key
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    
    // Clear completed tasks
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    
    // Filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');
            setFilter(filter);
        });
    });
    
    // Focus input on page load
    taskInput.focus();
}

// ======================
// TASK MANAGEMENT
// ======================

function addTask() {
    const text = taskInput.value.trim();
    
    if (!text) {
        showMessage('Please enter a task!', 'error');
        taskInput.focus();
        return;
    }
    
    // Create new task object
    const newTask = {
        id: Date.now(), // Simple unique ID
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    // Add to beginning of array (newest first)
    tasks.unshift(newTask);
    
    // Update UI and storage
    saveTasks();
    renderTasks();
    updateStats();
    
    // Clear input and show success message
    taskInput.value = '';
    taskInput.focus();
    showMessage('Task added successfully!', 'success');
}

function deleteTask(id) {
    // Find task index
    const taskIndex = tasks.findIndex(task => task.id === id);
    
    if (taskIndex === -1) return;
    
    // Get task text for message
    const taskText = tasks[taskIndex].text;
    
    // Remove from array
    tasks.splice(taskIndex, 1);
    
    // Update UI and storage
    saveTasks();
    renderTasks();
    updateStats();
    
    showMessage(`"${taskText}" deleted`, 'info');
}

function editTask(id) {
    const task = tasks.find(task => task.id === id);
    if (!task) return;
    
    const newText = prompt('Edit your task:', task.text);
    
    if (newText !== null && newText.trim() !== '') {
        task.text = newText.trim();
        task.updatedAt = new Date().toISOString();
        
        saveTasks();
        renderTasks();
        showMessage('Task updated!', 'success');
    }
}

function toggleTaskCompletion(id) {
    const task = tasks.find(task => task.id === id);
    if (!task) return;
    
    task.completed = !task.completed;
    task.updatedAt = new Date().toISOString();
    
    saveTasks();
    renderTasks();
    updateStats();
    
    const status = task.completed ? 'completed' : 'marked as active';
    showMessage(`Task "${task.text}" ${status}`, 'info');
}

// ======================
// FILTERING
// ======================

function setFilter(filter) {
    currentFilter = filter;
    
    // Update active button
    filterButtons.forEach(button => {
        const isActive = button.getAttribute('data-filter') === filter;
        button.classList.toggle('active', isActive);
    });
    
    renderTasks();
}

function getFilteredTasks() {
    switch (currentFilter) {
        case 'active':
            return tasks.filter(task => !task.completed);
        case 'completed':
            return tasks.filter(task => task.completed);
        default:
            return tasks;
    }
}

// ======================
// RENDERING
// ======================

function renderTasks() {
    const filteredTasks = getFilteredTasks();
    
    // Clear current list
    taskList.innerHTML = '';
    
    // Show empty state if no tasks
    if (filteredTasks.length === 0) {
        const emptyState = document.createElement('li');
        emptyState.className = 'empty-state';
        
        let message = 'No tasks yet. Add your first task above!';
        if (currentFilter === 'active') message = 'No active tasks';
        if (currentFilter === 'completed') message = 'No completed tasks';
        
        emptyState.innerHTML = `
            <i class="fas fa-clipboard-list"></i>
            <p>${message}</p>
        `;
        
        taskList.appendChild(emptyState);
        return;
    }
    
    // Create task elements
    filteredTasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
        taskItem.setAttribute('data-id', task.id);
        
        // Format date for display
        const date = new Date(task.createdAt);
        const dateStr = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        
        taskItem.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text">${escapeHtml(task.text)}</span>
            <div class="task-actions">
                <span class="task-date">${dateStr}</span>
                <button class="action-btn edit-btn" title="Edit task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" title="Delete task">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        
        // Add event listeners
        const checkbox = taskItem.querySelector('.task-checkbox');
        const editBtn = taskItem.querySelector('.edit-btn');
        const deleteBtn = taskItem.querySelector('.delete-btn');
        
        checkbox.addEventListener('change', () => toggleTaskCompletion(task.id));
        editBtn.addEventListener('click', () => editTask(task.id));
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        
        // Make task draggable
        taskItem.setAttribute('draggable', 'true');
        taskItem.addEventListener('dragstart', handleDragStart);
        taskItem.addEventListener('dragover', handleDragOver);
        taskItem.addEventListener('drop', handleDrop);
        taskItem.addEventListener('dragend', handleDragEnd);
        
        taskList.appendChild(taskItem);
    });
}

// ======================
// DRAG & DROP
// ======================

let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    this.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    this.style.borderTop = '2px solid #4b6cb7';
    return false;
}

function handleDrop(e) {
    e.stopPropagation();
    
    if (draggedItem !== this) {
        // Get task IDs
        const draggedId = parseInt(draggedItem.getAttribute('data-id'));
        const targetId = parseInt(this.getAttribute('data-id'));
        
        // Find indices
        const draggedIndex = tasks.findIndex(t => t.id === draggedId);
        const targetIndex = tasks.findIndex(t => t.id === targetId);
        
        // Reorder array
        if (draggedIndex > -1 && targetIndex > -1) {
            const [movedTask] = tasks.splice(draggedIndex, 1);
            tasks.splice(targetIndex, 0, movedTask);
            
            saveTasks();
            renderTasks();
            showMessage('Tasks reordered!', 'success');
        }
    }
    
    this.style.borderTop = '';
    return false;
}

function handleDragEnd() {
    this.style.opacity = '1';
    const items = document.querySelectorAll('.task-item');
    items.forEach(item => {
        item.style.borderTop = '';
    });
}

// ======================
// STATISTICS
// ======================

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const active = total - completed;
    
    // Update DOM elements with animation
    animateNumber(totalTasksEl, total);
    animateNumber(activeTasksEl, active);
    animateNumber(completedTasksEl, completed);
}

function animateNumber(element, targetValue) {
    const currentValue = parseInt(element.textContent) || 0;
    const duration = 300; // ms
    const step = (targetValue - currentValue) / (duration / 16); // 60fps
    
    let current = currentValue;
    const timer = setInterval(() => {
        current += step;
        
        if ((step > 0 && current >= targetValue) || (step < 0 && current <= targetValue)) {
            current = targetValue;
            clearInterval(timer);
        }
        
        element.textContent = Math.round(current);
    }, 16);
    
    // Add pulse animation
    element.style.animation = 'none';
    setTimeout(() => {
        element.style.animation = 'pulse 0.5s ease';
    }, 10);
}

// ======================
// UTILITIES
// ======================

function saveTasks() {
    localStorage.setItem('portfolioTasks', JSON.stringify(tasks));
}

function loadTasks() {
    const saved = localStorage.getItem('portfolioTasks');
    if (saved) {
        try {
            tasks = JSON.parse(saved);
        } catch (e) {
            console.error('Error loading tasks:', e);
            tasks = [];
        }
    }
}

function showMessage(text, type = 'info') {
    // Remove existing message
    const existing = document.querySelector('.message');
    if (existing) existing.remove();
    
    // Create message element
    const message = document.createElement('div');
    message.className = `message message-${type}`;
    message.innerHTML = `
        <i class="fas fa-${getIconForType(type)}"></i>
        <span>${text}</span>
    `;
    
    // Add styles
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        background-color: ${getColorForType(type)};
    `;
    
    document.body.appendChild(message);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        message.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            if (message.parentNode) {
                message.parentNode.removeChild(message);
            }
        }, 300);
    }, 3000);
}

function getIconForType(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'info': return 'info-circle';
        default: return 'info-circle';
    }
}

function getColorForType(type) {
    switch (type) {
        case 'success': return '#4CAF50';
        case 'error': return '#f44336';
        case 'info': return '#2196F3';
        default: return '#666';
    }
}

function clearCompletedTasks() {
    const completedCount = tasks.filter(task => task.completed).length;
    
    if (completedCount === 0) {
        showMessage('No completed tasks to clear!', 'info');
        return;
    }
    
    if (confirm(`Clear ${completedCount} completed task${completedCount !== 1 ? 's' : ''}?`)) {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        updateStats();
        showMessage('Completed tasks cleared!', 'success');
    }
}

// Security: Prevent XSS attacks
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ======================
// INITIALIZE APP
// ======================

// Add fadeOut animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100px); }
    }
    
    .message {
        font-family: inherit;
    }
`;
document.head.appendChild(style);

// Start the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);