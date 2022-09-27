//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const imgur = require('imgur-uploader');
const fs = require("fs")
const fileupload = require("express-fileupload");
const loadsh = require("lodash")

// For database connection
const { Client } = require("pg");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(fileupload());


/*-------------------------------------------
                Global Variables
  -------------------------------------------*/

// DB credentials
const client = new Client({
    host: "tiny.db.elephantsql.com",
    user: "ygxvpnte",
    port: "5432",
    password: "Z76TPbkGhluY1P4yj_ZuERcNC3HuiMcQ",
    database: "ygxvpnte",
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 0
});

client.connect();


/*-------------------------------------------
                Home route
  -------------------------------------------*/
app.get("/", function (req, res) {
    client.query("Select * from BookData").then((results) => {
        res.render("home", { books: results.rows });
    });
});


/*-------------------------------------------
                Add Book Route
  -------------------------------------------*/
app.get("/add", function (req, res) {
    res.render("add");
});


/*-------------------------------------------
                Upload Route
  -------------------------------------------*/
app.post("/upload", function (req, res) {
    if (!req.files) {
        return res.status(400).send("No files Found!");
    }
    let myfile = req.files.thumbnail;
    let uploadPath = __dirname + "/uploads/" + myfile.name;
    myfile.mv(uploadPath, function (err) {
        if (err) console.log("Error!");

        imgur(fs.readFileSync(uploadPath)).then(data => {

            let bookTitle = req.body.bookTitle;
            let bookRoute = req.body.bookRoute;
            let imageSrc = data.link;
            let folderUrl = req.body.bookLink;

            client.query("Insert into BookData(book_title, book_route, book_image_src, book_folderlink) values($1,$2,$3,$4)", [bookTitle, bookRoute, imageSrc, folderUrl]).then(data => {
                console.log(data);
            });
            fs.unlinkSync(uploadPath);
            res.redirect("/");
        });
    });

});


/*-------------------------------------------
                Display Book Route
  -------------------------------------------*/
app.get("/posts/:postId", function (req, res) {
    client.query("Select * from BookData").then((results) => {
        let booksData = results.rows;
        let bookTitle = loadsh.lowerCase(req.params.postId);
        for (let i = 0; i < booksData.length; i++) {
            if (bookTitle === booksData[i].book_route) {
                res.render("posts", { bookData: booksData[i] });
            }
        }
    });
});



app.listen(process.env.PORT, function () {
    console.log("Server is running on port 3000!");
});
