// const express = require('express');
// const router = express.Router();
// const db = require('./db');

// router.get("/", (req, res) => {
//     const sqlTags = 'SELECT * FROM tags'; // Query to get all tags
//     db.query(sqlTags, (err, tagResults) => {
//         if (err) {
//             console.error(err);
//             return res.status(500).send("Database error");
//         }

//         // Query to get all tag values with corresponding tag ID
//         const sqlTagValues = 'SELECT * FROM tag_values';
//         db.query(sqlTagValues, (err, tagValueResults) => {
//             if (err) {
//                 console.error(err);
//                 return res.status(500).send("Database error");
//             }

//             // Combine tags and their values
//             const tagsWithValues = tagResults.map(tag => {
//                 return {
//                     ...tag,
//                     tag_values: tagValueResults.filter(value => value.tag_id === tag.tag_id) // Match on tag_id
//                 };
//             });

//             console.log(JSON.stringify(tagsWithValues, null, 2))          
//             res.render("manage-tags", { tags: tagsWithValues });
//         });
//     });
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('./db');
const axios = require('axios');

// Route to render the manage tags page
router.get("/", async (req, res) => {
   
    try {
        const [tagsResponse, tagValuesResponse] = await Promise.all([
            axios.get('http://localhost:3000/tags'),
            axios.get('http://localhost:3000/tag_values'),

        ]);

        const tags = tagsResponse.data;
        const tagValues = tagValuesResponse.data;

        console.log("tags:", tags); // Logs the full tags array
        console.log("tagvalues:", tagValues); // Logs the full tagValues array
        res.render('manage-tags', { tags, tagValues });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});
module.exports = router;
