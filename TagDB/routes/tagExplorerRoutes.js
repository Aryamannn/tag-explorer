const express = require('express');
const router = express.Router();
const db = require('./db');
const axios = require('axios');

// Route to render the tag explorer page
router.get("/", async (req, res) => {
    // const sqlTags = 'SELECT * FROM tags'; // Query to get all tags
    // db.query(sqlTags, (err, tagResults) => {
    //     if (err) {
    //         console.error(err);
    //         return res.status(500).send("Database error");
    //     }

    //     // Query to get all tag values with corresponding tag ID
    //     const sqlTagValues = 'SELECT * FROM tag_values';
    //     db.query(sqlTagValues, (err, tagValueResults) => {
    //         if (err) {
    //             console.error(err);
    //             return res.status(500).send("Database error");
    //         }

    //         // Combine tags and their values
    //         const tagsWithValues = tagResults.map(tag => {
    //             return {
    //                 ...tag,
    //                 tag_values: tagValueResults.filter(value => value.tag_id === tag.tag_id) // Match on tag_id
    //             };
    //         });

    //         console.log(JSON.stringify(tagsWithValues, null, 2))          
    //         res.render("tag-explorer", { tags: tagsWithValues });
    //     });
    // });
    try {
        const [tagsResponse, tagValuesResponse,defaultTagsResponse] = await Promise.all([
            axios.get('http://localhost:3000/tags'),
            axios.get('http://localhost:3000/tag_values'),
            axios.get('http://localhost:3000/default-tags') // Fetching default tags from the new API

        ]);

        const tags = tagsResponse.data;
        const tagValues = tagValuesResponse.data;
        const defaultTags = defaultTagsResponse.data;

        console.log("tags:", tags); // Logs the full tags array
        console.log("tag-values:", tagValues); // Logs the full tagValues array
        console.log("default tags:", defaultTags); // Logs the full defaultTags array
        res.render('tag-explorer', { tags, tagValues , defaultTags});
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});
router.get("/autocomplete", async (req, res) => {
    try {
        const tagsResponse = await axios.get('http://localhost:3000/tags');
        const tagNames = tagsResponse.data.map(tag => tag.tag_name); // Extract tag names only
        res.json(tagNames);
    } catch (error) {
        console.error("Error fetching autocomplete tags:", error);
        res.status(500).send("Server error");
    }
});
module.exports = router;
