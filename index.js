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
const session = require('express-session');
const ejs = require("ejs");

//middleware function that checks the authenticated variable
const authenticateMiddleware = (req, res, next) => {
  if (req.session && req.session.authenticated) {
    // User is authenticated, allow access to the next middleware or route
    next();
  } else {
    // User is not authenticated, redirect to a login page or send an error response
    res.status(401).json({ error: 'Authentication required' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.session && req.session.admin) {
    // User is authenticated, allow access to the next middleware or route
    next();
  } else {
    // User is not authenticated, redirect to a login page or send an error response
    res.status(401).json({ error: 'Admin authentication required' });
  }
};

//Define & Configure Express:
let express = require("express");
let app = express();

// Serve static files from the "content" directory
app.use(express.static('content'));

// Parse incoming requests:
app.use(express.urlencoded({ extended: true }));

//use the session
app.use(
  session({
    secret: 'intex',
    resave: true,
    saveUninitialized: true,
  })
);

// Custom middleware to set authenticated and admin variables
app.use((req, res, next) => {
  const isAuthenticated = req.session && req.session.authenticated;
  const isAdmin = req.session && req.session.admin;

  // Make the authenticated and admin variables available to all views
  res.locals.authenticated = isAuthenticated;
  res.locals.admin = isAdmin;

  // Continue to the next middleware
  next();
});

//Define EJS location:
app.set("view engine", "ejs");
//Define views location
app.set('views', __dirname + '/views');


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

// Function to get unique user IDs
async function getUniqueAndSortedUserIds() {
  const userIds = await knex.select('user_id').from('user_inputs');
  const uniqueUserIds = [...new Set(userIds.map(entry => entry.user_id))];
  const sortedUserIds = uniqueUserIds.sort((a, b) => a - b);
  return sortedUserIds;
}

app.get("/report", authenticateMiddleware, async (req, res) => {
  try {
    // Fetch unique and sorted user IDs
    const sortedUserIds = await getUniqueAndSortedUserIds();

    // Fetch survey results based on the selected user ID from the request or use the first user ID by default
    const selectedUserId = 'all';
    const surveyResults = await fetchSurveyResults(selectedUserId);

    // Render the report page with survey results, unique and sorted user IDs
    res.render("report", { myuser: surveyResults, sortedUserIds: sortedUserIds, selectedUserId: selectedUserId });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post("/report", authenticateMiddleware, async (req, res) => {
  try {
    // Fetch unique and sorted user IDs
    const sortedUserIds = await getUniqueAndSortedUserIds();

    // Fetch survey results based on the selected user ID from the request
    const selectedUserId = req.body.userIdFilter;
    const surveyResults = await fetchSurveyResults(selectedUserId);

    // Render the report page with survey results, unique and sorted user IDs
    res.render("report", { myuser: surveyResults, sortedUserIds: sortedUserIds, selectedUserId: selectedUserId });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Extract the common logic for fetching survey results
async function fetchSurveyResults(userId) {
  let query = knex.select(
    "u.user_id",
    "u.timestamp",
    "u.city",
    "u.age",
    "u.gender",
    "u.relationship_status",
    "u.occupation_status",
    "oa.organization_affiliation",
    "u.social_media_use",
    "smp.social_media_platform",
    "u.time_usage",
    "r.use_without_purpose",
    "r.restless_without_social_media",
    "r.distracted_by_social_media",
    "r.easily_distracted",
    "r.bothered_by_worries",
    "r.concentration_difficulty",
    "r.compare_self_to_others",
    "r.opinions_about_comparisons",
    "r.seek_validation",
    "r.feel_depressed",
    "r.daily_activity_interest_fluctuations",
    "r.sleep_issues"
  ).from({ u: "user_inputs" })
    .join({ r: "ratings" }, "u.user_id", "=", "r.user_id")
    .join({ smp: "social_media_platforms" }, "u.user_id", "=", "smp.user_id")
    .join({ oa: "organization_affiliations" }, "u.user_id", "=", "oa.user_id");

  if (userId !== 'all') {
    query = query.where("u.user_id", userId);
  }

  return query;
}

app.get("/", (req, res) => { //shows landing page
  res.render('index');
    });

app.get("/survey", (req, res) => { //shows survey page
    res.render("survey");
});

app.get("/login", (req, res) => { //shows login page
  res.render("login");
});



app.get("/surveythanks", (req, res) => { //shows surveythanks page
  res.render("surveythanks");
});

app.get("/", (req, res) => { //shows index page
  res.render("index");
});

app.post('/survey', async (req, res) => {
  const trx = await knex.transaction();

  try {
    // Insert data into 'user_inputs' table
    const [userObject] = await knex('user_inputs')
      .transacting(trx)
      .insert({
        timestamp: knex.fn.now(),
        city: 'Provo',
        age: req.body.age,
        gender: req.body.gender,
        relationship_status: req.body.relationship,
        occupation_status: req.body.occupation,
        social_media_use: req.body.use_social_media,
        time_usage: req.body.time_spent,
      })
      .returning('user_id');

    const userId = userObject.user_id;

    // Insert data into 'ratings' table
    await knex('ratings')
      .transacting(trx)
      .insert({
        user_id: userId,
        timestamp: knex.fn.now(),
        age: req.body.age,
        gender: req.body.gender,
        relationship_status: req.body.relationship,
        use_without_purpose: req.body.use_without_purpose,
        distracted_by_social_media: req.body.distracted_by_social_media,
        restless_without_social_media: req.body.restless_without_social_media,
        easily_distracted: req.body.easily_distracted,
        bothered_by_worries: req.body.bothered_by_worries,
        concentration_difficulty: req.body.concentration_difficulty,
        compare_self_to_others: req.body.compare_self_to_others,
        opinions_about_comparisons: req.body.opinions_about_comparisons,
        seek_validation: req.body.seek_validation,
        feel_depressed: req.body.feel_depressed,
        daily_activity_interest_fluctuations: req.body.daily_activity_interest_fluctuations,
        sleep_issues: req.body.sleep_issues,
      });

    // Insert data into 'social_media_platforms' table for each platform
    const socialMediaPlatforms = req.body.social_media_platforms;
    for (const platform of socialMediaPlatforms) {
      await knex('social_media_platforms')
        .transacting(trx)
        .insert({
          user_id: userId,
          timestamp: knex.fn.now(),
          age: req.body.age,
          gender: req.body.gender,
          relationship_status: req.body.relationship,
          social_media_platform: platform,
        });
    }

    // Insert data into 'organization_affiliations' table for each organization
    const organizationAffiliations = req.body.organizations;
    for (const organization of organizationAffiliations) {
      await knex('organization_affiliations')
        .transacting(trx)
        .insert({
          user_id: userId,
          timestamp: knex.fn.now(),
          age: req.body.age,
          gender: req.body.gender,
          relationship_status: req.body.relationship,
          organization_affiliation: organization,
        });
    }

    // Commit the transaction if all inserts are successful
    await trx.commit();

    res.redirect('/surveythanks');
  } catch (error) {
    // Rollback the transaction if there's an error
    await trx.rollback();
    console.error('Error inserting data:', error);
    res.status(500).send('Internal Server Error');
  }
});

//gets page full of all accounts created
 app.get("/usernames", adminMiddleware, (req, res) => {
  knex.select().from("login").then(userInput => {
    res.render("usernames", {myuser: userInput});
  })
 });

 //deletes chosen account
 app.post("/deleteUser/:id", (req, res) => {
  knex("login").where("username",req.params.id).del().then( myuser => {
    res.redirect("/usernames");
 }).catch( err => {
    console.log(err);
    res.status(500).json({err});
 });
});

 app.post("/register", async (req, res) => {
  try {
    const existingUser = await knex("login").where({ username: req.body.username }).first();

    if (existingUser) {
      // Username already exists, return an error response
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Username doesn't exist, proceed with registration
    await knex("login").insert({
      username: req.body.username,
      password: req.body.password
    });

    res.redirect("/register");

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if the provided credentials match the admin credentials
    if (username === 'admin' && password === 'intexfun') {
      // Set flags in the session to identify the user as an admin and authenticated
      req.session.admin = true;
      req.session.authenticated = true;

      // Redirect to the admin dashboard or another admin-specific page
      return res.redirect("/");
    }

    // Query the database to get user information
    const user = await knex("login").where({ username }).first();

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Compare the provided password with the stored password from the database
    if (password !== user.password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    };

    req.session.authenticated = true;

    res.redirect("/")
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

//to logout and invalidate the authentication
app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
    } else {
      res.redirect('/');
    }
  });
})

app.get("/register", adminMiddleware, (req, res) => {
  res.render("register");
});

