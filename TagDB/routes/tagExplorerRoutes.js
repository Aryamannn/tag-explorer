const express = require('express');
const router = express.Router();

// Route to render the tag explorer page
router.get("/", (req, res) => {
    console.log("testing")
    res.render("tag-explorer");
    // res.send("Welcome to the Tag Explorer API. Go to /tag-explorer to view the tag explorer.");

});

module.exports = router;
