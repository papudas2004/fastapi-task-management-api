from pathlib import Path
from fastapi import FastAPI, HTTPException, status, Response
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(title="Task Management API")

# Request model for creating or updating a task
class TaskCreate(BaseModel):
    title: str
    description: str = ""
    completed: bool = False

# Response model representing a complete task with an ID
class Task(BaseModel):
    id: int
    title: str
    description: str
    completed: bool

# In-memory storage for tasks (no database)
tasks: list[Task] = []
id_counter = 1

# Mount static assets
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Favicon endpoint to avoid 404 in browser
@app.get("/favicon.ico", include_in_schema=False)
def favicon():
    icon_file = STATIC_DIR / "favicon.svg"
    if icon_file.exists():
        return Response(content=icon_file.read_bytes(), media_type="image/svg+xml")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# 1. Serve Frontend UI at root
@app.get("/", response_class=HTMLResponse)
def get_home():
    html_file = STATIC_DIR / "index.html"
    if html_file.exists():
        return HTMLResponse(content=html_file.read_text(encoding="utf-8"))
    return HTMLResponse("<h2>Task Flow UI loading...</h2>")

# 2. API info endpoint
@app.get("/api")
def api_info():
    return {
        "message": "Welcome to the Task Management API",
        "docs_url": "/docs",
        "total_tasks": len(tasks)
    }

# 3. Get all tasks
@app.get("/tasks", response_model=list[Task])
def get_tasks():
    return tasks

# 4. Get a specific task by ID
@app.get("/tasks/{task_id}", response_model=Task)
def get_task(task_id: int):
    for task in tasks:
        if task.id == task_id:
            return task
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

# 5. Create a new task
@app.post("/tasks", response_model=Task, status_code=status.HTTP_201_CREATED)
def create_task(task_data: TaskCreate):
    global id_counter
    new_task = Task(
        id=id_counter,
        title=task_data.title,
        description=task_data.description,
        completed=task_data.completed
    )
    id_counter += 1
    tasks.append(new_task)
    return new_task

# 6. Update an existing task
@app.put("/tasks/{task_id}", response_model=Task)
def update_task(task_id: int, task_data: TaskCreate):
    for index, task in enumerate(tasks):
        if task.id == task_id:
            updated_task = Task(
                id=task_id,
                title=task_data.title,
                description=task_data.description,
                completed=task_data.completed
            )
            tasks[index] = updated_task
            return updated_task
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

# 7. Delete a task
@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    for index, task in enumerate(tasks):
        if task.id == task_id:
            tasks.pop(index)
            return {"message": "Task deleted successfully"}
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
