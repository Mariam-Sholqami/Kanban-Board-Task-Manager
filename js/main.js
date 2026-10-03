const addTaskBtn = document.getElementById("addTaskBtn");
const todoList = document.getElementById("todoList");
const progressList = document.getElementById("progressList");
const completedList = document.getElementById("completedList");
const todoCount = document.getElementById("todoCount");
const progressCount = document.getElementById("progressCount");
const completedCount = document.getElementById("completedCount");
const todoEmpty = document.getElementById("todoEmpty");
const progressEmpty = document.getElementById("progressEmpty");
const completedEmpty = document.getElementById("completedEmpty");
const taskModalEl = document.getElementById("taskModal");
const taskModalLabel = document.getElementById("taskModalLabel");
const taskForm = document.getElementById("taskForm");
const taskTitleInput = document.getElementById("taskTitle");
const taskPriorityInput = document.getElementById("taskPriority");
const taskDueDateInput = document.getElementById("taskDueDate");
const taskDescriptionInput = document.getElementById("taskDescription");
const descCount = document.getElementById("descCount");
const titleError = document.getElementById("titleError");
const dueDateError = document.getElementById("dueDateError");
const appToast = document.getElementById("appToast");
const appToastMessage = document.getElementById("appToastMessage");
const saveTaskBtn = document.getElementById("saveTaskBtn");
const updateTaskBtn = document.getElementById("updateTaskBtn");
/*******  local storage  *******/
function getTasks() {
    return JSON.parse(localStorage.getItem("kanbanTasks") || "[]");
}
function saveTasks(tasks) {
    localStorage.setItem("kanbanTasks", JSON.stringify(tasks));
}
/******* date *******/
function getDateString(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
}
function formatDate(dateString) {
    const dateObj = new Date(dateString + "T00:00:00");
    return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function isDueSoon(dueDate) {
    if (!dueDate) {
        return false;
    }
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return dueDate === getDateString(today) ||
        dueDate === getDateString(tomorrow);
}
function getTimeAgo(createdAt) {
    const diffMinutes = Math.floor((Date.now() - createdAt) / 60000);
    if (diffMinutes < 1) {
        return "Just now";
    }
    else if (diffMinutes < 60) {
        return diffMinutes + "m ago";
    }
    else if (diffMinutes < 1440) {
        const diffHours = Math.floor(diffMinutes / 60);
        return diffHours + "h ago";
    }
    else {
        const diffDays = Math.floor(diffMinutes / 1440);
        return diffDays + "d ago";
    }
}
/******* task card *******/
function buildTaskCard(task, index) {
    let dotClass = "dot-neutral";
    if (task.status === "progress") {
        dotClass = "dot-progress";
    }
    else if (task.status === "completed") {
        dotClass = "dot-completed";
    }
    let titleClass = "task-title";
    let doneBadge = "";
    if (task.status === "completed") {
        titleClass = "task-title task-title-done";
        doneBadge = `<span class="badge-done"><i class="fa-solid fa-check"></i>DONE</span>`;
    }
    let descHtml = "";
    if (task.description) {
        descHtml = `<p class="task-desc">${task.description}</p>`;
    }
    let dueDateHtml = "";
    if (task.dueDate) {
        dueDateHtml = `<span><i class="fa-regular fa-calendar"></i>${formatDate(task.dueDate)}</span>`;
    }
    let dueBadge = "";
    if (task.status !== "completed" && isDueSoon(task.dueDate)) {
        dueBadge = `<span class="badge-due">DUE SOON</span>`;
    }
    let priorityBadge = "";
    if (task.priority === "low") {
        priorityBadge = `<span class="badge-priority badge-low">LOW</span>`;
    }
    else if (task.priority === "medium") {
        priorityBadge = `<span class="badge-priority badge-medium">MEDIUM</span>`;
    }
    else {
        priorityBadge = `<span class="badge-priority badge-high">HIGH PRIORITY</span>`;
    }
    let actionButtons = "";
    if (task.status === "todo") {
        actionButtons = `<button onclick="startTask(${index})" class="btn-task btn-start"><i class="fa-solid fa-play"></i>Start</button>
                <button onclick="completeTask(${index})" class="btn-task btn-complete"><i class="fa-solid fa-check"></i>Complete</button>`;
    }
    else if (task.status === "progress") {
        actionButtons = `<button onclick="revertTask(${index})" class="btn-task btn-todo"><i class="fa-solid fa-rotate-left"></i>To Do</button>
                <button onclick="completeTask(${index})" class="btn-task btn-complete"><i class="fa-solid fa-check"></i>Complete</button>`;
    }
    else {
        actionButtons = `<button onclick="revertTask(${index})" class="btn-task btn-todo"><i class="fa-solid fa-rotate-left"></i>To Do</button>
                <button onclick="startTask(${index})" class="btn-task btn-start"><i class="fa-solid fa-play"></i>Start</button>`;
    }
    return `<div class="task-card" data-status="${task.status}" data-priority="${task.priority}">
                <div class="card-hover-actions">
                    <button onclick="editTask(${index})" class="icon-btn btn-edit" title="Edit" data-bs-toggle="modal" data-bs-target="#taskModal"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="deleteTask(${index})" class="icon-btn btn-delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="task-id">
                    <span class="status-dot ${dotClass}"></span>#${String(index + 1).padStart(3, "0")}
                </div>
                <h3 class="${titleClass}">${task.title}</h3>
                ${descHtml}
                <div class="badge-row">
                    ${priorityBadge}
                    ${dueBadge}
                    ${doneBadge}
                </div>
                <div class="task-meta">
                    ${dueDateHtml}
                    <span><i class="fa-regular fa-clock"></i>${getTimeAgo(task.createdAt)}</span>
                </div>
                <div class="task-actions">
                    ${actionButtons}
                </div>
            </div>`;
}
/*******  display  *******/
function displayTasks() {
    const tasks = getTasks();
    let todoTotal = 0;
    let progressTotal = 0;
    let completedTotal = 0;
    todoList.innerHTML = "";
    progressList.innerHTML = "";
    completedList.innerHTML = "";
    for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const cardHtml = buildTaskCard(task, i);
        if (task.status === "todo") {
            todoTotal++;
            todoList.innerHTML += cardHtml;
        }
        else if (task.status === "progress") {
            progressTotal++;
            progressList.innerHTML += cardHtml;
        }
        else {
            completedTotal++;
            completedList.innerHTML += cardHtml;
        }
    }
    if (todoTotal === 0) {
        todoEmpty.classList.remove("d-none");
    }
    else {
        todoEmpty.classList.add("d-none");
    }
    if (progressTotal === 0) {
        progressEmpty.classList.remove("d-none");
    }
    else {
        progressEmpty.classList.add("d-none");
    }
    if (completedTotal === 0) {
        completedEmpty.classList.remove("d-none");
    }
    else {
        completedEmpty.classList.add("d-none");
    }
    todoCount.textContent = todoTotal + " tasks";
    progressCount.textContent = progressTotal + " tasks";
    completedCount.textContent = completedTotal + " tasks";
}
/******* move / delete  *******/
function moveTask(index, newStatus) {
    const tasks = getTasks();
    tasks[index].status = newStatus;
    saveTasks(tasks);
    displayTasks();
}
function startTask(index) {
    moveTask(index, "progress");
}
function completeTask(index) {
    moveTask(index, "completed");
}
function revertTask(index) {
    moveTask(index, "todo");
}
function deleteTask(index) {
    const tasks = getTasks();
    tasks.splice(index, 1);
    saveTasks(tasks);
    displayTasks();
}
/******* toast *******/
function showToast(message) {
    appToastMessage.textContent = message;
    appToast.classList.remove("d-none");
    setTimeout(function () {
        appToast.classList.add("d-none");
    }, 2500);
}
/******* form *******/
let editingIndex = null;
function clearFieldErrors() {
    titleError.classList.add("d-none");
    taskTitleInput.classList.remove("input-error");
    dueDateError.classList.add("d-none");
    taskDueDateInput.classList.remove("input-error");
}
function resetForm() {
    taskForm.reset();
    descCount.textContent = "0";
    clearFieldErrors();
}
function toggleModalMode(mode) {
    if (mode === "add") {
        taskModalLabel.textContent = "Create New Task";
        saveTaskBtn.classList.remove("d-none");
        updateTaskBtn.classList.add("d-none");
    }
    else {
        taskModalLabel.textContent = "Edit Task";
        saveTaskBtn.classList.add("d-none");
        updateTaskBtn.classList.remove("d-none");
    }
}
function validateForm() {
    let isValid = true;
    const title = taskTitleInput.value.trim();
    if (title.length < 3) {
        titleError.textContent = "Title must be at least 3 characters";
        titleError.classList.remove("d-none");
        taskTitleInput.classList.add("input-error");
        isValid = false;
    }
    else {
        titleError.classList.add("d-none");
        taskTitleInput.classList.remove("input-error");
    }
    const todayStr = getDateString(new Date());
    if (taskDueDateInput.value && taskDueDateInput.value < todayStr) {
        dueDateError.textContent = "Due date cannot be in the past";
        dueDateError.classList.remove("d-none");
        taskDueDateInput.classList.add("input-error");
        isValid = false;
    }
    else {
        dueDateError.classList.add("d-none");
        taskDueDateInput.classList.remove("input-error");
    }
    return isValid;
}
function addTask() {
    if (!validateForm()) {
        return;
    }
    const tasks = getTasks();
    const newTask = {
        title: taskTitleInput.value.trim(),
        description: taskDescriptionInput.value.trim(),
        priority: taskPriorityInput.value,
        status: "todo",
        dueDate: taskDueDateInput.value,
        createdAt: Date.now()
    };
    tasks.push(newTask);
    saveTasks(tasks);
    displayTasks();
    resetForm();
    bootstrap.Modal.getInstance(taskModalEl)?.hide();
    showToast("Task added successfully!");
}
function editTask(index) {
    const tasks = getTasks();
    const task = tasks[index];
    taskTitleInput.value = task.title;
    taskPriorityInput.value = task.priority;
    taskDueDateInput.value = task.dueDate;
    taskDescriptionInput.value = task.description;
    descCount.textContent = task.description.length.toString();
    clearFieldErrors();
    editingIndex = index;
    toggleModalMode("edit");
}
function updateTask() {
    if (!validateForm()) {
        return;
    }
    if (editingIndex === null) {
        return;
    }
    const tasks = getTasks();
    tasks[editingIndex].title = taskTitleInput.value.trim();
    tasks[editingIndex].description = taskDescriptionInput.value.trim();
    tasks[editingIndex].priority = taskPriorityInput.value;
    tasks[editingIndex].dueDate = taskDueDateInput.value;
    saveTasks(tasks);
    displayTasks();
    resetForm();
    editingIndex = null;
    bootstrap.Modal.getInstance(taskModalEl)?.hide();
    showToast("Task updated successfully!");
}
/*******  init *******/
function init() {
    addTaskBtn.addEventListener("click", function () {
        resetForm();
        toggleModalMode("add");
        editingIndex = null;
    });
    saveTaskBtn.addEventListener("click", addTask);
    updateTaskBtn.addEventListener("click", updateTask);
    taskDescriptionInput.addEventListener("input", function () {
        descCount.textContent = taskDescriptionInput.value.length.toString();
    });
    taskTitleInput.addEventListener("input", function () {
        if (taskTitleInput.value.trim().length >= 3) {
            titleError.classList.add("d-none");
            taskTitleInput.classList.remove("input-error");
        }
    });
    taskDueDateInput.addEventListener("input", function () {
        const todayStr = getDateString(new Date());
        if (!taskDueDateInput.value || taskDueDateInput.value >= todayStr) {
            dueDateError.classList.add("d-none");
            taskDueDateInput.classList.remove("input-error");
        }
    });
    displayTasks();
}
init();
/******* expose functions for inline onclick handlers *******/
window.startTask = startTask;
window.completeTask = completeTask;
window.revertTask = revertTask;
window.editTask = editTask;
window.deleteTask = deleteTask;
export {};
