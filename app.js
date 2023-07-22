const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite = require("sqlite3");
const path = require("path");
const dbPath = (__dirname, "todoApplication.db");
let db = null;

const initializeDataBaseAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite.Database,
    });

    app.listen(3000, () => {
      console.log("Server Started");
    });
  } catch (error) {
    console.log(`DB error: ${error.message}`);
    process.exit(1);
  }
};

initializeDataBaseAndServer();

const statusAndPriorityCheck = (queryValues) => {
  return queryValues.status !== undefined && queryValues.priority !== undefined;
};

const statusCheck = (queryValues) => {
  return queryValues.status !== undefined;
};

const priorityCheck = (queryValues) => {
  return queryValues.priority !== undefined;
};

// API 1 Get All Todos Data from todo tale

app.get("/todos/", async (request, response) => {
  const { status, priority, search_q = "" } = request.query;

  let getTodosQuery = null;

  switch (true) {
    //   Scenario 1 Get Todos based on "Status & Priority" Query Parameter
    case statusAndPriorityCheck(request.query):
      getTodosQuery = `
        SELECT 
          *
        FROM
            todo
        WHERE
            priority LIKE "%${priority}%" AND
            status LIKE "%${status}%" AND
            todo LIKE "%${search_q}%"
          `;
      break;

    //   Scenario 2 Get Todos based on "Status" Query Parameter
    case statusCheck(request.query):
      getTodosQuery = `
        SELECT 
        *
        FROM
            todo
        WHERE
            todo LIKE "%${search_q}%" AND
            status LIKE "%${status}%"
        `;
      break;

    //   Scenario 3 Get Todos based on "Priority" Query Parameter
    case priorityCheck(request.query):
      getTodosQuery = `
        SELECT 
            *
        FROM
            todo
        WHERE
            todo LIKE "%${search_q}%" AND
            priority LIKE "%${priority}%"
        `;
      break;

    //   Scenario 4 Get Todos based on "Search_q" Query Parameter
    default:
      getTodosQuery = `
        SELECT 
            *
        FROM
            todo
        WHERE
            todo LIKE "%${search_q}%"
        `;
  }

  const responseData = await db.all(getTodosQuery);
  response.send(responseData);
});

// API 2 Get Specific todo data based on todo ID from todo table

app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;

  const todoItemQuery = `
    SELECT 
        *
    FROM
        todo
    WHERE
        id = ${todoId}    
    `;
  const responseData = await db.get(todoItemQuery);
  response.send(responseData);
});

// API 3 Create a New Todo Item in Todo Table

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const createTodoQuery = `
    INSERT INTO
        todo (id,todo,priority,status)
    VALUES
        (${id},"${todo}","${priority}","${status}")
    `;
  const responseData = await db.run(createTodoQuery);
  response.send("Todo Successfully Added");
});

// API 4 Update a specific todo Item based on todo id

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoItemQuery = `SELECT * FROM todo WHERE id=${todoId}`;
  const todoItemData = await db.get(getTodoItemQuery);

  const updateTodoData = request.body;

  let responseStatus = null;

  //   Generating todo response status according to todo Key
  switch (true) {
    case updateTodoData.status !== undefined:
      responseStatus = "Status";
      break;

    case updateTodoData.priority !== undefined:
      responseStatus = "Priority";
      break;

    case updateTodoData.todo !== undefined:
      responseStatus = "Todo";
      break;
  }

  //   Assigning default values it will replace by based on request body.Default values are from given todoId item data
  const {
    status = todoItemData.status,
    priority = todoItemData.priority,
    todo = todoItemData.todo,
  } = request.body;

  const updateTodoItemQuery = `
        UPDATE
            todo
        SET
            status = "${status}",
            priority = "${priority}",
            todo = "${todo}"
        WHERE
            id = ${todoId}
        `;

  await db.run(updateTodoItemQuery);
  response.send(`${responseStatus} Updated`);
});

// API 5 Delete a specific todo item based on todo id

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const deleteTodoItemQuery = `
    DELETE FROM
        todo
    WHERE
        id = ${todoId}
    `;

  await db.run(deleteTodoItemQuery);
  response.send("Todo Deleted");
});

module.exports = app;
