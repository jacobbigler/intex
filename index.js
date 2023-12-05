//Section 03, Group 11
//Jacob Bigler, Andrew Hunsaker, Javier De los Reyes, Joseph Flake
//This page handles requests and responses to and from the server.

//Define Constants:
const ENV_VARIABLES = {
    dbHost: process.env.DATABASE_HOST,
    dbUser: process.env.DATABASE_USER,
    dbPassword: process.env.DATABASE_PASSWORD,
    dbName: process.env.DATABASE_NAME,
    appPort: parseInt(process.env.PORT)
};
const port = process.env.PORT || 3000;
const path = require("path");


//Define & Configure Express:
let express = require("express");
let app = express();

// Serve static files from the "content" directory
app.use(express.static('content'));

// Parse incoming requests:
app.use(express.urlencoded({ extended: true }));

//Define EJS location:
app.set("view engine", "ejs");

console.log("Server is running.");

//Activate listener:
app.listen(port, () => console.log("Server is running."));


//Connect to database using knex
const knex = require("knex")({
    client: "pg",
    connection: { //RDS is for connecting to the DB in Elastic Beanstalk
        host: process.env.RDS_HOSTNAME || ENV_VARIABLES.dbHost,
        user: process.env.RDS_USERNAME || ENV_VARIABLES.dbUser,
        password: process.env.RDS_PASSWORD || ENV_VARIABLES.dbPassword,
        database: process.env.RDS_DB_NAME || ENV_VARIABLES.dbName,
        port: process.env.RDS_PORT || 5432,
        ssl: process.env.DB_SSL ? {rejectUnauthorized: false} : false
    }
})

//GET requests below:

app.get("/survey", (req, res) => {
    knex.select().from("user-input").then( userInput => {
        res.render("survey", { myuser : userInput });
    });
});


app.post('/survey', (req, res) => {
    knex('TABLE NAME').insert({
        age:
        req.body.age
    })
})