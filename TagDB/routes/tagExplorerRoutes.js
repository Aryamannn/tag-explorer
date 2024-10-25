// const path = require('path')
const express = require('express');
const router = express.Router();
const db = require('./db');

// app.use(express.static(path.join(__dirname, 'public')));


// Route to render the tag explorer page
// Route to render the tag explorer page
router.get("/", (req, res) => {
    const sqlTags = 'SELECT * FROM tags'; // Query to get all tags
    db.query(sqlTags, (err, tagResults) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Database error");
        }

        // Query to get all tag values with corresponding tag ID
        const sqlTagValues = 'SELECT * FROM tag_values';
        db.query(sqlTagValues, (err, tagValueResults) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Database error");
            }

            // Combine tags and their values
            const tagsWithValues = tagResults.map(tag => {
                return {
                    ...tag,
                    tag_values: tagValueResults.filter(value => value.tag_id === tag.tag_id) // Match on tag_id
                };
            });

            // Query to get all files
            const sqlFiles = 'SELECT * FROM files';
            db.query(sqlFiles, (err, fileResults) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Database error");
                }

                console.log(JSON.stringify(tagsWithValues, null, 2));
                console.log(JSON.stringify(fileResults, null, 2)); // Log files for debugging
                
                // Render the view with both tags and files
                res.render("tag-explorer", { tags: tagsWithValues, files: fileResults });
            });
        });
    });
});


module.exports = router;
