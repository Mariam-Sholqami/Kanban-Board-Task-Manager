export {};

declare const bootstrap: any;

const addTaskBtn = document.getElementById("addTaskBtn") as HTMLElement;

const todoList = document.getElementById("todoList") as HTMLElement;
const progressList = document.getElementById("progressList") as HTMLElement;
const completedList = document.getElementById("completedList") as HTMLElement;

const todoCount = document.getElementById("todoCount") as HTMLElement;
const progressCount = document.getElementById("progressCount") as HTMLElement;
const completedCount = document.getElementById("completedCount") as HTMLElement;

const todoEmpty = document.getElementById("todoEmpty") as HTMLElement;
const progressEmpty = document.getElementById("progressEmpty") as HTMLElement;
const completedEmpty = document.getElementById("completedEmpty") as HTMLElement;


const taskModalEl = document.getElementById("taskModal") as HTMLElement;
const taskModalLabel = document.getElementById("taskModalLabel") as HTMLElement;

const taskForm = document.getElementById("taskForm") as HTMLFormElement;
const taskTitleInput = document.getElementById("taskTitle") as HTMLInputElement;
const taskPriorityInput = document.getElementById("taskPriority") as HTMLSelectElement;
const taskDueDateInput = document.getElementById("taskDueDate") as HTMLInputElement;
const taskDescriptionInput = document.getElementById("taskDescription") as HTMLTextAreaElement;

const descCount = document.getElementById("descCount") as HTMLElement;
const titleError = document.getElementById("titleError") as HTMLElement;
const dueDateError = document.getElementById("dueDateError") as HTMLElement;

const appToast = document.getElementById("appToast") as HTMLElement;
const appToastMessage = document.getElementById("appToastMessage") as HTMLElement;

const saveTaskBtn = document.getElementById("saveTaskBtn") as HTMLElement;
const updateTaskBtn = document.getElementById("updateTaskBtn") as HTMLElement;


/******* task type *******/
interface Task {
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
    status: "todo" | "progress" | "completed";
    dueDate: string;
    createdAt: number;
}


/*******  local storage  *******/
function getTasks(): Task[] {
    return JSON.parse(localStorage.getItem("kanbanTasks") || "[]");
}

function saveTasks(tasks: Task[]) {
    localStorage.setItem("kanbanTasks", JSON.stringify(tasks));
}

/******* date *******/
function getDateString(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return year + "-" + month + "-" + day;
}

function formatDate(dateString: string): string {
    const dateObj = new Date(dateString + "T00:00:00");

    return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isDueSoon(dueDate: string): boolean {
    if (!dueDate) {
        return false;
    }

    const today = new Date();
    const tomorrow = new Date();

    tomorrow.setDate(tomorrow.getDate() + 1);

    return dueDate === getDateString(today) ||
           dueDate === getDateString(tomorrow);
}

function getTimeAgo(createdAt: number): string {
    const diffMinutes = Math.floor((Date.now() - createdAt) / 60000);

    if (diffMinutes < 1) {
        return "Just now";
    } else if (diffMinutes < 60) {
        return diffMinutes + "m ago";
    } else if (diffMinutes < 1440) {
        const diffHours = Math.floor(diffMinutes / 60);
        return diffHours + "h ago";
    } else {
        const diffDays = Math.floor(diffMinutes / 1440);
        return diffDays + "d ago";
    }
}


/******* task card *******/
function buildTaskCard(task: Task, index: number): string {
    let dotClass = "dot-neutral";
    if (task.status === "progress") {
        dotClass = "dot-progress";
    } else if (task.status === "completed") {
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
    } else if (task.priority === "medium") {
        priorityBadge = `<span class="badge-priority badge-medium">MEDIUM</span>`;
    } else {
        priorityBadge = `<span class="badge-priority badge-high">HIGH PRIORITY</span>`;
    }

    let actionButtons = "";
    if (task.status === "todo") {
        actionButtons = `<button onclick="startTask(${index})" class="btn-task btn-start"><i class="fa-solid fa-play"></i>Start</button>
                <button onclick="completeTask(${index})" class="btn-task btn-complete"><i class="fa-solid fa-check"></i>Complete</button>`;
    } else if (task.status === "progress") {
        actionButtons = `<button onclick="revertTask(${index})" class="btn-task btn-todo"><i class="fa-solid fa-rotate-left"></i>To Do</button>
                <button onclick="completeTask(${index})" class="btn-task btn-complete"><i class="fa-solid fa-check"></i>Complete</button>`;
    } else {
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
        } else if (task.status === "progress") {
            progressTotal++;
            progressList.innerHTML += cardHtml;
        } else {
            completedTotal++;
            completedList.innerHTML += cardHtml;
        }
    }

    if (todoTotal === 0) {
        todoEmpty.classList.remove("d-none");
    } else {
        todoEmpty.classList.add("d-none");
    }

    if (progressTotal === 0) {
        progressEmpty.classList.remove("d-none");
    } else {
        progressEmpty.classList.add("d-none");
    }

    if (completedTotal === 0) {
        completedEmpty.classList.remove("d-none");
    } else {
        completedEmpty.classList.add("d-none");
    }

    todoCount.textContent = todoTotal + " tasks";
    progressCount.textContent = progressTotal + " tasks";
    completedCount.textContent = completedTotal + " tasks";
}


/******* move / delete  *******/
function moveTask(index: number, newStatus: "todo" | "progress" | "completed") {
    const tasks = getTasks();
    tasks[index].status = newStatus;
    saveTasks(tasks);
    displayTasks();
}

function startTask(index: number) {
    moveTask(index, "progress");
}

function completeTask(index: number) {
    moveTask(index, "completed");
}

function revertTask(index: number) {
    moveTask(index, "todo");
}

function deleteTask(index: number) {
    const tasks = getTasks();
    tasks.splice(index, 1);
    saveTasks(tasks);
    displayTasks();
}


/******* toast *******/
function showToast(message: string) {
    appToastMessage.textContent = message;
    appToast.classList.remove("d-none");

    setTimeout(function () {
        appToast.classList.add("d-none");
    }, 2500);
}


/******* form *******/
let editingIndex: number | null = null;

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

function toggleModalMode(mode: "add" | "edit") {
    if (mode === "add") {
        taskModalLabel.textContent = "Create New Task";
        saveTaskBtn.classList.remove("d-none");
        updateTaskBtn.classList.add("d-none");
    } else {
        taskModalLabel.textContent = "Edit Task";
        saveTaskBtn.classList.add("d-none");
        updateTaskBtn.classList.remove("d-none");
    }
}

function validateForm(): boolean {
    let isValid = true;

    const title = taskTitleInput.value.trim();
    if (title.length < 3) {
        titleError.textContent = "Title must be at least 3 characters";
        titleError.classList.remove("d-none");
        taskTitleInput.classList.add("input-error");
        isValid = false;
    } else {
        titleError.classList.add("d-none");
        taskTitleInput.classList.remove("input-error");
    }

    const todayStr = getDateString(new Date());
    if (taskDueDateInput.value && taskDueDateInput.value < todayStr) {
        dueDateError.textContent = "Due date cannot be in the past";
        dueDateError.classList.remove("d-none");
        taskDueDateInput.classList.add("input-error");
        isValid = false;
    } else {
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

    const newTask: Task = {
        title: taskTitleInput.value.trim(),
        description: taskDescriptionInput.value.trim(),
        priority: taskPriorityInput.value as "low" | "medium" | "high",
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

function editTask(index: number) {
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
    tasks[editingIndex].priority = taskPriorityInput.value as "low" | "medium" | "high";
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
(window as any).startTask = startTask;
(window as any).completeTask = completeTask;
(window as any).revertTask = revertTask;
(window as any).editTask = editTask;
(window as any).deleteTask = deleteTask;